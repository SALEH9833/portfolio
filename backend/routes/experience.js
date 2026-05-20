const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT slug AS id, role, company, location, period, type,
             is_current AS current, description, tasks, color
      FROM experience ORDER BY display_order
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
