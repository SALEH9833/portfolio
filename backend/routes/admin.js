const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

router.post('/login',
  loginLimiter,
  body('username').trim().isLength({ min: 2, max: 60 }),
  body('password').isLength({ min: 6, max: 200 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Invalid input' });
    const { username, password } = req.body;
    try {
      const { rows } = await query('SELECT * FROM admin_users WHERE username = $1', [username]);
      if (!rows.length) return res.status(401).json({ error: 'Identifiants invalides' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });
      await query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [user.id]);
      const token = signToken({ id: user.id, username: user.username });
      res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) { next(err); }
  }
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const [pr, ex, sk, ms, un] = await Promise.all([
      query('SELECT COUNT(*)::int AS n FROM projects'),
      query('SELECT COUNT(*)::int AS n FROM experience'),
      query('SELECT COUNT(*)::int AS n FROM skills'),
      query('SELECT COUNT(*)::int AS n FROM contact_messages'),
      query('SELECT COUNT(*)::int AS n FROM contact_messages WHERE is_read = FALSE'),
    ]);
    res.json({
      success: true,
      data: { projects: pr.rows[0].n, experience: ex.rows[0].n, skills: sk.rows[0].n, messages: ms.rows[0].n, unread: un.rows[0].n },
    });
  } catch (err) { next(err); }
});

router.get('/messages', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.patch('/messages/:id/read', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    await query('UPDATE contact_messages SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/messages/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    await query('DELETE FROM contact_messages WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM profile ORDER BY id LIMIT 1');
    res.json({ success: true, data: rows[0] || null });
  } catch (err) { next(err); }
});

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const f = req.body;
    await query(`
      UPDATE profile SET
        name=$1, first_name=$2, email=$3, phone=$4, location=$5,
        birth=$6, license=$7, linkedin=$8, github=$9, whatsapp=$10, photo_url=$11,
        title=$12, subtitle=$13, tagline=$14, bio=$15, updated_at=NOW()
      WHERE id = (SELECT id FROM profile ORDER BY id LIMIT 1)
    `, [
      f.name, f.first_name, f.email, f.phone, f.location,
      f.birth, f.license, f.linkedin, f.github, f.whatsapp, f.photo_url,
      f.title || {}, f.subtitle || {}, f.tagline || {}, f.bio || {},
    ]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

const TABLES = {
  languages: {
    fields:    ['name', 'level', 'proficiency', 'flag', 'display_order'],
    jsonbCols: ['level'],
  },
  strengths: {
    fields:    ['icon', 'title', 'description', 'display_order'],
    jsonbCols: ['title', 'description'],
  },
  projects: {
    fields:    ['slug', 'title', 'subtitle', 'description', 'long_description', 'category', 'highlights', 'tech', 'color', 'icon', 'github_url', 'featured', 'display_order'],
    jsonbCols: ['subtitle', 'description', 'long_description', 'highlights'],
    arrayCols: ['tech'],
  },
  skill_categories: {
    fields:    ['name', 'icon', 'color', 'display_order'],
    jsonbCols: ['name'],
  },
  skills: {
    fields:    ['category_id', 'name', 'level', 'display_order'],
  },
  tech_stack: {
    fields:    ['name', 'icon', 'display_order'],
  },
  certifications: {
    fields:    ['name', 'issuer', 'year', 'color', 'display_order'],
  },
  experience: {
    fields:    ['slug', 'role', 'company', 'location', 'period', 'type', 'is_current', 'description', 'tasks', 'color', 'display_order'],
    jsonbCols: ['role', 'description', 'tasks'],
  },
  education: {
    fields:    ['degree', 'school', 'location', 'period', 'is_current', 'modules', 'display_order'],
    jsonbCols: ['degree', 'modules'],
  },
  activities: {
    fields:    ['icon', 'title', 'description', 'year', 'display_order'],
    jsonbCols: ['title', 'description'],
  },
  cv_templates: {
    fields:    ['slug', 'name', 'description', 'category', 'style', 'preview_url', 'edit_url', 'view_url', 'builder_id', 'is_premium', 'price', 'currency', 'tags', 'display_order'],
    arrayCols: ['tags'],
  },
  testimonials: {
    fields: ['name', 'role', 'company', 'message', 'rating', 'photo_url', 'relation', 'email', 'is_approved', 'is_featured', 'display_order'],
  },
};

function buildInsert(table, body) {
  const config = TABLES[table];
  const cols = config.fields;
  const vals = cols.map(c => {
    const v = body[c];
    if (config.jsonbCols?.includes(c)) return v ?? {};
    if (config.arrayCols?.includes(c)) return Array.isArray(v) ? v : [];
    return v ?? null;
  });
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
  return { text: `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) RETURNING id`, values: vals };
}

function buildUpdate(table, body, id) {
  const config = TABLES[table];
  const cols = config.fields;
  const vals = cols.map(c => {
    const v = body[c];
    if (config.jsonbCols?.includes(c)) return v ?? {};
    if (config.arrayCols?.includes(c)) return Array.isArray(v) ? v : [];
    return v ?? null;
  });
  const sets = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
  return { text: `UPDATE ${table} SET ${sets} WHERE id=$${cols.length + 1}`, values: [...vals, id] };
}

router.get('/entities/:table', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  try {
    const orderBy = TABLES[table].fields.includes('display_order') ? 'display_order, id' : 'id';
    const { rows } = await query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/entities/:table', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  try {
    const sql = buildInsert(table, req.body);
    const { rows } = await query(sql.text, sql.values);
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) { next(err); }
});

router.put('/entities/:table/:id', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  const id = parseInt(req.params.id);
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const sql = buildUpdate(table, req.body, id);
    await query(sql.text, sql.values);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/entities/:table/:id', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  const id = parseInt(req.params.id);
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/entities/:table/reorder', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array of {id, display_order}' });
  try {
    for (const item of order) {
      await query(`UPDATE ${table} SET display_order=$1 WHERE id=$2`, [item.display_order, item.id]);
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
