// Public photo uploads — no auth required, but heavily rate-limited and size-capped.
// Used by: CV Builder (visitor photo), Testimonials (reviewer photo).
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

function makeUploader(subdir) {
  const dir = path.join(__dirname, '..', 'public', 'uploads', subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const hash = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
      cb(null, `${subdir}-${Date.now()}-${hash}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(new Error('Format invalide. Utilisez JPG, PNG ou WebP (max 2 Mo).'));
      }
      cb(null, true);
    },
  });
}

const cvLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop d\'uploads de photo. Réessayez dans 1 heure.' },
});

const testiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop d\'uploads de photo. Réessayez dans 1 heure.' },
});

const cvUpload    = makeUploader('cv-photos');
const testiUpload = makeUploader('testimonials');

function handleUpload(req, res, subdir) {
  if (!req.file) return res.status(400).json({ error: 'Aucune photo reçue' });
  const url = `/uploads/${subdir}/${req.file.filename}`;
  res.status(201).json({ success: true, url });
}

// CV builder photo
router.post('/cv-photo', cvLimiter, (req, res) => {
  cvUpload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Erreur d\'upload' });
    handleUpload(req, res, 'cv-photos');
  });
});

// Testimonial photo
router.post('/testimonial-photo', testiLimiter, (req, res) => {
  testiUpload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Erreur d\'upload' });
    handleUpload(req, res, 'testimonials');
  });
});

module.exports = router;
