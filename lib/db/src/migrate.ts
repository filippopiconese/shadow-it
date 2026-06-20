import type { Pool } from "pg";

// Idempotent schema bootstrap, applied at server start using the APPLICATION's
// own pg connection (node-postgres) — NOT drizzle-kit, whose separate connection
// fails to introspect on Railway's private network. `IF NOT EXISTS` everywhere
// makes this safe to run on every boot and on both fresh and existing DBs.
//
// NOTE: keep this in sync with lib/db/src/schema/*. For larger projects switch to
// generated drizzle migrations; this hand-rolled DDL is the pragmatic, robust path.
const DDL = /* sql */ `
CREATE TABLE IF NOT EXISTS organizations (
  id serial PRIMARY KEY,
  provider text NOT NULL DEFAULT 'google',
  domain text NOT NULL,
  name text,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  tenant_id text,
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean NOT NULL DEFAULT false,
  smtp_user text,
  smtp_pass text,
  email_from text,
  alert_emails text,
  directory_users text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL REFERENCES organizations(id),
  provider text NOT NULL DEFAULT 'google',
  external_id text NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  picture text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oauth_apps (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL REFERENCES organizations(id),
  client_id text NOT NULL,
  app_name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  risk_level text NOT NULL DEFAULT 'low',
  risk_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  scopes text[] NOT NULL DEFAULT '{}',
  authorized_users text[] NOT NULL DEFAULT '{}',
  is_dismissed boolean NOT NULL DEFAULT false,
  icon_url text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scans (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL REFERENCES organizations(id),
  status text NOT NULL DEFAULT 'pending',
  apps_found integer,
  new_apps_found integer,
  removed_apps_found integer,
  users_found integer,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL UNIQUE REFERENCES organizations(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Defensive: add columns introduced after the initial schema (no-op if present).
ALTER TABLE oauth_apps ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS removed_apps_found integer;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS users_found integer;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_host text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_port integer;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_secure boolean NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_user text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_pass text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email_from text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS alert_emails text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS directory_users text[];

-- Multi-provider (Google + Microsoft 365) migration. Idempotent: safe on every boot.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'google';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'google';

-- Rename users.google_id -> external_id (provider-agnostic subject id) once.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'external_id') THEN
    ALTER TABLE users RENAME COLUMN google_id TO external_id;
  END IF;
END $$;

-- Replace single-column uniques with (domain, provider) and (provider, external_id).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_domain_key') THEN
    ALTER TABLE organizations DROP CONSTRAINT organizations_domain_key;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_google_id_key') THEN
    ALTER TABLE users DROP CONSTRAINT users_google_id_key;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS org_domain_provider_uq ON organizations (domain, provider);
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_external_id_uq ON users (provider, external_id);
`;

export async function runMigrations(pool: Pool): Promise<void> {
  await pool.query(DDL);
}
