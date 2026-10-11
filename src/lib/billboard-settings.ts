import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { ensureDbSchemaInitialized } from './db/auto-init';

export type BillboardDisplayMode = 'single' | 'rotate';

export interface BillboardSettings {
  displayMode: BillboardDisplayMode;
  autoLoop: boolean;
  crossfadeMs: number;
  backgroundLighting: number;
}

export const DEFAULT_BILLBOARD_SETTINGS: BillboardSettings = {
  displayMode: 'single',
  autoLoop: true,
  crossfadeMs: 450,
  backgroundLighting: 55,
};

const SETTINGS_KEY = 'billboard.hero';

const stateDir = (): string | null => {
  try {
    // On Vercel, process.cwd() is read-only; use /tmp for writable fallback.
    const base = process.env.VERCEL ? '/tmp' : process.cwd();
    const d = join(base, '.aisnv-state');
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
    return d;
  } catch (_) {
    return null;
  }
};

const settingsPath = (): string | null => {
  const d = stateDir();
  return d ? join(d, 'billboard-settings.json') : null;
};

declare global {
  // eslint-disable-next-line no-var
  var __AISNV_MEM_BILLBOARD_SETTINGS__: BillboardSettings | undefined;
}

function loadFromDisk(): BillboardSettings | null {
  const p = settingsPath();
  if (!p) return null;
  try {
    if (!existsSync(p)) return null;
    const raw = readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BillboardSettings>;
    return {
      displayMode: parsed.displayMode === 'rotate' ? 'rotate' : 'single',
      autoLoop: typeof parsed.autoLoop === 'boolean' ? parsed.autoLoop : DEFAULT_BILLBOARD_SETTINGS.autoLoop,
      crossfadeMs: Number.isFinite(parsed.crossfadeMs)
        ? Math.max(0, Math.min(5000, parsed.crossfadeMs as number))
        : DEFAULT_BILLBOARD_SETTINGS.crossfadeMs,
      backgroundLighting: Number.isFinite(parsed.backgroundLighting)
        ? Math.max(0, Math.min(100, parsed.backgroundLighting as number))
        : DEFAULT_BILLBOARD_SETTINGS.backgroundLighting,
    };
  } catch (_) {
    return null;
  }
}

function flushToDisk(s: BillboardSettings) {
  const p = settingsPath();
  if (!p) return;
  try { writeFileSync(p, JSON.stringify(s), 'utf-8'); } catch (_) {}
}

async function readFromDb(): Promise<BillboardSettings | null> {
  if (!db) return null;
  try {
    await ensureDbSchemaInitialized();
    const rows = await (db.execute as any)(
      sql.raw(`SELECT key, value FROM app_settings WHERE key = '${SETTINGS_KEY}' LIMIT 1`)
    );
    const arr = Array.isArray(rows) ? rows : (rows as any)?.rows || [];
    if (!arr.length) return null;
    const value = JSON.parse(arr[0].value) as Partial<BillboardSettings>;
    return {
      displayMode: value.displayMode === 'rotate' ? 'rotate' : 'single',
      autoLoop: typeof value.autoLoop === 'boolean' ? value.autoLoop : DEFAULT_BILLBOARD_SETTINGS.autoLoop,
      crossfadeMs: Number.isFinite(value.crossfadeMs)
        ? Math.max(0, Math.min(5000, value.crossfadeMs as number))
        : DEFAULT_BILLBOARD_SETTINGS.crossfadeMs,
      backgroundLighting: Number.isFinite(value.backgroundLighting)
        ? Math.max(0, Math.min(100, value.backgroundLighting as number))
        : DEFAULT_BILLBOARD_SETTINGS.backgroundLighting,
    };
  } catch (_) {
    return null;
  }
}

async function writeToDb(s: BillboardSettings): Promise<boolean> {
  if (!db) return false;
  try {
    await ensureDbSchemaInitialized();
    const encoded = JSON.stringify(s).replace(/'/g, "''");
    await db.execute(sql.raw(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ('${SETTINGS_KEY}', '${encoded}', NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
    ));
    return true;
  } catch (_) {
    return false;
  }
}

function currentMem(): BillboardSettings {
  if (!globalThis.__AISNV_MEM_BILLBOARD_SETTINGS__) {
    globalThis.__AISNV_MEM_BILLBOARD_SETTINGS__ = loadFromDisk() || { ...DEFAULT_BILLBOARD_SETTINGS };
  }
  return globalThis.__AISNV_MEM_BILLBOARD_SETTINGS__;
}

export async function getBillboardSettings(): Promise<BillboardSettings> {
  const mem = currentMem();
  const dbVal = await readFromDb();
  if (dbVal) {
    globalThis.__AISNV_MEM_BILLBOARD_SETTINGS__ = dbVal;
    flushToDisk(dbVal);
    return dbVal;
  }
  return mem;
}

export async function saveBillboardSettings(patch: Partial<BillboardSettings>): Promise<BillboardSettings> {
  const existing = await getBillboardSettings();
  const merged: BillboardSettings = {
    displayMode: patch.displayMode === 'rotate' ? 'rotate' : 'single',
    autoLoop: typeof patch.autoLoop === 'boolean' ? patch.autoLoop : existing.autoLoop,
    crossfadeMs:
      typeof patch.crossfadeMs === 'number' && Number.isFinite(patch.crossfadeMs)
        ? Math.max(0, Math.min(5000, patch.crossfadeMs))
        : existing.crossfadeMs,
    backgroundLighting:
      typeof patch.backgroundLighting === 'number' && Number.isFinite(patch.backgroundLighting)
        ? Math.max(0, Math.min(100, patch.backgroundLighting))
        : existing.backgroundLighting,
  };
  globalThis.__AISNV_MEM_BILLBOARD_SETTINGS__ = merged;
  flushToDisk(merged);
  await writeToDb(merged);
  return merged;
}
