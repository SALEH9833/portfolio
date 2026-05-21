const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

router.post('/login',
  loginLimiter,
  body('username').trim().isLength({ min: 2, max: 60 }),
  body('password').isLength({ min: 6, max: 200 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Invalid input' });
    const { username, password } = req.body;
    try {
      const { rows } = await query('SELECT * FROM admin_users WHERE username = $1', [username]);
      if (!rows.length) return res.status(401).json({ error: 'Identifiants invalides' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });
      await query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [user.id]);
      const token = signToken({ id: user.id, username: user.username });
      res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) { next(err); }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, username, email FROM admin_users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Compte introuvable' });
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
});

// ============================================================================
// PUT /api/admin/me — update admin's own username/email
// ============================================================================
router.put('/me', requireAuth, async (req, res, next) => {
  const { username, email } = req.body;
  if (!username || username.trim().length < 3) return res.status(422).json({ error: 'Username trop court (3+ caractères)' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(422).json({ error: 'Email invalide' });
  try {
    // Check the new username isn't already taken by someone else
    const conflict = await query('SELECT id FROM admin_users WHERE username = $1 AND id <> $2', [username.trim(), req.user.id]);
    if (conflict.rows.length) return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' });

    const { rows } = await query(
      'UPDATE admin_users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email',
      [username.trim(), email?.trim() || null, req.user.id]
    );
    res.json({ success: true, user: rows[0], message: 'Informations mises à jour ✓' });
  } catch (err) { next(err); }
});

// ============================================================================
// PUT /api/admin/me/password — change admin password (requires current password)
// ============================================================================
router.put('/me/password', requireAuth, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(422).json({ error: 'Mot de passe actuel et nouveau requis' });
  if (newPassword.length < 8) return res.status(422).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' });
  if (newPassword === currentPassword) return res.status(422).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel' });

  try {
    const bcrypt = require('bcryptjs');
    const { rows } = await query('SELECT password_hash FROM admin_users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Compte introuvable' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    res.json({ success: true, message: 'Mot de passe changé ✓' });
  } catch (err) { next(err); }
});

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const [pr, ex, sk, ms, un, us, uv, sa, te] = await Promise.all([
      query('SELECT COUNT(*)::int AS n FROM projects'),
      query('SELECT COUNT(*)::int AS n FROM experience'),
      query('SELECT COUNT(*)::int AS n FROM skills'),
      query('SELECT COUNT(*)::int AS n FROM contact_messages'),
      query('SELECT COUNT(*)::int AS n FROM contact_messages WHERE is_read = FALSE'),
      query("SELECT COUNT(*)::int AS n FROM users").catch(() => ({ rows: [{ n: 0 }] })),
      query("SELECT COUNT(*)::int AS n FROM users WHERE email_verified = TRUE").catch(() => ({ rows: [{ n: 0 }] })),
      query("SELECT COUNT(*)::int AS n FROM cv_template_purchases WHERE status = 'completed'").catch(() => ({ rows: [{ n: 0 }] })),
      query('SELECT COUNT(*)::int AS n FROM testimonials').catch(() => ({ rows: [{ n: 0 }] })),
    ]);
    res.json({
      success: true,
      data: {
        projects: pr.rows[0].n, experience: ex.rows[0].n, skills: sk.rows[0].n,
        messages: ms.rows[0].n, unread: un.rows[0].n,
        users: us.rows[0].n, users_verified: uv.rows[0].n,
        sales: sa.rows[0].n, testimonials: te.rows[0].n,
      },
    });
  } catch (err) { next(err); }
});

