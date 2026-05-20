const express = require('express');
const router = express.Router();
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const jwt = require('jsonwebtoken');

// Extract user id from JWT if present (optional auth — payment works for guests too)
function maybeUser(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-CHANGE-ME');
      if (payload?.kind === 'user' && payload?.id) req.userId = payload.id;
    } catch { /* invalid token = treat as guest */ }
  }
  next();
}

const MODE          = (process.env.PAYPAL_MODE || 'live').toLowerCase();
const CLIENT_ID     = process.env.PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_BASE   = MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

const PAYPAL_ENABLED = !!(CLIENT_ID && CLIENT_SECRET);
if (PAYPAL_ENABLED) {
  console.log(`[Payments] PayPal enabled (${MODE} mode)`);
} else {
  console.log('[Payments] PayPal NOT configured (set PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET)');
}

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// PayPal helper: get OAuth access token (cached for 1h)
// ============================================================================
let _token = null;
let _tokenExpiresAt = 0;

async function getAccessToken() {
  if (_token && Date.now() < _tokenExpiresAt - 60_000) return _token;
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    }
  );
  _token = res.data.access_token;
  _tokenExpiresAt = Date.now() + (res.data.expires_in || 3600) * 1000;
  return _token;
}

// ============================================================================
// POST /api/payments/create-order
// ============================================================================
router.post('/create-order',
  limiter,
  maybeUser,
  body('template_slug').trim().isLength({ min: 1, max: 80 }),
  async (req, res, next) => {
    if (!PAYPAL_ENABLED) return res.status(503).json({ error: 'Payments not configured' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Invalid input' });

    try {
      const { rows } = await query(
        'SELECT id, slug, name, price, currency, edit_url FROM cv_templates WHERE slug = $1 AND is_premium = TRUE',
        [req.body.template_slug]
      );
      if (!rows.length) return res.status(404).json({ error: 'Template not found or not premium' });
      const template = rows[0];

      const token = await getAccessToken();
      const orderRes = await axios.post(
        `${PAYPAL_BASE}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: template.slug,
              description: `Modèle CV: ${template.name}`,
              amount: {
                currency_code: template.currency || 'EUR',
                value: Number(template.price).toFixed(2),
              },
            },
          ],
          application_context: {
            brand_name: 'Saleh Portfolio - CV Templates',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      // Pre-record the pending purchase (linked to user if authenticated)
      await query(
        `INSERT INTO cv_template_purchases (template_id, template_slug, template_name, paypal_order_id, amount, currency, status, ip_address, user_id)
         VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8)
         ON CONFLICT (paypal_order_id) DO NOTHING`,
        [template.id, template.slug, template.name, orderRes.data.id, template.price, template.currency || 'EUR', req.ip, req.userId || null]
      );

      res.json({ success: true, orderID: orderRes.data.id });
    } catch (err) {
      console.error('[Payments] create-order error:', err.response?.data || err.message);
      next(err);
    }
  }
);

// ============================================================================
// POST /api/payments/capture-order
// ============================================================================
router.post('/capture-order',
  limiter,
  body('orderID').trim().isLength({ min: 5, max: 64 }),
  async (req, res, next) => {
    if (!PAYPAL_ENABLED) return res.status(503).json({ error: 'Payments not configured' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Invalid input' });

    try {
      const orderID = req.body.orderID;
      const token = await getAccessToken();

      const captureRes = await axios.post(
        `${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const capture = captureRes.data;
      const status = capture.status; // COMPLETED expected
      const payer  = capture.payer || {};
      const purchaseUnit = (capture.purchase_units && capture.purchase_units[0]) || {};
      const templateSlug = purchaseUnit.reference_id;

      if (status !== 'COMPLETED') {
        await query(
          `UPDATE cv_template_purchases SET status = $1 WHERE paypal_order_id = $2`,
          [status.toLowerCase(), orderID]
        );
        return res.status(402).json({ error: 'Payment not completed', status });
      }

      // Fetch template details for delivery
      const { rows: trows } = await query(
        'SELECT id, name, edit_url, price, currency FROM cv_templates WHERE slug = $1',
        [templateSlug]
      );
      const template = trows[0];
      if (!template) return res.status(404).json({ error: 'Template no longer exists' });

      const payerEmail = payer.email_address || '';
      const payerName  = [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(' ').trim();
      const canvaUrl   = template.edit_url || null;

      // Update purchase record
      await query(
        `UPDATE cv_template_purchases
         SET status = 'completed', payer_email = $1, payer_name = $2, canva_edit_url = $3, delivered_at = NOW()
         WHERE paypal_order_id = $4`,
        [payerEmail, payerName, canvaUrl, orderID]
      );

      // Send confirmation email (best-effort, doesn't block response)
      sendDeliveryEmail({
        toEmail: payerEmail,
        toName:  payerName,
        template,
        orderID,
      }).catch((err) => console.warn('[Payments] Email send failed:', err.message));

      res.json({
        success: true,
        orderID,
        status: 'completed',
        template: {
          name: template.name,
          edit_url: canvaUrl,
        },
        payer: {
          email: payerEmail,
          name:  payerName,
        },
      });
    } catch (err) {
      console.error('[Payments] capture error:', err.response?.data || err.message);
      next(err);
    }
  }
);

// ============================================================================
// Email delivery (uses existing EMAIL_* env config)
// ============================================================================
async function sendDeliveryEmail({ toEmail, toName, template, orderID }) {
  if (!toEmail) return;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER.startsWith('your_')) {
    console.log('[Payments] Email not configured — skipping delivery email');
    return;
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const editUrl = template.edit_url;
  const html = `
  <!DOCTYPE html>
  <html><body style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;background:#f8f5ef">
    <div style="background:white;border-radius:12px;padding:30px;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
      <h1 style="color:#c8a96e;margin:0 0 10px 0;font-family:'Playfair Display',Georgia,serif">Merci pour votre achat !</h1>
      <p style="font-size:15px;line-height:1.6">${toName ? `Bonjour <strong>${toName}</strong>,` : 'Bonjour,'}</p>
      <p style="font-size:15px;line-height:1.6">Votre paiement pour le modèle de CV <strong>« ${template.name} »</strong> a été confirmé.</p>

      <div style="background:#f8f5ef;border-left:4px solid #c8a96e;padding:16px;border-radius:6px;margin:20px 0">
        <div style="font-size:13px;color:#666;margin-bottom:4px">Récapitulatif</div>
        <div style="font-weight:600">${template.name}</div>
        <div style="color:#666;font-size:14px;margin-top:4px">${Number(template.price).toFixed(2)} ${template.currency || 'EUR'}</div>
        <div style="color:#888;font-size:12px;margin-top:8px">Commande #${orderID}</div>
      </div>

      <p style="font-size:15px;line-height:1.6"><strong>🎨 Votre lien d'édition Canva :</strong></p>

      <p style="text-align:center;margin:24px 0">
        <a href="${editUrl}" style="background:#c8a96e;color:#1a1a1a;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block">Ouvrir mon CV dans Canva →</a>
      </p>

      <p style="font-size:13px;color:#666;line-height:1.6">
        Ce lien est <strong>permanent</strong> — vous pouvez le réutiliser à vie pour modifier votre CV.
        Sauvegardez cet email pour le retrouver facilement.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:30px 0"/>

      <p style="font-size:13px;color:#888;line-height:1.6">
        Une question ? Contactez-moi via <a href="https://wa.me/" style="color:#c8a96e">WhatsApp</a> ou par email à
        <a href="mailto:${process.env.EMAIL_USER || process.env.EMAIL_TO}" style="color:#c8a96e">${process.env.EMAIL_USER || process.env.EMAIL_TO}</a>.
      </p>

      <p style="font-size:12px;color:#aaa;text-align:center;margin-top:30px">
        © ${new Date().getFullYear()} · Saleh Mahamat Saleh<br/>
        Cybersecurity Student · Full-Stack Developer
      </p>
    </div>
  </body></html>
  `;

  await transporter.sendMail({
    from: `"Saleh CV Templates" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    bcc: process.env.EMAIL_TO || process.env.EMAIL_USER,
    subject: `✓ Votre modèle CV « ${template.name} » est prêt`,
    html,
    text: `Merci pour votre achat !\n\nVotre modèle CV "${template.name}" est prêt.\n\nLien d'édition Canva : ${editUrl}\n\nCommande: ${orderID}\nMontant: ${template.price} ${template.currency}\n\n— Saleh`,
  });
}

// ============================================================================
// Admin endpoint: list all purchases
// ============================================================================
const { requireAuth } = require('../middleware/auth');
router.get('/admin/purchases', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT p.*, t.name AS current_template_name
      FROM cv_template_purchases p
      LEFT JOIN cv_templates t ON t.id = p.template_id
      ORDER BY p.created_at DESC
      LIMIT 500
    `);
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'pending')::int   AS pending,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::numeric AS revenue
      FROM cv_template_purchases
    `);
    res.json({
      success: true,
      data: rows,
      stats: stats.rows[0],
      paypal_mode: MODE,
    });
  } catch (err) { next(err); }
});

router.get('/config', (req, res) => {
  res.json({
    enabled: PAYPAL_ENABLED,
    mode: MODE,
    client_id: PAYPAL_ENABLED ? CLIENT_ID : null,
  });
});

module.exports = router;
