// Auto-migration au démarrage : crée toutes les tables si elles n'existent pas.
// Idempotent — safe à exécuter plusieurs fois.
// Utilisé en production (Railway) car on n'a pas accès à psql directement.

const fs = require('fs');
const path = require('path');
const { query } = require('./index');

async function autoMigrate() {
  try {
    const exists = await query("SELECT to_regclass('public.profile') AS r");
    const profileExists = !!exists.rows[0].r;

    if (!profileExists) {
      console.log('[Migrate] Profile table not found — running schema.sql...');
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
      const stmts = schema.split(/;\s*\n/).map(s => s.trim()).filter(s => s && !s.startsWith('--'));
      for (const s of stmts) {
        try { await query(s); } catch (e) { /* ignore "already exists" */ }
      }
      console.log('[Migrate] Schema applied');
    }

    // Idempotent ALTERs (colonnes ajoutées au fil du temps)
    await query('ALTER TABLE profile ADD COLUMN IF NOT EXISTS whatsapp TEXT');

    // Page visits tracking (one row per visit, deduplicated by IP+day in stats)
    await query(`CREATE TABLE IF NOT EXISTS page_views (
      id BIGSERIAL PRIMARY KEY,
      path TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      referer TEXT,
      visited_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await query('CREATE INDEX IF NOT EXISTS idx_page_views_visited_at ON page_views(visited_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_page_views_ip_day ON page_views(ip, (visited_at::date))');

    // Note : les anciennes tables de la marketplace CV (users, cv_templates,
    // cv_template_purchases, cv_drafts) ne sont plus créées. Elles ne sont pas
    // supprimées pour ne perdre aucune donnée existante.

    await query(`CREATE TABLE IF NOT EXISTS media_assets (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT,
      mime_type TEXT,
      size_bytes INT,
      url TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      alt_text TEXT,
      uploaded_by INT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      company TEXT,
      message TEXT NOT NULL,
      rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
      photo_url TEXT,
      relation TEXT,
      email TEXT,
      is_approved BOOLEAN DEFAULT FALSE,
      is_featured BOOLEAN DEFAULT FALSE,
      display_order INT DEFAULT 0,
      ip_address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
    )`);

    // Bootstrap admin user from env vars if missing
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const existing = await query('SELECT id FROM admin_users WHERE username = $1', [adminUsername]);
      if (!existing.rows.length) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(adminPassword, 12);
        await query(
          'INSERT INTO admin_users (username, password_hash, email) VALUES ($1, $2, $3)',
          [adminUsername, hash, process.env.EMAIL_TO || null]
        );
        console.log(`[Migrate] Admin user "${adminUsername}" bootstrapped from env`);
      }
    } else {
      console.warn('[Migrate] ADMIN_PASSWORD not set — admin user NOT created. Set it in Railway env.');
    }

    // Bootstrap minimal profile row if missing (so /api/profile doesn't return null)
    const profileExists2 = await query('SELECT id FROM profile LIMIT 1');
    if (!profileExists2.rows.length) {
      await query(`
        INSERT INTO profile (name, first_name, email, title, subtitle, tagline, bio)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb)
      `, [
        'Saleh Mahamat Saleh',
        'Saleh',
        'salehmhtsaleh224@gmail.com',
        '{"fr":"Étudiant en Cybersécurité & Développeur Full-Stack","en":"Cybersecurity Student & Full-Stack Developer","ar":"طالب أمن سيبراني ومطور Full-Stack"}',
        '{"fr":"DUT 2ème Année · EST Safi","en":"2nd Year DUT · EST Safi","ar":"السنة الثانية DUT · المدرسة العليا للتكنولوجيا آسفي"}',
        '{"fr":"Construire des systèmes sûrs, du code propre, et des solutions qui durent.","en":"Building secure systems, clean code, and lasting solutions.","ar":"بناء أنظمة آمنة وأكواد نظيفة وحلول دائمة."}',
        '{"fr":"Étudiant passionné par la cybersécurité et le développement full-stack. Je construis des solutions sécurisées et performantes.","en":"Passionate student in cybersecurity and full-stack development. I build secure and performant solutions.","ar":"طالب شغوف بالأمن السيبراني والتطوير الشامل."}',
      ]);
      console.log('[Migrate] Default profile created');
    }

    // One-shot import of real CV content — runs ONLY if experience table is empty
    try {
      const expCount = await query('SELECT COUNT(*)::int AS n FROM experience');
      console.log(`[Migrate] Experience table currently has ${expCount.rows[0].n} rows`);
      if (expCount.rows[0].n === 0) {
        const importPath = path.join(__dirname, 'production-import.sql');
        console.log(`[Migrate] Looking for ${importPath}`);
        if (fs.existsSync(importPath)) {
          const sql = fs.readFileSync(importPath, 'utf-8');
          console.log(`[Migrate] Read ${sql.length} chars from production-import.sql — executing...`);
          try {
            await query(sql);
            console.log('[Migrate] ✅ CV content import SUCCESS');
          } catch (sqlErr) {
            console.error('[Migrate] ❌ SQL execution failed:', sqlErr.message);
            console.error('[Migrate] Error detail:', sqlErr.detail || '(no detail)');
            console.error('[Migrate] Error hint:', sqlErr.hint || '(no hint)');
            console.error('[Migrate] Error position:', sqlErr.position || '(no position)');
            // Try to rollback in case transaction is still open
            try { await query('ROLLBACK'); } catch {}
          }
        } else {
          console.warn('[Migrate] ⚠️ production-import.sql NOT FOUND in container');
        }
      } else {
        console.log('[Migrate] Skipping CV import — experience already populated');
      }
    } catch (e) {
      console.error('[Migrate] CV check failed:', e.message);
    }

    // Replace em-dashes (—) with regular dashes (-) in all user-visible texts (one-time normalization)
    try {
      await query("UPDATE profile SET title    = REPLACE(title::text,    '—', '-')::jsonb WHERE title::text    LIKE '%—%'");
      await query("UPDATE profile SET subtitle = REPLACE(subtitle::text, '—', '-')::jsonb WHERE subtitle::text LIKE '%—%'");
      await query("UPDATE profile SET tagline  = REPLACE(tagline::text,  '—', '-')::jsonb WHERE tagline::text  LIKE '%—%'");
      await query("UPDATE profile SET bio      = REPLACE(bio::text,      '—', '-')::jsonb WHERE bio::text      LIKE '%—%'");
      await query("UPDATE experience    SET role        = REPLACE(role::text,        '—', '-')::jsonb WHERE role::text        LIKE '%—%'");
      await query("UPDATE experience    SET description = REPLACE(description::text, '—', '-')::jsonb WHERE description::text LIKE '%—%'");
      await query("UPDATE education     SET degree      = REPLACE(degree::text,      '—', '-')::jsonb WHERE degree::text      LIKE '%—%'");
      await query("UPDATE projects      SET subtitle    = REPLACE(subtitle::text,    '—', '-')::jsonb WHERE subtitle::text    LIKE '%—%'");
      await query("UPDATE projects      SET description = REPLACE(description::text, '—', '-')::jsonb WHERE description::text LIKE '%—%'");
      await query("UPDATE activities    SET title       = REPLACE(title::text,       '—', '-')::jsonb WHERE title::text       LIKE '%—%'");
      await query("UPDATE activities    SET description = REPLACE(description::text, '—', '-')::jsonb WHERE description::text LIKE '%—%'");
      await query("UPDATE certifications SET name = REPLACE(name, '—', '-') WHERE name LIKE '%—%'");
      await query("UPDATE skills        SET name = REPLACE(name, '—', '-') WHERE name LIKE '%—%'");
    } catch (e) {
      console.warn('[Migrate] Em-dash replacement skipped:', e.message);
    }

    // Force-update profile email to the official address (idempotent)
    try {
      await query(
        "UPDATE profile SET email = 'salehmhtsaleh224@gmail.com' WHERE email IS DISTINCT FROM 'salehmhtsaleh224@gmail.com'"
      );
    } catch (e) {
      console.error('[Migrate] Profile email update failed:', e.message);
    }

    // Portfolio project: add if missing, and strip old CV-marketplace wording (idempotent)
    try {
      const portfolioText = [
        JSON.stringify({fr:'Site personnel avec chatbot IA', en:'Personal site with AI chatbot', ar:'موقع شخصي مع محادثة ذكاء اصطناعي'}),
        JSON.stringify({fr:"Portfolio full-stack avec chatbot intelligent propulsé par Claude API, espace admin complet et contenu multilingue FR/EN/AR.", en:"Full-stack portfolio with a Claude API chatbot, a full admin dashboard and FR/EN/AR content.", ar:"موقع شخصي شامل مع شات بوت ذكي مدعوم بـ Claude API، لوحة إدارة كاملة، ومحتوى متعدد اللغات."}),
        JSON.stringify({fr:"Plateforme construite avec Next.js (SSR) déployée sur Vercel, et un backend Express + PostgreSQL hébergé sur Railway. Tout le contenu (profil, projets, compétences, parcours, témoignages) est modifiable depuis un espace admin sécurisé. Le chatbot utilise l'API Claude pour répondre aux visiteurs en 3 langues.", en:"Built with Next.js (SSR) on Vercel and Express + PostgreSQL on Railway. All content (profile, projects, skills, experience, testimonials) is editable from a secure admin dashboard. The chatbot uses the Claude API and answers visitors in 3 languages.", ar:"تم بناؤه باستخدام Next.js على Vercel و Express + PostgreSQL على Railway. كل المحتوى قابل للتعديل من لوحة إدارة آمنة. الشات بوت يعمل بـ Claude API ويجيب بثلاث لغات."}),
        JSON.stringify({fr:["Chatbot Claude API multilingue","Espace admin pour gérer tout le contenu","Authentification JWT admin","Témoignages et statistiques de visites","Site trilingue FR/EN/AR avec RTL"], en:["Multilingual Claude API chatbot","Admin dashboard to manage all content","JWT admin authentication","Testimonials and visitor analytics","Trilingual FR/EN/AR site with RTL"], ar:["شات بوت متعدد اللغات بـ Claude","لوحة إدارة لكل المحتوى","مصادقة JWT للمشرف","شهادات وإحصائيات الزوار","موقع بثلاث لغات مع دعم RTL"]}),
      ];
      const portfolioExists = await query("SELECT id FROM projects WHERE slug = 'portfolio' LIMIT 1");
      if (!portfolioExists.rows.length) {
        await query(
          `INSERT INTO projects (slug, title, subtitle, description, long_description, category, highlights, tech, color, icon, github_url, featured, display_order)
           VALUES ('portfolio', 'Portfolio Personnel',
             $1::jsonb, $2::jsonb, $3::jsonb,
             'Full-Stack',
             $4::jsonb,
             ARRAY['Next.js','Express','PostgreSQL','Claude API','Tailwind'],
             '#c8a96e', 'code',
             'https://github.com/SALEH9833/portfolio',
             true, 3
           )`,
          portfolioText
        );
        console.log('[Migrate] ✅ Portfolio project added');
      } else {
        const upd = await query(
          `UPDATE projects
             SET subtitle = $1::jsonb, description = $2::jsonb, long_description = $3::jsonb,
                 highlights = $4::jsonb, tech = array_remove(tech, 'PayPal')
           WHERE slug = 'portfolio'
             AND (description::text ILIKE '%marketplace%' OR 'PayPal' = ANY(tech))`,
          portfolioText
        );
        if (upd.rowCount) console.log('[Migrate] Portfolio project text updated (CV marketplace removed)');
      }
    } catch (e) {
      console.error('[Migrate] Portfolio project insert failed:', e.message);
    }

    console.log('[Migrate] All tables ready');
  } catch (err) {
    console.error('[Migrate] Failed:', err.message);
    // Don't throw — let the server start anyway so we can debug via logs
  }
}

module.exports = { autoMigrate };
