import { sql } from 'drizzle-orm';
import { db } from './index';

export function hasDb(): boolean {
  return !!db && !!process.env.DATABASE_URL;
}

let INITIALIZED = false;

const DDL_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    image_url TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    banned BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS billboard_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    headline TEXT,
    subheadline TEXT,
    cloudinary_public_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    poster_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by_admin_email TEXT,
    duration_seconds INTEGER,
    width INTEGER,
    height INTEGER,
    display_order INTEGER NOT NULL DEFAULT 0,
    lighting_override INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE billboard_videos ADD COLUMN IF NOT EXISTS lighting_override INTEGER`,
  `CREATE INDEX IF NOT EXISTS idx_billboard_videos_active ON billboard_videos(is_active)`,
  `CREATE INDEX IF NOT EXISTS idx_billboard_videos_order ON billboard_videos(display_order DESC)`,
  `CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_credits_user ON credits(user_id)`,
  `CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    model TEXT,
    feature TEXT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON credit_transactions(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    model TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    prompt TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    processing_time INTEGER,
    input_size INTEGER,
    output_size INTEGER,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES credit_packages(id),
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    credits INTEGER NOT NULL,
    status TEXT NOT NULL,
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id)`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_id TEXT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read)`,
];

export async function ensureDbSchemaInitialized(force = false): Promise<{ ok: boolean; error?: string; initialized?: boolean }> {
  if (!hasDb()) return { ok: true, initialized: false };
  if (INITIALIZED && !force) return { ok: true, initialized: true };

  const firstErr: string[] = [];
  let warned = false;

  for (const ddl of DDL_STATEMENTS) {
    try {
      await db.execute(sql.raw(ddl));
    } catch (e: any) {
      const m = e?.message || e?.cause?.message || String(e ?? '');
      const low = m.toLowerCase();
      if (
        low.includes('already exists') ||
        low.includes('duplicate') ||
        low.includes('relation') && low.includes('exist')
      ) {
        continue;
      }
      if (!warned) {
        warned = true;
        console.warn('[db/auto-init] DDL failed:', m.slice(0, 300));
      }
      if (!firstErr.length) firstErr.push(m.slice(0, 200));
    }
  }

  if (firstErr.length) {
    return { ok: false, error: firstErr[0] };
  }

  INITIALIZED = true;
  return { ok: true, initialized: true };
}