router.get('/messages', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.patch('/messages/:id/read', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    await query('UPDATE contact_messages SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/messages/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    await query('DELETE FROM contact_messages WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM profile ORDER BY id LIMIT 1');
    res.json({ success: true, data: rows[0] || null });
  } catch (err) { next(err); }
});

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const f = req.body;
    await query(`
      UPDATE profile SET
        name=$1, first_name=$2, email=$3, phone=$4, location=$5,
        birth=$6, license=$7, linkedin=$8, github=$9, whatsapp=$10, photo_url=$11,
        title=$12, subtitle=$13, tagline=$14, bio=$15, updated_at=NOW()
      WHERE id = (SELECT id FROM profile ORDER BY id LIMIT 1)
    `, [
      f.name, f.first_name, f.email, f.phone, f.location,
      f.birth, f.license, f.linkedin, f.github, f.whatsapp, f.photo_url,
      f.title || {}, f.subtitle || {}, f.tagline || {}, f.bio || {},
    ]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

const TABLES = {
  languages: {
    fields:    ['name', 'level', 'proficiency', 'flag', 'display_order'],
    jsonbCols: ['level'],
  },
  strengths: {
    fields:    ['icon', 'title', 'description', 'display_order'],
    jsonbCols: ['title', 'description'],
  },
  projects: {
    fields:    ['slug', 'title', 'subtitle', 'description', 'long_description', 'category', 'highlights', 'tech', 'color', 'icon', 'github_url', 'featured', 'display_order'],
    jsonbCols: ['subtitle', 'description', 'long_description', 'highlights'],
    arrayCols: ['tech'],
  },
  skill_categories: {
    fields:    ['name', 'icon', 'color', 'display_order'],
    jsonbCols: ['name'],
  },
  skills: {
    fields:    ['category_id', 'name', 'level', 'display_order'],
  },
  tech_stack: {
    fields:    ['name', 'icon', 'display_order'],
  },
  certifications: {
    fields:    ['name', 'issuer', 'year', 'color', 'display_order'],
  },
  experience: {
    fields:    ['slug', 'role', 'company', 'location', 'period', 'type', 'is_current', 'description', 'tasks', 'color', 'display_order'],
    jsonbCols: ['role', 'description', 'tasks'],
  },
  education: {
    fields:    ['degree', 'school', 'location', 'period', 'is_current', 'modules', 'display_order'],
    jsonbCols: ['degree', 'modules'],
  },
  activities: {
    fields:    ['icon', 'title', 'description', 'year', 'display_order'],
    jsonbCols: ['title', 'description'],
  },
  cv_templates: {
    fields:    ['slug', 'name', 'description', 'category', 'style', 'preview_url', 'edit_url', 'view_url', 'builder_id', 'is_premium', 'price', 'currency', 'tags', 'display_order'],
    arrayCols: ['tags'],
  },
  testimonials: {
    fields: ['name', 'role', 'company', 'message', 'rating', 'photo_url', 'relation', 'email', 'is_approved', 'is_featured', 'display_order'],
  },
};

function buildInsert(table, body) {
  const config = TABLES[table];
  const cols = config.fields;
  const vals = cols.map(c => {
    const v = body[c];
    if (config.jsonbCols?.includes(c)) return v ?? {};
    if (config.arrayCols?.includes(c)) return Array.isArray(v) ? v : [];
    return v ?? null;
  });
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
  return { text: `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) RETURNING id`, values: vals };
}

function buildUpdate(table, body, id) {
  const config = TABLES[table];
  const cols = config.fields;
  const vals = cols.map(c => {
    const v = body[c];
    if (config.jsonbCols?.includes(c)) return v ?? {};
    if (config.arrayCols?.includes(c)) return Array.isArray(v) ? v : [];
    return v ?? null;
  });
  const sets = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
  return { text: `UPDATE ${table} SET ${sets} WHERE id=$${cols.length + 1}`, values: [...vals, id] };
}

router.get('/entities/:table', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  try {
    const orderBy = TABLES[table].fields.includes('display_order') ? 'display_order, id' : 'id';
    const { rows } = await query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/entities/:table', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  try {
    const sql = buildInsert(table, req.body);
    const { rows } = await query(sql.text, sql.values);
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) { next(err); }
});

