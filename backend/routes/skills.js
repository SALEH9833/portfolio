const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { rows: cats } = await query(`
      SELECT id, name, icon, color FROM skill_categories ORDER BY display_order
    `);

    for (const c of cats) {
      const { rows: items } = await query(
        'SELECT name, level FROM skills WHERE category_id = $1 ORDER BY display_order',
        [c.id]
      );
      c.items = items;
      delete c.id;
    }

    const { rows: techStack } = await query('SELECT name, icon FROM tech_stack ORDER BY display_order');
    const { rows: certs }     = await query('SELECT name, issuer, year, color FROM certifications ORDER BY display_order');

    res.json({ success: true, data: { categories: cats, techStack, certifications: certs } });
  } catch (err) { next(err); }
});

module.exports = router;
