const { Pool } = require('pg');

// Neon / Vercel Postgres provide DATABASE_URL (or POSTGRES_URL) — use it if present, else build from parts
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isLocalDb = !connectionString || /localhost|127\.0\.0\.1/.test(connectionString);
const poolConfig = connectionString
  ? {
      connectionString,
      ssl: isLocalDb ? false : { rejectUnauthorized: false },
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'portfolio',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool({
  ...poolConfig,
  max: parseInt(process.env.DB_POOL_MAX) || 5, // small pool: serverless functions
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DB] ${Date.now() - start}ms · ${text.split('\n')[0].slice(0,70)}`);
    }
    return res;
  } catch (err) {
    console.error(`[DB ERROR] ${err.message} · Query: ${text.slice(0,100)}`);
    throw err;
  }
}

async function getClient() {
  const client = await pool.connect();
  return client;
}

async function healthcheck() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

module.exports = { pool, query, getClient, healthcheck };
