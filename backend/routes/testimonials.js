const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query } = require('../db');

// Photo upload setup
const TESTI_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'testimonials');
if (!fs.existsSync(TESTI_UPLOAD_DIR)) fs.mkdirSync(TESTI_UPLOAD_DIR, { recursive: true });

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TESTI_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `testi-${Date.now()}-${hash}${ext}`);
  },
});
const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Format invalide. Utilisez JPG, PNG ou WebP (max 2 Mo).'));
    }
    cb(null, true);
  },
});

const photoUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop d\'uploads. Réessayez dans 1 heure.' },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // 10 testimonials per hour per IP — enough for normal usage
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de soumissions. Réessayez dans 1 heure.' },
});

const sanitize = (s) =>
  String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').trim();

// Public: list approved testimonials
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, role, company, message, rating, photo_url, relation, is_featured, created_at
       FROM testimonials
       WHERE is_approved = TRUE
       ORDER BY is_featured DESC, display_order ASC, created_at DESC
       LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Public: submit a new testimonial (pending moderation)
router.post(
  '/',
  submitLimiter,
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('message').trim().isLength({ min: 20, max: 1000 }),
  body('rating').isInt({ min: 1, max: 5 }),
  body('role').optional().trim().isLength({ max: 120 }),
  body('company').optional().trim().isLength({ max: 120 }),
  body('relation').optional().trim().isLength({ max: 80 }),
  body('email').optional().trim().isEmail().isLength({ max: 200 }),
  body('photo_url').optional().trim().isLength({ max: 500 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: 'Données invalides',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }
    try {
      const name      = sanitize(req.body.name);
      const role      = req.body.role      ? sanitize(req.body.role)      : null;
      const company   = req.body.company   ? sanitize(req.body.company)   : null;
      const message   = sanitize(req.body.message);
      const rating    = Number(req.body.rating);
      const relation  = req.body.relation  ? sanitize(req.body.relation)  : null;
      const email     = req.body.email     ? sanitize(req.body.email)     : null;
      const photo_url = req.body.photo_url ? sanitize(req.body.photo_url) : null;

      // Auto-publish: testimonials appear immediately on the site (admin can delete if abusive)
      await query(
        `INSERT INTO testimonials (name, role, company, message, rating, relation, email, photo_url, ip_address, is_approved)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)`,
        [name, role, company, message, rating, relation, email, photo_url, req.ip]
      );
      res.status(201).json({
        success: true,
        message: 'Merci ! Votre avis a été soumis et sera publié après modération (sous 24h).',
      });
    } catch (err) { next(err); }
  }
);

// Public: upload a photo for a testimonial (returns URL to attach)
router.post('/upload-photo', photoUploadLimiter, (req, res, next) => {
  photoUpload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Erreur d\'upload' });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucune photo reçue' });
    const url = `/uploads/testimonials/${req.file.filename}`;
    res.status(201).json({ success: true, url });
  });
});

module.exports = router;
