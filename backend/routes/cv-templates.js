const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Public list — all templates, optional filters
router.get('/', async (req, res, next) => {
  try {
    const { category, premium } = req.query;
    const where = [];
    const vals = [];
    if (category) { vals.push(category); where.push(`category = $${vals.length}`); }
    if (premium === 'true')  { where.push('is_premium = TRUE'); }
    if (premium === 'false') { where.push('is_premium = FALSE'); }
    const sql = `SELECT id, slug, name, description, category, style, preview_url, edit_url, view_url, builder_id, is_premium, price, currency, tags, downloads
                 FROM cv_templates
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY is_premium ASC, display_order ASC, id DESC`;
    const { rows } = await query(sql, vals);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) { next(err); }
});

// Public single template by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM cv_templates WHERE slug = $1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// Track download/use count
router.post('/:slug/track', async (req, res, next) => {
  try {
    await query('UPDATE cv_templates SET downloads = downloads + 1 WHERE slug = $1', [req.params.slug]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
