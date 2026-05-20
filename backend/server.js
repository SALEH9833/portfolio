require('dotenv').config();
const express = require('express');
const path = require('path');
const { applySecurityMiddleware } = require('./middleware/security');

const profileRoutes    = require('./routes/profile');
const projectsRoutes   = require('./routes/projects');
const skillsRoutes     = require('./routes/skills');
const experienceRoutes = require('./routes/experience');
const contactRoutes    = require('./routes/contact');
const adminRoutes      = require('./routes/admin');
const chatbotRoutes    = require('./routes/chatbot');
const cvTemplatesRoutes = require('./routes/cv-templates');
const paymentsRoutes    = require('./routes/payments');
const authRoutes        = require('./routes/auth');
const mediaRoutes       = require('./routes/media');
const testimonialsRoutes = require('./routes/testimonials');
const publicUploadsRoutes = require('./routes/public-uploads');
const { healthcheck }  = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

applySecurityMiddleware(app);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/images', express.static(path.join(__dirname, 'public/images'), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  },
}));

app.use('/files', express.static(path.join(__dirname, 'public/files'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (filePath.endsWith('.pdf')) res.setHeader('Content-Disposition', 'attachment');
  },
}));

app.use('/api/profile',    profileRoutes);
app.use('/api/projects',   projectsRoutes);
app.use('/api/skills',     skillsRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/contact',    contactRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/chatbot',    chatbotRoutes);
app.use('/api/cv-templates', cvTemplatesRoutes);
app.use('/api/payments',     paymentsRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/media',        mediaRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/public-uploads', publicUploadsRoutes);
// Serve uploaded files
app.use('/uploads', express.static(require('path').join(__dirname, 'public', 'uploads'), { maxAge: '7d' }));

app.get('/health', async (req, res) => {
  const db = await healthcheck();
  res.json({ status: db ? 'ok' : 'degraded', db, timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error(`[${new Date().toISOString()}] ERROR:`, isDev ? err.stack : err.message);
  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Une erreur interne est survenue.',
  });
});

(async () => {
  // Auto-migrate DB schema on startup (idempotent — safe to run on every boot)
  const { autoMigrate } = require('./db/auto-migrate');
  await autoMigrate();

  app.listen(PORT, () => {
    console.log(`Backend API → http://localhost:${PORT}`);
    console.log(`Health → http://localhost:${PORT}/health`);
    console.log(`Env: ${process.env.NODE_ENV || 'development'}`);
  });
})();

module.exports = app;
