const express = require('express');
const router = express.Router();
const path = require('path');
const { query } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { rows: profileRows } = await query('SELECT * FROM profile ORDER BY id LIMIT 1');
    const profile = profileRows[0] || null;

    if (profile) {
      const { rows: languages } = await query('SELECT name, level, proficiency, flag FROM languages ORDER BY display_order');
      const { rows: strengths } = await query('SELECT icon, title, description AS desc FROM strengths ORDER BY display_order');
      profile.languages = languages;
      profile.strengths = strengths;
      profile.firstName = profile.first_name;
      profile.photoUrl  = profile.photo_url;
    }

    const { rows: activities } = await query('SELECT icon, title, description AS desc, year FROM activities ORDER BY display_order');

    res.json({ success: true, data: { profile, activities } });
  } catch (err) { next(err); }
});

router.get('/education', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT degree, school, location, period, is_current AS current, modules
      FROM education ORDER BY display_order
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Personal CV download — serves backend/public/files/cv.pdf
router.get('/cv', (req, res) => {
  const cvPath = path.join(__dirname, '../public/files/cv.pdf');
  res.download(cvPath, 'Saleh_Mahamat_Saleh_CV.pdf', (err) => {
    if (err) {
      res.status(404).json({
        error: "Le CV n'est pas encore disponible. Saleh peut l'ajouter en plaçant le fichier dans backend/public/files/cv.pdf",
      });
    }
  });
});

module.exports = router;
