-- ────────────────────────────────────────────────────────────────────────────
-- Portfolio — PostgreSQL Schema
-- All translatable text fields use JSONB: { "fr": "...", "en": "...", "ar": "..." }
-- ────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS contact_messages   CASCADE;
DROP TABLE IF EXISTS admin_users        CASCADE;
DROP TABLE IF EXISTS certifications     CASCADE;
DROP TABLE IF EXISTS tech_stack         CASCADE;
DROP TABLE IF EXISTS skills             CASCADE;
DROP TABLE IF EXISTS skill_categories   CASCADE;
DROP TABLE IF EXISTS activities         CASCADE;
DROP TABLE IF EXISTS education          CASCADE;
DROP TABLE IF EXISTS experience         CASCADE;
DROP TABLE IF EXISTS projects           CASCADE;
DROP TABLE IF EXISTS strengths          CASCADE;
DROP TABLE IF EXISTS languages          CASCADE;
DROP TABLE IF EXISTS profile            CASCADE;

CREATE TABLE profile (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  first_name  TEXT,
  email       TEXT,
  phone       TEXT,
  location    TEXT,
  birth       TEXT,
  license     TEXT,
  linkedin    TEXT,
  github      TEXT,
  whatsapp    TEXT,
  photo_url   TEXT,
  title       JSONB NOT NULL DEFAULT '{}',
  subtitle    JSONB NOT NULL DEFAULT '{}',
  tagline     JSONB NOT NULL DEFAULT '{}',
  bio         JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE languages (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  level         JSONB NOT NULL DEFAULT '{}',
  proficiency   INT  NOT NULL CHECK (proficiency >= 0 AND proficiency <= 100),
  flag          TEXT,
  display_order INT  DEFAULT 0
);

CREATE TABLE strengths (
  id            SERIAL PRIMARY KEY,
  icon          TEXT,
  title         JSONB NOT NULL DEFAULT '{}',
  description   JSONB NOT NULL DEFAULT '{}',
  display_order INT  DEFAULT 0
);

CREATE TABLE projects (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  subtitle          JSONB NOT NULL DEFAULT '{}',
  description       JSONB NOT NULL DEFAULT '{}',
  long_description  JSONB NOT NULL DEFAULT '{}',
  category          TEXT,
  highlights        JSONB DEFAULT '[]',
  tech              TEXT[] DEFAULT '{}',
  color             TEXT,
  icon              TEXT,
  github_url        TEXT,
  featured          BOOLEAN DEFAULT false,
  display_order     INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skill_categories (
  id            SERIAL PRIMARY KEY,
  name          JSONB NOT NULL DEFAULT '{}',
  icon          TEXT,
  color         TEXT,
  display_order INT DEFAULT 0
);

CREATE TABLE skills (
  id            SERIAL PRIMARY KEY,
  category_id   INT NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  level         INT NOT NULL CHECK (level >= 0 AND level <= 100),
  display_order INT DEFAULT 0
);

CREATE TABLE tech_stack (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  icon          TEXT,
  display_order INT DEFAULT 0
);

CREATE TABLE certifications (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  issuer        TEXT,
  year          TEXT,
  color         TEXT,
  display_order INT DEFAULT 0
);

CREATE TABLE experience (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  role          JSONB NOT NULL DEFAULT '{}',
  company       TEXT,
  location      TEXT,
  period        TEXT,
  type          TEXT,
  is_current    BOOLEAN DEFAULT false,
  description   JSONB NOT NULL DEFAULT '{}',
  tasks         JSONB DEFAULT '[]',
  color         TEXT,
  display_order INT DEFAULT 0
);

CREATE TABLE education (
  id            SERIAL PRIMARY KEY,
  degree        JSONB NOT NULL DEFAULT '{}',
  school        TEXT,
  location      TEXT,
  period        TEXT,
  is_current    BOOLEAN DEFAULT false,
  modules       JSONB DEFAULT '[]',
  display_order INT DEFAULT 0
);

CREATE TABLE activities (
  id            SERIAL PRIMARY KEY,
  icon          TEXT,
  title         JSONB NOT NULL DEFAULT '{}',
  description   JSONB NOT NULL DEFAULT '{}',
  year          TEXT,
  display_order INT DEFAULT 0
);

CREATE TABLE contact_messages (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT,
  message     TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

CREATE INDEX idx_projects_featured ON projects(featured, display_order);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_experience_order  ON experience(display_order);
CREATE INDEX idx_contact_unread    ON contact_messages(is_read, created_at DESC);
CREATE INDEX idx_skills_category   ON skills(category_id, display_order);
