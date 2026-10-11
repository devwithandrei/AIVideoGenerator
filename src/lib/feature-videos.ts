import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { ensureDbSchemaInitialized } from './db/auto-init';

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  videoUrl: string | null;
  cloudinaryPublicId: string | null;
  posterUrl: string | null;
  durationSeconds: number | null;
  displayOrder: number;
  updatedAt: string;
}

export const DEFAULT_FEATURE_ICONS = [
  'Clapperboard',
  'ImageIcon',
  'Map',
  'Sparkles',
  'Wand2',
  'Film',
  'Camera',
  'Video',
  'Music',
  'Mic',
  'Palette',
  'Zap',
  'Rocket',
  'Star',
  'Heart',
  'Cpu',
  'Brain',
  'Globe',
  'Layers',
  'Shapes',
];

const SETTINGS_KEY = 'feature.videos';

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    id: 'default-ai-video-generation',
    title: 'AI Video Generation',
    description: 'Bring your ideas to life. Generate high-quality videos from simple text prompts in minutes.',
    icon: 'Clapperboard',
    videoUrl: null,
    cloudinaryPublicId: null,
    posterUrl: null,
    durationSeconds: null,
    displayOrder: 0,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: 'default-ai-image-suite',
    title: 'AI Image Suite',
    description: 'Create stunning visuals from text or enhance your existing images with our powerful AI editing tools.',
    icon: 'ImageIcon',
    videoUrl: null,
    cloudinaryPublicId: null,
    posterUrl: null,
    durationSeconds: null,
    displayOrder: 1,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: 'default-map-animations',
    title: 'Map Animations',
    description: 'Generate beautiful, animated map routes for your travel vlogs and presentations automatically.',
    icon: 'Map',
    videoUrl: null,
    cloudinaryPublicId: null,
    posterUrl: null,
    durationSeconds: null,
    displayOrder: 2,
    updatedAt: new Date(0).toISOString(),
  },
];

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
  return d ? join(d, 'feature-videos.json') : null;
};

declare global {
  // eslint-disable-next-line no-var
  var __AISNV_MEM_FEATURES__: FeatureItem[] | undefined;
}