router.put('/entities/:table/:id', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  const id = parseInt(req.params.id);
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const sql = buildUpdate(table, req.body, id);
    await query(sql.text, sql.values);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ============================================================================
// POST /api/admin/deliver-template — sends the Canva edit link to a buyer via email
// ============================================================================
router.post('/deliver-template', requireAuth, async (req, res, next) => {
  const { templateId, buyerEmail, buyerName, paypalAmount } = req.body;
  if (!templateId || !buyerEmail) return res.status(422).json({ error: 'templateId et buyerEmail requis' });

  try {
    const { rows } = await query('SELECT name, edit_url, price, currency FROM cv_templates WHERE id = $1', [parseInt(templateId)]);
    if (!rows.length) return res.status(404).json({ error: 'Modèle introuvable' });
    const tpl = rows[0];
    if (!tpl.edit_url) return res.status(400).json({ error: 'Ce modèle n\'a pas d\'URL Canva configurée' });

    const name = (buyerName || '').trim();
    const subject = `Votre modèle CV : ${tpl.name} — Lien Canva`;
    const html = `<!DOCTYPE html>
<html><body style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;background:#f8f5ef">
  <div style="background:white;border-radius:12px;padding:30px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
    <h1 style="color:#c8a96e;margin:0 0 12px 0;font-family:Georgia,serif">Merci ${name || 'pour votre achat'} !</h1>
    <p style="font-size:15px;line-height:1.6">
      Votre modèle <strong>${tpl.name}</strong> est prêt à être personnalisé.
    </p>
    <p style="text-align:center;margin:28px 0">
      <a href="${tpl.edit_url}" style="background:#c8a96e;color:#1a1a1a;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;font-size:15px">
        Ouvrir mon CV dans Canva
      </a>
    </p>
    <p style="font-size:13px;color:#666;line-height:1.6">
      Avec ce lien, vous pouvez :
    </p>
    <ul style="font-size:13px;color:#666;line-height:1.8;padding-left:18px">
      <li>Modifier le texte (nom, expérience, formation...)</li>
      <li>Changer les couleurs et la typographie</li>
      <li>Télécharger en PDF haute qualité (gratuit chez Canva)</li>
    </ul>
    <p style="font-size:13px;color:#666;line-height:1.6;margin-top:24px">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>
    <p style="font-size:12px;font-family:monospace;background:#f8f5ef;padding:10px;border-radius:6px;word-break:break-all;color:#666">
      ${tpl.edit_url}
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:30px 0 16px 0"/>
    <p style="font-size:12px;color:#aaa;margin:0">
      Une question ? Répondez simplement à cet email.
    </p>
    <p style="font-size:12px;color:#aaa;margin:8px 0 0 0">
      Saleh Mahamat Saleh — <a href="https://salehmahamatsaleh.com" style="color:#c8a96e">salehmahamatsaleh.com</a>
    </p>
  </div>
</body></html>`;
    const text = `Merci ${name || 'pour votre achat'} !\n\nVotre modèle "${tpl.name}" est prêt.\n\nOuvrez votre CV dans Canva :\n${tpl.edit_url}\n\nAvec ce lien, vous pouvez modifier le texte, les couleurs, et télécharger en PDF.\n\nUne question ? Répondez à cet email.\n\nSaleh Mahamat Saleh\nhttps://salehmahamatsaleh.com`;

    // Send via Brevo
    if (!process.env.BREVO_API_KEY) return res.status(500).json({ error: 'Brevo non configuré sur le serveur' });
    const axios = require('axios');
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@salehmahamatsaleh.com';
    const senderName  = process.env.BREVO_SENDER_NAME  || 'Portfolio Saleh';
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: senderEmail, name: senderName },
        to:     [{ email: buyerEmail, name: name || buyerEmail }],
        subject, htmlContent: html, textContent: text,
      },
      { headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' }, timeout: 10000 }
    );

    // Log the manual delivery as a completed sale
    try {
      await query(
        `INSERT INTO cv_template_purchases (template_id, template_slug, template_name, paypal_order_id, payer_email, payer_name, amount, currency, status, canva_edit_url, delivered_at)
         VALUES ($1, (SELECT slug FROM cv_templates WHERE id = $1), $2, $3, $4, $5, $6, $7, 'completed', $8, NOW())`,
        [parseInt(templateId), tpl.name, `manual-${Date.now()}`, buyerEmail, name || null, paypalAmount || tpl.price, tpl.currency || 'EUR', tpl.edit_url]
      );
    } catch (logErr) {
      console.warn('[Admin] Could not log manual delivery:', logErr.message);
    }

    res.json({ success: true, message: `Email envoyé à ${buyerEmail}` });
  } catch (err) {
    console.error('[Admin] Deliver template failed:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || err.message || 'Erreur d\'envoi' });
  }
});

router.delete('/entities/:table/:id', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  const id = parseInt(req.params.id);
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/entities/:table/reorder', requireAuth, async (req, res, next) => {
  const table = req.params.table;
  if (!TABLES[table]) return res.status(400).json({ error: 'Unknown table' });
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array of {id, display_order}' });
  try {
    for (const item of order) {
      await query(`UPDATE ${table} SET display_order=$1 WHERE id=$2`, [item.display_order, item.id]);
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
