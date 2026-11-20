const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xssClean = require('xss-clean');
const morgan = require('morgan');

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Production domain (à ajuster selon ton vrai domaine)
  'https://salehmahamatsaleh.com',
  'https://www.salehmahamatsaleh.com',
];

// Allow Vercel preview deployments (xxx-yyy.vercel.app) in addition to fixed list
function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

const corsBase = {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: false,
  maxAge: 86400,
};

// Same-origin requests (site and API are one app on Vercel) are always allowed
function sameOrigin(req, origin) {
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

const corsOptions = (req, callback) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin) || sameOrigin(req, origin)) {
    callback(null, { ...corsBase, origin: true });
  } else {
    callback(Object.assign(new Error('CORS policy violation'), { status: 403 }));
  }
};

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  skip: (req) => req.originalUrl.startsWith('/api/health'),
});

const contactLimiter = rateLimit({
  windowMs: parseInt(process.env.CONTACT_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  max: parseInt(process.env.CONTACT_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many contact requests. Please try again in an hour.' },
  keyGenerator: (req) => req.ip,
});

function applySecurityMiddleware(app) {
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'"],
        imgSrc:     ["'self'", 'data:', 'http:', 'https:', 'blob:'],
        connectSrc: ["'self'"],
        frameSrc:   ["'none'"],
        objectSrc:  ["'none'"],
        // upgradeInsecureRequests removed in dev — HTTPS isn't required on localhost
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use('/api/', globalLimiter);
  app.use(hpp());
  app.use(xssClean());

  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  app.disable('x-powered-by');
}

module.exports = { applySecurityMiddleware, contactLimiter };