function genId(): string {
  return `feat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeFeature(raw: any, idx: number): FeatureItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null;
  if (!title) return null;
  const icon = typeof raw.icon === 'string' && DEFAULT_FEATURE_ICONS.includes(raw.icon) ? raw.icon : 'Sparkles';
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : genId(),
    title,
    description: typeof raw.description === 'string' ? raw.description : '',
    icon,
    videoUrl: typeof raw.videoUrl === 'string' ? raw.videoUrl : null,
    cloudinaryPublicId: typeof raw.cloudinaryPublicId === 'string' ? raw.cloudinaryPublicId : null,
    posterUrl: typeof raw.posterUrl === 'string' ? raw.posterUrl : null,
    durationSeconds: Number.isFinite(Number(raw.durationSeconds)) ? Number(raw.durationSeconds) : null,
    displayOrder: Number.isFinite(Number(raw.displayOrder)) ? Number(raw.displayOrder) : idx,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

const LEGACY_SLOT_DEFAULTS: Record<string, { title: string; description: string; icon: string }> = {
  video: {
    title: 'AI Video Generation',
    description: 'Bring your ideas to life. Generate high-quality videos from simple text prompts in minutes.',
    icon: 'Clapperboard',
  },
  image: {
    title: 'AI Image Suite',
    description: 'Create stunning visuals from text or enhance your existing images with our powerful AI editing tools.',
    icon: 'ImageIcon',
  },
  map: {
    title: 'Map Animations',
    description: 'Generate beautiful, animated map routes for your travel vlogs and presentations automatically.',
    icon: 'Map',
  },
};

function migrateLegacy(parsed: any): FeatureItem[] {
  if (Array.isArray(parsed)) {
    const items: FeatureItem[] = [];
    parsed.forEach((r: any, i: number) => {
      const f = normalizeFeature(r, i);
      if (f) items.push(f);
    });
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const items: FeatureItem[] = [];
    (['video', 'image', 'map'] as const).forEach((slot, i) => {
      const slotData = parsed[slot];
      if (!slotData || typeof slotData !== 'object') return;
      if (!slotData.videoUrl) return;
      const def = LEGACY_SLOT_DEFAULTS[slot];
      const f = normalizeFeature(
        {
          id: `legacy-${slot}`,
          title: def.title,
          description: def.description,
          icon: def.icon,
          videoUrl: slotData.videoUrl,
          cloudinaryPublicId: slotData.cloudinaryPublicId,
          posterUrl: slotData.posterUrl,
          durationSeconds: slotData.durationSeconds,
          displayOrder: i,
          updatedAt: slotData.updatedAt,
        },
        i
      );
      if (f) items.push(f);
    });
    return items;
  }
  return [];
}

function sortItems(items: FeatureItem[]): FeatureItem[] {
  return [...items].sort(
    (a, b) => a.displayOrder - b.displayOrder || new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
}

function loadFromDisk(): FeatureItem[] | null {
  const p = settingsPath();
  if (!p) return null;
  try {
    if (!existsSync(p)) return null;
    const raw = readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw);
    return migrateLegacy(parsed);
  } catch (_) {
    return null;
  }
}

function flushToDisk(items: FeatureItem[]) {
  const p = settingsPath();
  if (!p) return;
  try { writeFileSync(p, JSON.stringify(sortItems(items), null, 2), 'utf-8'); } catch (_) {}
}

async function readFromDb(): Promise<FeatureItem[] | null> {
  if (!db) return null;
  try {
    await ensureDbSchemaInitialized();
    const rows = await (db.execute as any)(
      sql.raw(`SELECT key, value FROM app_settings WHERE key = '${SETTINGS_KEY}' LIMIT 1`)
    );
    const arr = Array.isArray(rows) ? rows : (rows as any)?.rows || [];
    if (!arr.length) return null;
    const parsed = JSON.parse(arr[0].value);
    return migrateLegacy(parsed);
  } catch (_) {
    return null;
  }
}

async function writeToDb(items: FeatureItem[]): Promise<boolean> {
  if (!db) return false;
  try {
    await ensureDbSchemaInitialized();
    const encoded = JSON.stringify(sortItems(items)).replace(/'/g, "''");
    await db.execute(sql.raw(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ('${SETTINGS_KEY}', '${encoded}', NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
    ));
    return true;
  } catch (_) {
    return false;
  }
}

function currentMem(): FeatureItem[] {
  if (!globalThis.__AISNV_MEM_FEATURES__) {
    const fromDisk = loadFromDisk();
    globalThis.__AISNV_MEM_FEATURES__ = fromDisk ? sortItems(fromDisk) : [];
  }
  return sortItems(globalThis.__AISNV_MEM_FEATURES__);
}

export async function getFeatures(): Promise<FeatureItem[]> {
  const mem = currentMem();
  const dbVal = await readFromDb();
  if (dbVal) {
    globalThis.__AISNV_MEM_FEATURES__ = sortItems(dbVal);
    flushToDisk(dbVal);
    return sortItems(dbVal);
  }
  // If DB is down and memory/disk are also empty, ship sensible defaults
  // so the homepage never renders a blank "Key Features" section.
  if (mem.length === 0) return DEFAULT_FEATURES;
  return mem;
}

async function persist(next: FeatureItem[]): Promise<FeatureItem[]> {
  globalThis.__AISNV_MEM_FEATURES__ = sortItems(next);
  flushToDisk(next);
  await writeToDb(next);
  return sortItems(next);
}

export async function addFeature(input: {
  title: string;
  description?: string;
  icon?: string;
  videoUrl?: string | null;
  cloudinaryPublicId?: string | null;
  posterUrl?: string | null;
  durationSeconds?: number | null;
}): Promise<FeatureItem[]> {
  const existing = await getFeatures();
  const maxOrder = existing.reduce((m, f) => Math.max(m, f.displayOrder), -1);
  const item: FeatureItem = {
    id: genId(),
    title: input.title.trim(),
    description: input.description?.trim() || '',
    icon: input.icon && DEFAULT_FEATURE_ICONS.includes(input.icon) ? input.icon : 'Sparkles',
    videoUrl: input.videoUrl || null,
    cloudinaryPublicId: input.cloudinaryPublicId || null,
    posterUrl: input.posterUrl || null,
    durationSeconds: input.durationSeconds ?? null,
    displayOrder: maxOrder + 1,
    updatedAt: new Date().toISOString(),
  };
  return persist([...existing, item]);
}

export async function updateFeature(
  id: string,
  patch: Partial<Omit<FeatureItem, 'id' | 'updatedAt'>>
): Promise<FeatureItem[]> {
  const existing = await getFeatures();
  const next = existing.map((f) => {
    if (f.id !== id) return f;
    const updated: FeatureItem = { ...f, ...patch, id: f.id, updatedAt: new Date().toISOString() };
    if (patch.icon && !DEFAULT_FEATURE_ICONS.includes(patch.icon)) updated.icon = f.icon;
    return updated;
  });
  return persist(next);
}

export async function deleteFeature(id: string): Promise<FeatureItem[]> {
  const existing = await getFeatures();
  const next = existing.filter((f) => f.id !== id);
  return persist(next);
}

export async function reorderFeatures(orderedIds: string[]): Promise<FeatureItem[]> {
  const existing = await getFeatures();
  const map = new Map(existing.map((f) => [f.id, f]));
  const next: FeatureItem[] = orderedIds
    .map((id, i) => {
      const f = map.get(id);
      if (!f) return null;
      return { ...f, displayOrder: i, updatedAt: f.updatedAt };
    })
    .filter((f): f is FeatureItem => f !== null);
  for (const f of existing) {
    if (!orderedIds.includes(f.id)) next.push(f);
  }
  return persist(next);
}
