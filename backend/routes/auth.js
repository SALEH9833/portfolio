const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const VERIFICATION_TTL_HOURS = 24;

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de création de compte. Réessayez dans 1 heure.' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de demandes de renvoi. Patientez 15 minutes." },
});

async function requireUser(req, res, next) {
  return requireAuth(req, res, async () => {
    try {
      const id = req.user?.id;
      if (!id || req.user?.kind !== 'user') return res.status(401).json({ error: 'Invalid user token' });
      const { rows } = await query('SELECT id, email, name, email_verified FROM users WHERE id = $1', [id]);
      if (!rows.length) return res.status(401).json({ error: 'User not found' });
      req.dbUser = rows[0];
      next();
    } catch (err) { next(err); }
  });
}

// ============================================================================
// Email helper — sends verification email
// ============================================================================
async function sendVerificationEmail({ toEmail, toName, token }) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  const html = `<!DOCTYPE html>
<html><body style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;background:#f8f5ef">
  <div style="background:white;border-radius:12px;padding:30px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
    <h1 style="color:#c8a96e;margin:0 0 12px 0;font-family:Georgia,serif">Bienvenue${toName ? ` ${toName}` : ''} !</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px 0">
      Merci d'avoir créé un compte sur le portfolio de Saleh. Pour finaliser l'inscription et accéder à vos modèles CV, confirmez votre adresse email en cliquant sur le bouton ci-dessous.
    </p>

    <p style="text-align:center;margin:28px 0">
      <a href="${verifyUrl}" style="background:#c8a96e;color:#1a1a1a;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;font-size:15px">
        Confirmer mon email
      </a>
    </p>

    <p style="font-size:13px;color:#666;line-height:1.6;margin:24px 0 0 0">
      Ce lien expire dans <strong>${VERIFICATION_TTL_HOURS} heures</strong>. Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
    </p>
    <p style="font-size:12px;font-family:monospace;background:#f8f5ef;padding:10px;border-radius:6px;word-break:break-all;color:#666">
      ${verifyUrl}
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:30px 0 16px 0"/>
    <p style="font-size:12px;color:#aaa;margin:0">
      Si vous n'avez pas créé ce compte, ignorez simplement cet email — aucun compte ne sera activé sans confirmation.
    </p>
  </div>
</body></html>`;

  const subject = `Confirmez votre email — Portfolio Saleh`;
  const text = `Bienvenue${toName ? ` ${toName}` : ''} !\n\nMerci d'avoir créé un compte. Confirmez votre email en cliquant sur ce lien :\n\n${verifyUrl}\n\nCe lien expire dans ${VERIFICATION_TTL_HOURS}h.\n\nSi vous n'avez pas créé ce compte, ignorez cet email.`;

  // Preferred: Brevo HTTP API (300 emails/day free, no domain verification needed)
  if (process.env.BREVO_API_KEY) {
    try {
      const axios = require('axios');
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'salehmhtsaleh224@gmail.com';
      const senderName  = process.env.BREVO_SENDER_NAME  || 'Portfolio Saleh';
      const r = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender:      { email: senderEmail, name: senderName },
          to:          [{ email: toEmail, name: toName || toEmail }],
          subject,
          htmlContent: html,
          textContent: text,
        },
        { headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' }, timeout: 10000 }
      );
      console.log(`[Auth] Verification email sent to ${toEmail} via Brevo (id: ${r.data?.messageId || 'n/a'})`);
      return true;
    } catch (err) {
      console.error('[Auth] Brevo failed:', err.response?.data || err.message);
      // Fall through to next provider
    }
  }

  // Resend HTTP API fallback (works on Railway where SMTP is blocked)
  if (process.env.RESEND_API_KEY) {
    try {
      const axios = require('axios');
      const from = process.env.RESEND_FROM || 'Portfolio Saleh <onboarding@resend.dev>';
      const r = await axios.post(
        'https://api.resend.com/emails',
        { from, to: [toEmail], subject, html, text },
        { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      console.log(`[Auth] Verification email sent to ${toEmail} via Resend (id: ${r.data?.id || 'n/a'})`);
      return true;
    } catch (err) {
      console.error('[Auth] Resend failed:', err.response?.data || err.message);
      return false;
    }
  }

  // Fallback: SMTP (Gmail) — works locally but Railway blocks outbound SMTP
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER.startsWith('your_')) {
    console.warn('[Auth] No email provider configured (set RESEND_API_KEY or EMAIL_USER+EMAIL_PASS)');
    return false;
  }
  const nodemailer = require('nodemailer');
  const port = parseInt(process.env.EMAIL_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  try {
    await transporter.sendMail({
      from: `"Portfolio Saleh" <${process.env.EMAIL_USER}>`,
      to: toEmail, subject, text, html,
    });
    console.log(`[Auth] Verification email sent to ${toEmail} via SMTP`);
    return true;
  } catch (err) {
    console.error('[Auth] SMTP send failed:', err.message);
    return false;
  }
}

// ============================================================================
// POST /api/auth/signup — creates pending account + sends verification email
// ============================================================================
router.post('/signup',
  signupLimiter,
  body('email').trim().toLowerCase().isEmail().isLength({ max: 200 }),
  body('password').isLength({ min: 6, max: 200 }),
  body('name').optional().trim().isLength({ max: 120 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Email ou mot de passe invalide (min 6 caractères)' });
    const { email, password, name } = req.body;

    try {
      const exists = await query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
      if (exists.rows.length) {
        if (exists.rows[0].email_verified) {
          return res.status(409).json({ error: 'Un compte existe déjà avec cet email. Connectez-vous.' });
        }
        return res.status(409).json({
          error: 'Un compte existe déjà avec cet email mais n\'est pas encore vérifié. Demandez un renvoi du lien.',
          email_unverified: true,
        });
      }

      const hash  = await bcrypt.hash(password, 12);
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000);

      const { rows } = await query(
        `INSERT INTO users (email, password_hash, name, email_verified, verification_token, verification_expires_at)
         VALUES ($1, $2, $3, FALSE, $4, $5)
         RETURNING id, email, name`,
        [email, hash, name || null, token, expiresAt]
      );

      // Fire-and-forget email sending — don't block the HTTP response on SMTP.
      // The user will know via the toast/UI; if the email never arrives they can request a resend.
      sendVerificationEmail({ toEmail: email, toName: name, token })
        .then(ok => console.log(`[Auth] Verification email to ${email}: ${ok ? 'sent' : 'failed'}`))
        .catch(err => console.error(`[Auth] Verification email error for ${email}:`, err.message));

      res.status(201).json({
        success: true,
        email_sent: true, // optimistic — the email is being sent in the background
        message: `Un email de confirmation est en cours d'envoi à ${email}. Cliquez sur le lien pour activer votre compte.`,
        email,
      });
    } catch (err) { next(err); }
  }
);

// ============================================================================
// POST /api/auth/verify-email — confirms email & logs in
// ============================================================================
router.post('/verify-email',
  body('token').trim().isLength({ min: 16, max: 128 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Token invalide' });

    try {
      const { rows } = await query(
        `SELECT id, email, name, email_verified, verification_expires_at
         FROM users WHERE verification_token = $1`,
        [req.body.token]
      );
      if (!rows.length) {
        return res.status(404).json({ error: 'Lien invalide ou déjà utilisé. Demandez un nouveau lien.' });
      }
      const user = rows[0];

      if (user.email_verified) {
        // Already verified — log them in
        const jwtToken = signToken({ id: user.id, email: user.email, kind: 'user' });
        return res.json({
          success: true,
          already_verified: true,
          token: jwtToken,
          user: { id: user.id, email: user.email, name: user.name },
        });
      }

      if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
        return res.status(410).json({
          error: 'Ce lien a expiré. Demandez un nouveau lien de vérification.',
          expired: true,
          email: user.email,
        });
      }

      // Mark as verified, clear token
      await query(
        `UPDATE users
         SET email_verified = TRUE, verification_token = NULL, verification_expires_at = NULL, last_login = NOW()
         WHERE id = $1`,
        [user.id]
      );

      const jwtToken = signToken({ id: user.id, email: user.email, kind: 'user' });
      res.json({
        success: true,
        token: jwtToken,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (err) { next(err); }
  }
);

// ============================================================================
// POST /api/auth/forgot-password — send a password reset email
// ============================================================================
async function sendResetPasswordEmail({ toEmail, toName, token }) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  const subject = `Réinitialisation de votre mot de passe - Portfolio Saleh`;
  const html = `<!DOCTYPE html>
<html><body style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;background:#f8f5ef">
  <div style="background:white;border-radius:12px;padding:30px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
    <h1 style="color:#c8a96e;margin:0 0 12px 0;font-family:Georgia,serif">Réinitialisation${toName ? ' - ' + toName : ''}</h1>
    <p style="font-size:15px;line-height:1.6">
      Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    <p style="text-align:center;margin:28px 0">
      <a href="${resetUrl}" style="background:#c8a96e;color:#1a1a1a;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;font-size:15px">
        Choisir un nouveau mot de passe
      </a>
    </p>
    <p style="font-size:13px;color:#666;line-height:1.6">
      Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    </p>
    <p style="font-size:12px;font-family:monospace;background:#f8f5ef;padding:10px;border-radius:6px;word-break:break-all;color:#666">
      ${resetUrl}
    </p>
  </div>
</body></html>`;
  const text = `Réinitialisation de votre mot de passe\n\nCliquez sur ce lien pour choisir un nouveau mot de passe :\n${resetUrl}\n\nCe lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.`;

  if (process.env.BREVO_API_KEY) {
    try {
      const axios = require('axios');
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@salehmahamatsaleh.com';
      const senderName  = process.env.BREVO_SENDER_NAME  || 'Portfolio Saleh';
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        { sender: { email: senderEmail, name: senderName }, to: [{ email: toEmail, name: toName || toEmail }], subject, htmlContent: html, textContent: text },
        { headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      console.log(`[Auth] Reset password email sent to ${toEmail} via Brevo`);
      return true;
    } catch (err) {
      console.error('[Auth] Brevo reset email failed:', err.response?.data || err.message);
      return false;
    }
  }
  return false;
}

router.post('/forgot-password',
  resendLimiter,
  body('email').trim().toLowerCase().isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Email invalide' });
    const { email } = req.body;

    try {
      const { rows } = await query('SELECT id, email, name FROM users WHERE email = $1', [email]);
      // Always respond OK to avoid leaking which emails exist
      if (!rows.length) {
        return res.json({ success: true, message: 'Si cet email existe dans notre base, un lien de réinitialisation vient d\'être envoyé.' });
      }
      const user = rows[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await query('UPDATE users SET reset_token = $1, reset_expires_at = $2 WHERE id = $3', [token, expiresAt, user.id]);

      // Fire-and-forget email
      sendResetPasswordEmail({ toEmail: user.email, toName: user.name, token })
        .catch(err => console.error('[Auth] Reset email background error:', err.message));

      res.json({ success: true, message: 'Un lien de réinitialisation vient d\'être envoyé à votre email.' });
    } catch (err) {
      console.error('[Auth] forgot-password error:', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ============================================================================
// POST /api/auth/reset-password — apply new password using reset token
// ============================================================================
router.post('/reset-password',
  body('token').trim().isLength({ min: 16, max: 128 }),
  body('newPassword').isLength({ min: 6, max: 200 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Token invalide ou mot de passe trop court (min 6 caractères)' });
    const { token, newPassword } = req.body;

    try {
      const { rows } = await query(
        'SELECT id, email, name, reset_expires_at FROM users WHERE reset_token = $1',
        [token]
      );
      if (!rows.length) return res.status(404).json({ error: 'Lien invalide ou déjà utilisé.' });

      const user = rows[0];
      if (new Date(user.reset_expires_at) < new Date()) {
        return res.status(410).json({ error: 'Lien expiré. Demandez un nouveau lien.' });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await query(
        'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires_at = NULL, email_verified = TRUE WHERE id = $2',
        [newHash, user.id]
      );

      // Auto-login after reset
      const newToken = signToken({ id: user.id, email: user.email, kind: 'user' });
      res.json({
        success: true,
        message: 'Mot de passe réinitialisé.',
        token: newToken,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (err) {
      console.error('[Auth] reset-password error:', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// ============================================================================
// POST /api/auth/resend-verification — resend verification email
// ============================================================================
router.post('/resend-verification',
  resendLimiter,
  body('email').trim().toLowerCase().isEmail(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Email invalide' });

    try {
      const { rows } = await query('SELECT id, email, name, email_verified FROM users WHERE email = $1', [req.body.email]);
      if (!rows.length) {
        // Don't reveal if user exists (security) — generic success
        return res.json({ success: true, message: 'Si cet email correspond à un compte non vérifié, un nouveau lien a été envoyé.' });
      }
      const user = rows[0];
      if (user.email_verified) {
        return res.json({ success: true, already_verified: true, message: 'Cet email est déjà vérifié. Connectez-vous directement.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
      await query(
        'UPDATE users SET verification_token = $1, verification_expires_at = $2 WHERE id = $3',
        [token, expiresAt, user.id]
      );

      const emailSent = await sendVerificationEmail({ toEmail: user.email, toName: user.name, token });
      res.json({
        success: true,
        email_sent: emailSent,
        message: emailSent
          ? `Nouveau lien envoyé à ${user.email}.`
          : "Échec d'envoi du email. Contactez le support.",
      });
    } catch (err) { next(err); }
  }
);

// ============================================================================
// POST /api/auth/login — refuses unverified accounts
// ============================================================================
router.post('/login',
  loginLimiter,
  body('email').trim().toLowerCase().isEmail(),
  body('password').isLength({ min: 6, max: 200 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Données invalides' });
    const { email, password } = req.body;

    try {
      const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

      if (!user.email_verified) {
        return res.status(403).json({
          error: 'Votre email n\'est pas vérifié. Vérifiez votre boîte mail ou demandez un nouveau lien.',
          email_unverified: true,
          email: user.email,
        });
      }

      await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
      const token = signToken({ id: user.id, email: user.email, kind: 'user' });
      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (err) { next(err); }
  }
);

// ============================================================================
// GET /api/auth/me
// ============================================================================
router.get('/me', requireUser, (req, res) => {
  res.json({ success: true, user: req.dbUser });
});

// ============================================================================
// CV Drafts — save/load in-progress CV for logged-in users
// ============================================================================
router.get('/cv-draft', requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT data, template_id, color, last_step, updated_at FROM cv_drafts WHERE user_id = $1',
      [req.dbUser.id]
    );
    if (!rows.length) return res.json({ success: true, draft: null });
    res.json({ success: true, draft: rows[0] });
  } catch (err) { next(err); }
});

router.put('/cv-draft', requireUser, async (req, res, next) => {
  try {
    const { data, template_id, color, last_step } = req.body || {};
    await query(
      `INSERT INTO cv_drafts (user_id, data, template_id, color, last_step, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         data = EXCLUDED.data,
         template_id = EXCLUDED.template_id,
         color = EXCLUDED.color,
         last_step = EXCLUDED.last_step,
         updated_at = NOW()`,
      [req.dbUser.id, data || {}, template_id || null, color || null, last_step ?? 0]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/cv-draft', requireUser, async (req, res, next) => {
  try {
    await query('DELETE FROM cv_drafts WHERE user_id = $1', [req.dbUser.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/auth/my-purchases
router.get('/my-purchases', requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        p.id, p.template_slug, p.template_name, p.amount, p.currency, p.status,
        p.canva_edit_url, p.paypal_order_id, p.delivered_at, p.created_at,
        t.preview_url, t.category, t.style
      FROM cv_template_purchases p
      LEFT JOIN cv_templates t ON t.slug = p.template_slug
      WHERE p.user_id = $1 AND p.status = 'completed'
      ORDER BY p.delivered_at DESC NULLS LAST, p.created_at DESC
    `, [req.dbUser.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.requireUser = requireUser;
