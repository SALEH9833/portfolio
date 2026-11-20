// File storage for uploads (admin media, testimonial photos).
// - On Vercel: uses Vercel Blob (needs BLOB_READ_WRITE_TOKEN, added automatically
//   when a Blob store is connected to the project). Returns an absolute https URL.
// - In local dev (no token): writes to public/uploads and returns /uploads/... .
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

function makeName(originalName, prefix) {
  const ext = path.extname(originalName || '').toLowerCase().slice(0, 8);
  const base = path.basename(originalName || 'file', ext).replace(/[^a-z0-9-_]/gi, '-').slice(0, 40) || 'file';
  return `${prefix ? prefix + '-' : ''}${base}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
}

// file = multer memory file { buffer, originalname, mimetype }
async function saveUpload(file, folder, prefix) {
  const filename = makeName(file.originalname, prefix);
  const key = folder ? `${folder}/${filename}` : filename;

  if (useBlob()) {
    const { put } = require('@vercel/blob');
    const blob = await put(`uploads/${key}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      addRandomSuffix: false,
    });
    return { filename, url: blob.url };
  }

  if (process.env.VERCEL) {
    throw Object.assign(new Error("Stockage non configuré : connecte un Blob Store au projet Vercel."), { status: 503 });
  }
  const dir = path.join(process.cwd(), 'public', 'uploads', folder || '');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), file.buffer);
  return { filename, url: `/uploads/${key}` };
}

async function deleteUpload(url) {
  if (!url) return;
  try {
    if (/^https?:\/\//.test(url)) {
      if (useBlob()) await require('@vercel/blob').del(url);
    } else if (url.startsWith('/uploads/') && !process.env.VERCEL) {
      const p = path.join(process.cwd(), 'public', url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  } catch (e) {
    console.warn('[storage] delete failed:', e.message);
  }
}

module.exports = { saveUpload, deleteUpload };
