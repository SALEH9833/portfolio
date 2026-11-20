// Public photo uploads — no auth required, but heavily rate-limited and size-capped.
// Used by: Testimonials (reviewer photo).
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { saveUpload } = require('../storage');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

function makeUploader() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(new Error('Format invalide. Utilisez JPG, PNG ou WebP (max 2 Mo).'));
      }
      cb(null, true);
    },
  });
}

const testiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop d\'uploads de photo. Réessayez dans 1 heure.' },
});

const testiUpload = makeUploader();

async function handleUpload(req, res, next, folder) {
  if (!req.file) return res.status(400).json({ error: 'Aucune photo reçue' });
  try {
    const { url } = await saveUpload(req.file, folder, 'testi');
    res.status(201).json({ success: true, url });
  } catch (e) { next(e); }
}

// Testimonial photo
router.post('/testimonial-photo', testiLimiter, (req, res, next) => {
  testiUpload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Erreur d\'upload' });
    handleUpload(req, res, next, 'testimonials');
  });
});

module.exports = router;
