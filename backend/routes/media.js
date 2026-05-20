const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '-').slice(0, 40);
    cb(null, `${safeName}-${hash}${ext}`);
  },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé. Utilise JPG, PNG, WebP, GIF ou SVG.'));
    }
    cb(null, true);
  },
});

// Public route — list assets (admin only fields hidden)
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const sql = category
      ? 'SELECT id, filename, url, category, alt_text, created_at FROM media_assets WHERE category = $1 ORDER BY created_at DESC'
      : 'SELECT id, filename, url, category, alt_text, created_at FROM media_assets ORDER BY created_at DESC LIMIT 200';
    const params = category ? [category] : [];
    const { rows } = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Admin: upload a new asset
router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  try {
    const category = req.body.category || 'general';
    const altText  = req.body.alt_text  || null;
    const publicUrl = `/uploads/${req.file.filename}`;

    const { rows } = await query(
      `INSERT INTO media_assets (filename, original_name, mime_type, size_bytes, url, category, alt_text, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, filename, url, category, alt_text, size_bytes`,
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, publicUrl, category, altText, req.user.id]
    );
    res.status(201).json({ success: true, asset: rows[0] });
  } catch (err) {
    // Cleanup file on DB error
    try { fs.unlinkSync(req.file.path); } catch {}
    next(err);
  }
});

// Admin: delete an asset (both DB + file)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { rows } = await query('SELECT filename FROM media_assets WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const filename = rows[0].filename;

    await query('DELETE FROM media_assets WHERE id = $1', [id]);

    // Delete file too
    const filepath = path.join(UPLOAD_DIR, filename);
    try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch (e) { console.warn('File delete failed:', e.message); }

    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
