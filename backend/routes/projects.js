const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { featured, category } = req.query;
    const conditions = [];
    const params = [];
    let i = 1;

    if (featured === 'true') {
      conditions.push('featured = TRUE');
    }
    if (category) {
      conditions.push(`LOWER(category) = LOWER($${i++})`);
      params.push(String(category).slice(0, 50));
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT slug AS id, title, subtitle, description, long_description AS "longDescription",
             category, highlights, tech, color, icon, github_url AS github, featured
      FROM projects ${where}
      ORDER BY featured DESC, display_order
    `;
    const { rows } = await query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50);
    const { rows } = await query(`
      SELECT slug AS id, title, subtitle, description, long_description AS "longDescription",
             category, highlights, tech, color, icon, github_url AS github, featured
      FROM projects WHERE slug = $1
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
