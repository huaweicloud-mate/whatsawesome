-- Whats Awesome GaussDB(for openGauss) baseline schema.
-- Target: FunctionGraph API backend + GaussDB JSONB object model.
-- Secrets, connection strings, and account passwords are intentionally not included.

CREATE TABLE IF NOT EXISTS skill (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(128) NOT NULL,
  vendor_type VARCHAR(32) NOT NULL,
  logo_url TEXT,
  category_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty_lv INTEGER NOT NULL CHECK (difficulty_lv BETWEEN 1 AND 100),
  importance JSONB NOT NULL DEFAULT '{}'::jsonb,
  doc JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  related_news JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skill_status_difficulty ON skill (status, difficulty_lv);
CREATE INDEX IF NOT EXISTS idx_skill_vendor ON skill (vendor_name);
CREATE INDEX IF NOT EXISTS idx_skill_category_tags ON skill USING gin (category_tags);

CREATE TABLE IF NOT EXISTS scenario_case (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  scenario_desc TEXT NOT NULL,
  source VARCHAR(32) NOT NULL CHECK (source IN ('ai_generated', 'manual')),
  skill_slugs JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty_lv INTEGER NOT NULL CHECK (difficulty_lv BETWEEN 1 AND 100),
  importance JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_status_difficulty ON scenario_case (status, difficulty_lv);
CREATE INDEX IF NOT EXISTS idx_case_skill_slugs ON scenario_case USING gin (skill_slugs);
CREATE INDEX IF NOT EXISTS idx_case_category_tags ON scenario_case USING gin (category_tags);

CREATE TABLE IF NOT EXISTS player_profile (
  id VARCHAR(64) PRIMARY KEY,
  gitcode_id VARCHAR(128) NOT NULL UNIQUE,
  gitcode_username VARCHAR(128) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(32) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  growth JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_role ON player_profile (role);

CREATE TABLE IF NOT EXISTS quest_log (
  id VARCHAR(64) PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL,
  target_type VARCHAR(32) NOT NULL CHECK (target_type IN ('skill', 'case')),
  target_slug VARCHAR(128) NOT NULL,
  method VARCHAR(32) NOT NULL CHECK (method IN ('manual_upload', 'mcp_auto', 'admin_grant')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  judge_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (judge_status IN ('pending', 'approved', 'rejected')),
  judged_by VARCHAR(128),
  judge_note TEXT,
  lit_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quest_player_status ON quest_log (player_id, judge_status);
CREATE INDEX IF NOT EXISTS idx_quest_target ON quest_log (target_type, target_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_unique_approved
  ON quest_log (player_id, target_type, target_slug)
  WHERE judge_status = 'approved';

CREATE TABLE IF NOT EXISTS badge_def (
  id VARCHAR(64) PRIMARY KEY,
  key VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  title VARCHAR(128) NOT NULL,
  icon VARCHAR(32),
  description TEXT,
  rule JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_badge_def_status ON badge_def (status);
CREATE INDEX IF NOT EXISTS idx_badge_def_rule ON badge_def USING gin (rule);

CREATE TABLE IF NOT EXISTS news (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  related_skill_slug VARCHAR(128),
  ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_status_published ON news (status, published_at);
CREATE INDEX IF NOT EXISTS idx_news_related_skill ON news (related_skill_slug);

CREATE TABLE IF NOT EXISTS label_dict (
  id VARCHAR(64) PRIMARY KEY,
  key VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('domain', 'vendor')),
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_label_type_category ON label_dict (type, category);

CREATE TABLE IF NOT EXISTS difficulty_stage (
  id VARCHAR(64) PRIMARY KEY,
  stage VARCHAR(64) NOT NULL UNIQUE,
  min_lv INTEGER NOT NULL,
  max_lv INTEGER NOT NULL,
  icon VARCHAR(16),
  color VARCHAR(32),
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id VARCHAR(64) PRIMARY KEY,
  admin_id VARCHAR(128) NOT NULL,
  action VARCHAR(128) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(128) NOT NULL,
  before_snapshot JSONB,
  after_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_time ON admin_audit_log (admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_log (target_type, target_id);
