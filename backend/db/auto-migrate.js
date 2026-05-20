// Auto-migration au démarrage : crée toutes les tables si elles n'existent pas.
// Idempotent — safe à exécuter plusieurs fois.
// Utilisé en production (Railway) car on n'a pas accès à psql directement.

const fs = require('fs');
const path = require('path');
const { query } = require('./index');

async function autoMigrate() {
  try {
    const exists = await query("SELECT to_regclass('public.profile') AS r");
    const profileExists = !!exists.rows[0].r;

    if (!profileExists) {
      console.log('[Migrate] Profile table not found — running schema.sql...');
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
      const stmts = schema.split(/;\s*\n/).map(s => s.trim()).filter(s => s && !s.startsWith('--'));
      for (const s of stmts) {
        try { await query(s); } catch (e) { /* ignore "already exists" */ }
      }
      console.log('[Migrate] Schema applied');
    }

    // Idempotent ALTERs (colonnes ajoutées au fil du temps)
    await query('ALTER TABLE profile ADD COLUMN IF NOT EXISTS whatsapp TEXT');

    await query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      email_verified BOOLEAN DEFAULT FALSE,
      verification_token TEXT,
      verification_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
    )`);
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)');

    await query(`CREATE TABLE IF NOT EXISTS cv_templates (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      style TEXT,
      preview_url TEXT,
      edit_url TEXT,
      view_url TEXT,
      builder_id TEXT,
      is_premium BOOLEAN DEFAULT FALSE,
      price NUMERIC(10,2) DEFAULT 0,
      currency TEXT DEFAULT 'EUR',
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      display_order INT DEFAULT 0,
      downloads INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS cv_template_purchases (
      id SERIAL PRIMARY KEY,
      template_id INT REFERENCES cv_templates(id) ON DELETE SET NULL,
      template_slug TEXT NOT NULL,
      template_name TEXT NOT NULL,
      paypal_order_id TEXT UNIQUE NOT NULL,
      payer_email TEXT,
      payer_name TEXT,
      amount NUMERIC(10,2) NOT NULL,
      currency TEXT DEFAULT 'EUR',
      status TEXT NOT NULL DEFAULT 'pending',
      canva_edit_url TEXT,
      delivered_at TIMESTAMPTZ,
      ip_address TEXT,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS cv_drafts (
      id SERIAL PRIMARY KEY,
      user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '{}',
      template_id TEXT,
      color TEXT,
      last_step INT DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS media_assets (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT,
      mime_type TEXT,
      size_bytes INT,
      url TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      alt_text TEXT,
      uploaded_by INT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      company TEXT,
      message TEXT NOT NULL,
      rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
      photo_url TEXT,
      relation TEXT,
      email TEXT,
      is_approved BOOLEAN DEFAULT FALSE,
      is_featured BOOLEAN DEFAULT FALSE,
      display_order INT DEFAULT 0,
      ip_address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    console.log('[Migrate] All tables ready');
  } catch (err) {
    console.error('[Migrate] Failed:', err.message);
    // Don't throw — let the server start anyway so we can debug via logs
  }
}

module.exports = { autoMigrate };
