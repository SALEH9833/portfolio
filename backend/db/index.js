const { Pool } = require('pg');

// Railway/Heroku/Render provide DATABASE_URL — use it if present, else build from parts
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
  max: 20,
  idleTimeoutMillis: 30000,
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
