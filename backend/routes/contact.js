const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { contactLimiter } = require('../middleware/security');
const { query } = require('../db');

const sanitize = (s) =>
  String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').trim();

const validation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères.')
    .matches(/^[a-zA-ZÀ-ÿ؀-ۿ\s\-'.]+$/).withMessage('Le nom contient des caractères invalides.'),
  body('email').trim().isEmail().withMessage("L'adresse email est invalide.").normalizeEmail()
    .isLength({ max: 254 }).withMessage("L'email est trop long."),
  body('subject').trim().isLength({ min: 3, max: 150 }).withMessage('Le sujet doit contenir entre 3 et 150 caractères.'),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Le message doit contenir entre 10 et 2000 caractères.'),
];

router.post('/', contactLimiter, validation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  const name    = sanitize(req.body.name);
  const email   = sanitize(req.body.email);
  const subject = sanitize(req.body.subject);
  const message = sanitize(req.body.message);
  const ip      = req.ip;
  const ua      = (req.headers['user-agent'] || '').slice(0, 500);

  try {
    await query(
      'INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5,$6)',
      [name, email, subject, message, ip, ua]
    );
  } catch (err) {
    console.error('Contact DB save error:', err.message);
  }

  const emailConfigured =
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    !process.env.EMAIL_USER.startsWith('your_') &&
    !process.env.EMAIL_PASS.startsWith('your_');

  if (emailConfigured) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to:   process.env.EMAIL_TO || process.env.EMAIL_USER,
        replyTo: `"${name}" <${email}>`,
        subject: `[Portfolio] ${subject}`,
        text: `Nouveau message reçu via le portfolio.\n\nDe : ${name} <${email}>\nSujet : ${subject}\n\n${message}\n\n---\nIP : ${ip}`,
        html: `<!DOCTYPE html>
<html><body style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;background:#f8f5ef">
  <div style="background:white;border-radius:12px;padding:30px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
    <h1 style="color:#c8a96e;margin:0 0 8px 0;font-family:Georgia,serif">Nouveau message</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px 0">Reçu via le formulaire de contact de ton portfolio</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <tr><td style="padding:8px 0;color:#888;font-size:13px;width:80px"><strong>De</strong></td><td style="padding:8px 0;font-size:14px">${name}</td></tr>
      <tr><td style="padding:8px 0;color:#888;font-size:13px"><strong>Email</strong></td><td style="padding:8px 0;font-size:14px"><a href="mailto:${email}" style="color:#c8a96e;text-decoration:none">${email}</a></td></tr>
      <tr><td style="padding:8px 0;color:#888;font-size:13px"><strong>Sujet</strong></td><td style="padding:8px 0;font-size:14px"><strong>${subject}</strong></td></tr>
    </table>

    <div style="background:#f8f5ef;border-left:4px solid #c8a96e;padding:16px 20px;border-radius:6px;margin:16px 0 24px 0">
      <p style="white-space:pre-wrap;line-height:1.7;margin:0;font-size:14px">${message}</p>
    </div>

    <p style="text-align:center;margin:24px 0 8px 0">
      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="background:#c8a96e;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;font-size:14px">Répondre à ${name}</a>
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:30px 0 16px 0"/>
    <p style="font-size:11px;color:#aaa;margin:0">
      IP : ${ip} · Reçu le ${new Date().toLocaleString('fr-FR')}<br/>
      Aussi sauvegardé dans <strong>/admin → Messages</strong>
    </p>
  </div>
</body></html>`,
      });
      console.log(`[Contact] Email sent to ${process.env.EMAIL_TO || process.env.EMAIL_USER} (from ${email})`);
    } catch (err) {
      console.error('[Contact] Email send failed:', err.message);
    }
  } else {
    console.warn('[Contact] Email NOT configured (EMAIL_USER/EMAIL_PASS are placeholders). Message saved to DB only.');
  }

  res.status(200).json({
    success: true,
    message: 'Votre message a été envoyé avec succès. Je vous répondrai bientôt !',
  });
});

module.exports = router;
