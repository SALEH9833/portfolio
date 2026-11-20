require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, query } = require('./index');

const wrap = (text) => (typeof text === 'string' ? { fr: text, en: text, ar: text } : (text || {}));
const wrapArr = (arr) => (Array.isArray(arr) ? { fr: arr, en: arr, ar: arr } : (arr || {}));

async function loadSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✓ Schema applied');
}

async function seedFromJson() {
  const dataPath = path.join(__dirname, '..', 'data', 'portfolio.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const p = data.profile;
  await query(`
    INSERT INTO profile (name, first_name, email, phone, location, birth, license, linkedin, github, photo_url, title, subtitle, tagline, bio)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  `, [
    p.name, p.firstName, p.email, p.phone, p.location, p.birth, p.license,
    p.linkedin, p.github, p.photoUrl,
    wrap(p.title), wrap(p.subtitle), wrap(p.tagline), wrap(p.bio),
  ]);
  console.log('✓ profile');

  for (const [i, lang] of (p.languages || []).entries()) {
    await query(
      'INSERT INTO languages (name, level, proficiency, flag, display_order) VALUES ($1,$2,$3,$4,$5)',
      [lang.name, wrap(lang.level), lang.proficiency, lang.flag, i]
    );
  }
  console.log(`✓ ${p.languages?.length || 0} languages`);

  for (const [i, s] of (p.strengths || []).entries()) {
    await query(
      'INSERT INTO strengths (icon, title, description, display_order) VALUES ($1,$2,$3,$4)',
      [s.icon, wrap(s.title), wrap(s.desc), i]
    );
  }
  console.log(`✓ ${p.strengths?.length || 0} strengths`);

  for (const [i, proj] of (data.projects || []).entries()) {
    await query(`
      INSERT INTO projects (slug, title, subtitle, description, long_description, category, highlights, tech, color, icon, github_url, featured, display_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `, [
      proj.id, proj.title, wrap(proj.subtitle),
      wrap(proj.description), wrap(proj.longDescription),
      proj.category, wrapArr(proj.highlights), proj.tech || [],
      proj.color, proj.icon, proj.github, proj.featured || false, i,
    ]);
  }
  console.log(`✓ ${data.projects?.length || 0} projects`);

  for (const [i, cat] of (data.skills?.categories || []).entries()) {
    const { rows } = await query(
      'INSERT INTO skill_categories (name, icon, color, display_order) VALUES ($1,$2,$3,$4) RETURNING id',
      [wrap(cat.name), cat.icon, cat.color, i]
    );
    const catId = rows[0].id;
    for (const [j, skill] of cat.items.entries()) {
      await query(
        'INSERT INTO skills (category_id, name, level, display_order) VALUES ($1,$2,$3,$4)',
        [catId, skill.name, skill.level, j]
      );
    }
  }
  console.log(`✓ ${data.skills?.categories?.length || 0} skill categories`);

  for (const [i, t] of (data.skills?.techStack || []).entries()) {
    await query('INSERT INTO tech_stack (name, icon, display_order) VALUES ($1,$2,$3)', [t.name, t.icon, i]);
  }
  console.log(`✓ ${data.skills?.techStack?.length || 0} tech stack`);

  for (const [i, c] of (data.skills?.certifications || []).entries()) {
    await query('INSERT INTO certifications (name, issuer, year, color, display_order) VALUES ($1,$2,$3,$4,$5)',
      [c.name, c.issuer, c.year, c.color, i]);
  }
  console.log(`✓ ${data.skills?.certifications?.length || 0} certifications`);

  for (const [i, ex] of (data.experience || []).entries()) {
    await query(`
      INSERT INTO experience (slug, role, company, location, period, type, is_current, description, tasks, color, display_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      ex.id, wrap(ex.role), ex.company, ex.location, ex.period, ex.type,
      ex.current || false, wrap(ex.description), wrapArr(ex.tasks),
      ex.color, i,
    ]);
  }
  console.log(`✓ ${data.experience?.length || 0} experience`);

  for (const [i, ed] of (data.education || []).entries()) {
    await query(`
      INSERT INTO education (degree, school, location, period, is_current, modules, display_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [
      wrap(ed.degree), ed.school, ed.location, ed.period,
      ed.current || false, wrapArr(ed.modules), i,
    ]);
  }
  console.log(`✓ ${data.education?.length || 0} education`);

  for (const [i, a] of (data.activities || []).entries()) {
    await query(`
      INSERT INTO activities (icon, title, description, year, display_order)
      VALUES ($1,$2,$3,$4,$5)
    `, [a.icon, wrap(a.title), wrap(a.desc), a.year, i]);
  }
  console.log(`✓ ${data.activities?.length || 0} activities`);

  const adminUser     = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe!2026';
  const hash = await bcrypt.hash(adminPassword, 10);
  await query(
    'INSERT INTO admin_users (username, password_hash, email) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
    [adminUser, hash, 'admin@portfolio.local']
  );
  console.log(`✓ admin user "${adminUser}" created (password from .env or default)`);
}

(async () => {
  try {
    console.log('→ Loading schema...');
    await loadSchema();
    console.log('→ Seeding from portfolio.json...');
    await seedFromJson();
    console.log('\n✅ Database seeded successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
