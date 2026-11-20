// Express API, served by Next.js through pages/api/[...path].js (one Vercel project).
const express = require('express');
const { applySecurityMiddleware } = require('./middleware/security');
const { healthcheck } = require('./db');

const app = express();

applySecurityMiddleware(app);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api/profile',        require('./routes/profile'));
app.use('/api/projects',       require('./routes/projects'));
app.use('/api/skills',         require('./routes/skills'));
app.use('/api/experience',     require('./routes/experience'));
app.use('/api/contact',        require('./routes/contact'));
app.use('/api/admin',          require('./routes/admin'));
app.use('/api/chatbot',        require('./routes/chatbot'));
app.use('/api/media',          require('./routes/media'));
app.use('/api/testimonials',   require('./routes/testimonials'));
app.use('/api/public-uploads', require('./routes/public-uploads'));
app.use('/api/track',          require('./routes/analytics'));

app.get('/api/health', async (req, res) => {
  const db = await healthcheck();
  res.json({ status: db ? 'ok' : 'degraded', db, timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error(`[${new Date().toISOString()}] ERROR:`, isDev ? err.stack : err.message);
  res.status(err.status || 500).json({
    success: false,
    error: isDev || err.status ? err.message : 'Une erreur interne est survenue.',
  });
});

module.exports = app;
