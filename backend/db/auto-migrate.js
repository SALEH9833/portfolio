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

    await query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      email_verified BOOLEAN DEFAULT FALSE,
      verification_token TEXT,
      verification_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
    )`);
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)');

    await query(`CREATE TABLE IF NOT EXISTS cv_templates (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      style TEXT,
      preview_url TEXT,
      edit_url TEXT,
      view_url TEXT,
      builder_id TEXT,
      is_premium BOOLEAN DEFAULT FALSE,
      price NUMERIC(10,2) DEFAULT 0,
      currency TEXT DEFAULT 'EUR',
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      display_order INT DEFAULT 0,
      downloads INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS cv_template_purchases (
      id SERIAL PRIMARY KEY,
      template_id INT REFERENCES cv_templates(id) ON DELETE SET NULL,
      template_slug TEXT NOT NULL,
      template_name TEXT NOT NULL,
      paypal_order_id TEXT UNIQUE NOT NULL,
      payer_email TEXT,
      payer_name TEXT,
      amount NUMERIC(10,2) NOT NULL,
      currency TEXT DEFAULT 'EUR',
      status TEXT NOT NULL DEFAULT 'pending',
      canva_edit_url TEXT,
      delivered_at TIMESTAMPTZ,
      ip_address TEXT,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS cv_drafts (
      id SERIAL PRIMARY KEY,
      user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '{}',
      template_id TEXT,
      color TEXT,
      last_step INT DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

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

    // Bootstrap CV templates — idempotent upsert at every startup
    {
      const templates = [
        { slug: 'modern',   name: 'Modern',      description: 'Barre latérale colorée, design contemporain', category: 'Universel', style: 'modern',   preview_url: null, builder_id: 'modern',   is_premium: false, price: 0, order: 1 },
        { slug: 'classic',  name: 'Classique',   description: 'Sobre, ATS-friendly, parfait pour candidatures classiques', category: 'Universel', style: 'classic',  preview_url: null, builder_id: 'classic',  is_premium: false, price: 0, order: 2 },
        { slug: 'creative', name: 'Créatif',     description: 'Header coloré + timeline visuelle', category: 'Créatif',  style: 'creative', preview_url: null, builder_id: 'creative', is_premium: false, price: 0, order: 3 },
        { slug: 'minimal',  name: 'Minimaliste', description: 'Très épuré, typographie soignée', category: 'Universel', style: 'minimal',  preview_url: null, builder_id: 'minimal',  is_premium: false, price: 0, order: 4 },
        { slug: 'tech',     name: 'Tech / Dev',  description: 'Style terminal pour développeurs', category: 'Tech', style: 'tech',     preview_url: null, builder_id: 'tech',     is_premium: false, price: 0, order: 5 },
        { slug: 'elegant',     name: 'Élégant',          description: 'Variante minimaliste raffinée, typographie serif', category: 'Universel', style: 'minimal',  preview_url: null, builder_id: 'minimal',  is_premium: false, price: 0, order: 6 },
        { slug: 'corporate-free', name: 'Corporate Free', description: 'Style classique professionnel, ATS-friendly', category: 'Corporate', style: 'classic',  preview_url: null, builder_id: 'classic',  is_premium: false, price: 0, order: 7 },
        { slug: 'startup',     name: 'Startup',          description: 'Variante moderne dynamique pour profils startup', category: 'Tech', style: 'modern',   preview_url: null, builder_id: 'modern',   is_premium: false, price: 0, order: 8 },
        { slug: 'designer',    name: 'Designer',         description: 'Variante créative orientée portfolio', category: 'Créatif', style: 'creative', preview_url: null, builder_id: 'creative', is_premium: false, price: 0, order: 9 },
        { slug: 'developer',   name: 'Developer',        description: 'Variante tech orientée open-source / GitHub', category: 'Tech', style: 'tech',     preview_url: null, builder_id: 'tech',     is_premium: false, price: 0, order: 10 },
        { slug: 'canva-tech-2',     name: 'Tech Pro - Clean Blue',   description: 'CV professionnel avec accents bleus, fond blanc, parfait pour ingénieurs', category: 'Tech', style: 'canva', preview_url: 'https://design.canva.ai/MUBaZR1Wsa33tAp', edit_url: 'https://www.canva.com/d/5fGGYV7cRy4Wxui', is_premium: true, price: 4.99, tags: ['tech','propre','bleu'], order: 11 },
        { slug: 'canva-tech-3',     name: 'Tech Pro - Minimal Dev',  description: 'CV minimaliste pour développeur, espacement généreux', category: 'Tech', style: 'canva', preview_url: 'https://design.canva.ai/vjMNV51GEm9At0q', edit_url: 'https://www.canva.com/d/ptiL_mkPHmAkc0J', is_premium: true, price: 4.99, tags: ['tech','minimaliste'], order: 12 },
        { slug: 'canva-tech-4',     name: 'Tech Pro - Bold Orange',  description: 'CV tech audacieux avec accents orange et formes géométriques', category: 'Tech', style: 'canva', preview_url: 'https://design.canva.ai/_lZrUzlGar5l8LT', edit_url: 'https://www.canva.com/d/f0uycpB0sUng3ir', is_premium: true, price: 4.99, tags: ['tech','audacieux'], order: 13 },
        { slug: 'canva-creative-1', name: 'Créatif Magazine',        description: 'Layout magazine avec grande typographie pour marketers et designers', category: 'Créatif', style: 'canva', preview_url: 'https://design.canva.ai/ulqMdPn9ncCvbMn', edit_url: 'https://www.canva.com/d/IauuvsGkDEqFbVf', is_premium: true, price: 4.99, tags: ['créatif','marketing'], order: 20 },
        { slug: 'canva-creative-2', name: 'Créatif Pastel',          description: 'Palette pastel élégante, typographie serif raffinée', category: 'Créatif', style: 'canva', preview_url: 'https://design.canva.ai/MZjobhiEiAFeK5_', edit_url: 'https://www.canva.com/d/DIN_FUHTMbywCMu', is_premium: true, price: 4.99, tags: ['créatif','pastel'], order: 21 },
        { slug: 'canva-creative-3', name: 'Créatif Editorial',       description: 'Style éditorial avec vitrine portfolio intégrée', category: 'Créatif', style: 'canva', preview_url: 'https://design.canva.ai/nMEj1kzv_Nl10nr', edit_url: 'https://www.canva.com/d/nxbS0MCpSFF1U91', is_premium: true, price: 4.99, tags: ['créatif','portfolio'], order: 22 },
        { slug: 'canva-creative-4', name: 'Créatif Géométrique',     description: 'Formes géométriques colorées, parfait pour designers', category: 'Créatif', style: 'canva', preview_url: 'https://design.canva.ai/EZZuANhoFFvqp8K', edit_url: 'https://www.canva.com/d/2jW2Pj01iQ8zmRZ', is_premium: true, price: 4.99, tags: ['créatif','géométrique'], order: 23 },
        { slug: 'canva-corp-1',     name: 'Executive Classic',       description: 'CV cadre dirigeant avec typographie serif et accents navy', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/PBLqoiLnjIl7gVt', edit_url: 'https://www.canva.com/d/AYqTEj-ixKgJMtt', is_premium: true, price: 6.99, tags: ['corporate','dirigeant'], order: 30 },
        { slug: 'canva-corp-2',     name: 'Executive Modern Navy',   description: 'CV cadre moderne, palette marine, ATS-friendly', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/ucKQTHLaU3RiNrV', edit_url: 'https://www.canva.com/d/r-63YAR1Zkjx0wT', is_premium: true, price: 6.99, tags: ['corporate','marine'], order: 31 },
        { slug: 'canva-corp-3',     name: 'Consulting Refined',      description: 'CV consulting raffiné, palette grise sophistiquée', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/uaNM9xoHkzOu1vg', edit_url: 'https://www.canva.com/d/biJSGJY2A-MrDdg', is_premium: true, price: 6.99, tags: ['corporate','consulting'], order: 32 },
        { slug: 'canva-corp-4',     name: 'Executive Black & White', description: 'CV cadre noir et blanc minimaliste, intemporel', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/YHrvmDRYRtn4kRe', edit_url: 'https://www.canva.com/d/ty-q2EG1mOxdOlm', is_premium: true, price: 6.99, tags: ['corporate','intemporel'], order: 33 },
        { slug: 'canva-lux-1', name: 'Executive Luxury - Emerald & Gold', description: 'CV ultra-premium pour dirigeants, palette émeraude et or, typographie éditoriale', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/xzdHD16MCECg0m0', edit_url: 'https://www.canva.com/d/F5iLSfkuqxh1em7', is_premium: true, price: 9.99, tags: ['luxe','dirigeant'], order: 40 },
        { slug: 'canva-lux-2', name: 'Executive Luxury - Burgundy', description: 'Design éditorial bordeaux et crème, qualité magazine pour cadres senior', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/jH9G4BnswLY5O--', edit_url: 'https://www.canva.com/d/RX6c5uHjSaXhbv8', is_premium: true, price: 9.99, tags: ['luxe','éditorial'], order: 41 },
        { slug: 'canva-lux-3', name: 'Executive Luxury - Rose Gold', description: 'Anthracite et or rose, raffinement absolu', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/tEYOk0iHQ5GnA2X', edit_url: 'https://www.canva.com/d/m4jQvdHIU87tbsY', is_premium: true, price: 9.99, tags: ['luxe','or rose'], order: 42 },
        { slug: 'canva-lux-4', name: 'Executive Luxury - Navy & Silver', description: 'Marine et argent, élégance Monocle/Economist pour direction', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/XzBUV3tBuqgBYHz', edit_url: 'https://www.canva.com/d/FDKZp3tZ4uH2TeJ', is_premium: true, price: 9.99, tags: ['luxe','marine'], order: 43 },
        { slug: 'canva-medical',     name: 'Médical / Santé',     description: 'CV pour médecins, infirmiers, professions de santé', category: 'Santé', style: 'canva', preview_url: 'https://design.canva.ai/Ii-6iqqb8eoYZez', edit_url: 'https://www.canva.com/d/4FaMk--pSwR_4pJ', is_premium: true, price: 7.99, tags: ['médical','santé'], order: 50 },
        { slug: 'canva-legal',       name: 'Juridique / Avocat',  description: 'CV classique raffiné pour avocats, juristes', category: 'Juridique', style: 'canva', preview_url: 'https://design.canva.ai/ybbDZMNKGvkqakU', edit_url: 'https://www.canva.com/d/8O3LpFsxZRQFfof', is_premium: true, price: 7.99, tags: ['juridique','avocat'], order: 51 },
        { slug: 'canva-architecture',name: 'Architecte / Designer',description: 'Grille architecturale minimaliste, monochrome avec accent unique', category: 'Architecture', style: 'canva', preview_url: 'https://design.canva.ai/uZh0I2XBbmm1GE1', edit_url: 'https://www.canva.com/d/JguI7i0uA1hK3qp', is_premium: true, price: 7.99, tags: ['architecte','designer'], order: 52 },
        { slug: 'canva-academic',    name: 'Académique / Doctorat',description: 'CV scientifique pour chercheurs, doctorants, enseignants', category: 'Académique', style: 'canva', preview_url: 'https://design.canva.ai/7RgVaunroDCGSjd', edit_url: 'https://www.canva.com/d/I4VXE5R67q59jPs', is_premium: true, price: 7.99, tags: ['académique','recherche'], order: 53 },
      ];
      for (const t of templates) {
        await query(
          `INSERT INTO cv_templates (slug, name, description, category, style, preview_url, edit_url, builder_id, is_premium, price, tags, display_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (slug) DO NOTHING`,
          [t.slug, t.name, t.description, t.category, t.style, t.preview_url, t.edit_url || null, t.builder_id || null, t.is_premium, t.price, t.tags || [], t.order]
        );
      }
      console.log(`[Migrate] Upserted ${templates.length} CV templates`);
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

    // Add Portfolio project if missing (idempotent)
    try {
      const portfolioExists = await query("SELECT id FROM projects WHERE slug = 'portfolio' LIMIT 1");
      if (!portfolioExists.rows.length) {
        await query(
          `INSERT INTO projects (slug, title, subtitle, description, long_description, category, highlights, tech, color, icon, github_url, featured, display_order)
           VALUES ('portfolio', 'Portfolio Personnel',
             $1::jsonb, $2::jsonb, $3::jsonb,
             'Full-Stack',
             $4::jsonb,
             ARRAY['Next.js','Express','PostgreSQL','Claude API','PayPal','Tailwind'],
             '#c8a96e', 'code',
             'https://github.com/SALEH9833/portfolio',
             true, 3
           )`,
          [
            JSON.stringify({fr:'Site personnel avec marketplace CV & chatbot IA', en:'Personal site with CV marketplace & AI chatbot', ar:'موقع شخصي مع متجر CV ومحادثة ذكاء اصطناعي'}),
            JSON.stringify({fr:"Portfolio full-stack avec marketplace de templates CV (29 modèles), chatbot intelligent propulsé par Claude API, paiements PayPal, multilingue FR/EN/AR.", en:"Full-stack portfolio with CV templates marketplace (29 designs), Claude API chatbot, PayPal payments, FR/EN/AR i18n.", ar:"موقع شخصي شامل مع متجر قوالب السيرة الذاتية (29 تصميم)، شات بوت ذكي مدعوم بـ Claude API، مدفوعات PayPal، متعدد اللغات."}),
            JSON.stringify({fr:"Plateforme construite avec Next.js (SSR) déployée sur Vercel, et un backend Express + PostgreSQL hébergé sur Railway. Le marketplace de CV propose 10 modèles gratuits (builders intégrés) et 19 designs premium Canva avec paiement et livraison automatisée. Le chatbot utilise Claude Opus 4.7 pour répondre aux visiteurs en 3 langues.", en:"Built with Next.js (SSR) on Vercel and Express + PostgreSQL on Railway. The CV marketplace offers 10 free in-site builders and 19 premium Canva designs with automated checkout. The chatbot is powered by Claude Opus 4.7 and answers in 3 languages.", ar:"تم بناؤه باستخدام Next.js على Vercel و Express + PostgreSQL على Railway. يوفر متجر السير الذاتية 10 قوالب مجانية و 19 تصميم Canva مميز مع دفع آلي. الشات بوت يعمل بـ Claude Opus 4.7."}),
            JSON.stringify({fr:["Marketplace de 29 modèles CV (10 gratuits + 19 premium Canva)","Chatbot Claude API multilingue","Paiement PayPal + livraison automatisée","Authentification JWT (admin + utilisateurs)","Sync CV cloud + vérification email"], en:["29-template CV marketplace (10 free + 19 premium)","Claude-powered multilingual chatbot","PayPal checkout + automated delivery","JWT auth (admin + users)","Cloud CV sync + email verification"], ar:["متجر 29 قالب CV (10 مجاني + 19 مميز)","شات بوت متعدد اللغات بـ Claude","دفع PayPal مع تسليم آلي","مصادقة JWT","مزامنة سحابية للسير الذاتية"]}),
          ]
        );
        console.log('[Migrate] ✅ Portfolio project added');
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
