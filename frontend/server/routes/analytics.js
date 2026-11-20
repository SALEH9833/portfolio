const express = require('express');
const rateLimit = require('express-rate-limit');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Rate limit: max 60 hits per IP per minute (anti-abuse, generous)
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// Crawler / bot detection — we don't count them
const BOT_REGEX = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegram|preview|fetch|axios|node|curl|wget|monitor|pingdom|uptimerobot/i;

// =====================================================================
// POST /api/track — record a page view (public)
// =====================================================================
router.post('/', trackLimiter, async (req, res) => {
  try {
    const path = String(req.body?.path || '/').slice(0, 200);
    const ua   = String(req.headers['user-agent'] || '').slice(0, 300);
    const ref  = String(req.body?.referer || req.headers['referer'] || '').slice(0, 300);
    const ip   = (req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || '').slice(0, 45);

    // Skip bots
    if (BOT_REGEX.test(ua)) return res.status(204).end();

    await query(
      'INSERT INTO page_views (path, ip, user_agent, referer) VALUES ($1, $2, $3, $4)',
      [path, ip, ua, ref]
    ).catch(() => { /* silently ignore — never break tracking */ });

    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

// =====================================================================
// GET /api/track/stats — admin only — detailed visitor analytics
// =====================================================================
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const [today, week, month, total, popular, recent, byDay] = await Promise.all([
      // Today's unique visitors (by IP)
      query("SELECT COUNT(DISTINCT ip)::int AS n FROM page_views WHERE visited_at::date = CURRENT_DATE"),
      // Last 7 days unique
      query("SELECT COUNT(DISTINCT ip)::int AS n FROM page_views WHERE visited_at >= NOW() - INTERVAL '7 days'"),
      // Last 30 days unique
      query("SELECT COUNT(DISTINCT ip)::int AS n FROM page_views WHERE visited_at >= NOW() - INTERVAL '30 days'"),
      // All-time unique
      query("SELECT COUNT(DISTINCT ip)::int AS n FROM page_views"),
      // Top 10 pages
      query("SELECT path, COUNT(*)::int AS hits FROM page_views WHERE visited_at >= NOW() - INTERVAL '30 days' GROUP BY path ORDER BY hits DESC LIMIT 10"),
      // Last 20 visits
      query("SELECT path, ip, user_agent, referer, visited_at FROM page_views ORDER BY visited_at DESC LIMIT 20"),
      // Visits per day (last 14 days)
      query("SELECT visited_at::date AS day, COUNT(DISTINCT ip)::int AS unique_visitors, COUNT(*)::int AS hits FROM page_views WHERE visited_at >= NOW() - INTERVAL '14 days' GROUP BY day ORDER BY day DESC"),
    ]);

    res.json({
      success: true,
      data: {
        today:      today.rows[0].n,
        week:       week.rows[0].n,
        month:      month.rows[0].n,
        total:      total.rows[0].n,
        popular:    popular.rows,
        recent:     recent.rows,
        by_day:     byDay.rows,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
