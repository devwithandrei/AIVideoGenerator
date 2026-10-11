import { billboardVideos } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { ensureDbSchemaInitialized } from '@/lib/db/auto-init';
import {
  getBillboardSettings,
  BillboardSettings,
  BillboardDisplayMode,
  DEFAULT_BILLBOARD_SETTINGS,
} from '@/lib/billboard-settings';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Disk-backed memory fallback singleton for public billboard playlist
const stateDir = (): string | null => {
  try {
    const base = process.env.VERCEL ? '/tmp' : process.cwd();
    const d = join(base, '.aisnv-state');
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
    return d;
  } catch (_) { return null; }
};
const diskPath = (): string | null => { const d = stateDir(); return d ? join(d, 'billboard-mem.json') : null; };

type MemRow = {
  id: string; title: string; headline: string | null; subheadline: string | null;
  cloudinaryPublicId: string; videoUrl: string; thumbnailUrl: string | null; posterUrl: string | null;
  isActive: boolean; isDefault: boolean; uploadedByAdminEmail: string | null;
  durationSeconds: number | null; width: number | null; height: number | null;
  displayOrder: number; lightingOverride: number | null;
  createdAt: string; updatedAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __AISNV_MEM_BILLBOARDS_PUB__: MemRow[] | undefined;
}

function diskLoad(): MemRow[] {
  const arr = globalThis.__AISNV_MEM_BILLBOARDS_PUB__;
  if (Array.isArray(arr) && arr.length) return arr as MemRow[];
  const p = diskPath();
  if (p && existsSync(p)) {
    try {
      const parsed = JSON.parse(readFileSync(p, 'utf-8')) as any[];
      if (Array.isArray(parsed)) {
        const norm: MemRow[] = parsed.map((r: any) => ({
          ...r,
          displayOrder: Number(r?.displayOrder) || 0,
          lightingOverride:
            r && (r.lightingOverride === null || r.lightingOverride === undefined || !Number.isFinite(Number(r.lightingOverride)))
              ? null
              : Math.max(0, Math.min(100, Number(r.lightingOverride))),
        }));
        globalThis.__AISNV_MEM_BILLBOARDS_PUB__ = norm as any;
        return norm;
      }
    } catch (_) {}
  }
  globalThis.__AISNV_MEM_BILLBOARDS_PUB__ = [];
  return [];
}

function comparePlaylist(a: MemRow, b: MemRow): number {
  if (a.displayOrder !== b.displayOrder) return (b.displayOrder || 0) - (a.displayOrder || 0);
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function pickActiveMem(): MemRow | null {
  const rows = diskLoad();
  const activeDefault = rows.filter(r => r.isActive && r.isDefault).sort(comparePlaylist);
  if (activeDefault.length) return activeDefault[0];
  const active = rows.filter(r => r.isActive).sort(comparePlaylist);
  if (active.length) return active[0];
  return rows.sort(comparePlaylist)[0] || null;
}

function pickPlaylistMem(settings: BillboardSettings): MemRow[] {
  const rows = diskLoad();
  if (settings.displayMode === 'rotate') {
    return rows.filter(r => r.isActive).sort(comparePlaylist);
  }
  const one = pickActiveMem();
  return one ? [one] : [];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toUuid(id: string): string {
  return UUID_RE.test(String(id)) ? String(id) : crypto.randomUUID();
}

async function syncDiskToDb(rows: MemRow[]): Promise<boolean> {
  if (!db || !rows.length) return false;
  try {
    for (const r of rows) {
      const id = toUuid(r.id);
      await db.insert(billboardVideos).values({
        id,
        title: r.title,
        headline: r.headline,
        subheadline: r.subheadline,
        cloudinaryPublicId: r.cloudinaryPublicId,
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl,
        posterUrl: r.posterUrl,
        isActive: r.isActive,
        isDefault: r.isDefault,
        uploadedByAdminEmail: r.uploadedByAdminEmail,
        durationSeconds: r.durationSeconds,
        width: r.width,
        height: r.height,
        displayOrder: r.displayOrder ?? 0,
        lightingOverride: r.lightingOverride,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: billboardVideos.cloudinaryPublicId,
        set: {
          title: r.title,
          headline: r.headline,
          subheadline: r.subheadline,
          videoUrl: r.videoUrl,
          thumbnailUrl: r.thumbnailUrl,
          posterUrl: r.posterUrl,
          isActive: r.isActive,
          isDefault: r.isDefault,
          uploadedByAdminEmail: r.uploadedByAdminEmail,
          durationSeconds: r.durationSeconds,
          width: r.width,
          height: r.height,
          displayOrder: r.displayOrder ?? 0,
          lightingOverride: r.lightingOverride,
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        },
      });
    }
    return true;
  } catch (e) {
    const err = e as any;
    const cause = err?.cause?.message || err?.message || String(e);
    console.warn('[billboard/public] sync disk→db failed:', cause?.slice(0, 400));
    return false;
  }
}

const fallbackHero = {
  headline: 'MiniMax H3 AI Video Generator',
  subheadline:
    'AISNV delivers high-speed, cost-efficient image and video generation with realistic visuals and synchronized audio — powered by MiniMax H3. Try it for free.',
  videoUrl: undefined as string | undefined,
  posterUrl: undefined as string | undefined,
};

function memRowPublic(r: MemRow | null | undefined) {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    headline: r.headline,
    subheadline: r.subheadline,
    cloudinaryPublicId: r.cloudinaryPublicId,
    videoUrl: r.videoUrl,
    thumbnailUrl: r.thumbnailUrl,
    posterUrl: r.posterUrl,
    isActive: !!r.isActive,
    isDefault: !!r.isDefault,
    displayOrder: r.displayOrder ?? 0,
    durationSeconds: r.durationSeconds,
    lightingOverride: r.lightingOverride ?? null,
    createdAt: r.createdAt,
  };
}

function shortMsg(error: unknown): string {
  let msg = 'DB unavailable';
  const e = error as { message?: unknown; cause?: unknown } | null | undefined;
  if (typeof e === 'string') msg = e;
  else if (e && typeof e === 'object') {
    const c = (e.cause as any)?.message;
    if (typeof c === 'string' && c.trim()) msg = c;
    else if (typeof e.message === 'string') msg = e.message;
  }
  const lower = msg.toLowerCase();
  if (lower.includes('payload') || lower.includes('http request body') || lower.includes('untagged enum')) {
    return 'Neon HTTP transport error';
  }
  if (lower.startsWith('failed query') || lower.includes(' select ') || lower.includes('from ')) {
    if (lower.includes('relation') || lower.includes('does not exist')) return 'Database schema missing';
    if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('enotfound')) return 'Database unreachable';
    return 'DB query failed';
  }
  return msg.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
}

export type PublicBillboardVideo = NonNullable<ReturnType<typeof memRowPublic>>;

export type BillboardPublicData = {
  billboard: PublicBillboardVideo | null;
  playlist: PublicBillboardVideo[];
  settings: BillboardSettings;
  fallback: typeof fallbackHero;
  mode?: 'memory';
  warning?: string;
};

export async function getBillboardPublicData(): Promise<BillboardPublicData> {
  if (!db) {
    const s: BillboardSettings = { ...DEFAULT_BILLBOARD_SETTINGS };
    return {
      billboard: memRowPublic(pickActiveMem()),
      playlist: pickPlaylistMem(s).map(memRowPublic).filter((r): r is NonNullable<typeof r> => r !== null),
      settings: s,
      fallback: fallbackHero,
      mode: 'memory',
    };
  }

  try { await ensureDbSchemaInitialized(); } catch (_) {}

  const settings = (await getBillboardSettings()) || { ...DEFAULT_BILLBOARD_SETTINGS };

  let active: any[] = [];
  try {
    active = await db
      .select()
      .from(billboardVideos)
      .where(and(eq(billboardVideos.isActive, true), eq(billboardVideos.isDefault, true)))
      .orderBy(desc(billboardVideos.displayOrder), desc(billboardVideos.createdAt))
      .limit(1);

    if (!active.length) {
      active = await db
        .select()
        .from(billboardVideos)
        .where(eq(billboardVideos.isActive, true))
        .orderBy(desc(billboardVideos.displayOrder), desc(billboardVideos.createdAt))
        .limit(1);
    }
  } catch (e) {
    const msg = shortMsg(e);
    console.warn('[billboard/public] DB degraded:', msg);
    return {
      billboard: memRowPublic(pickActiveMem()),
      playlist: pickPlaylistMem(settings).map(memRowPublic).filter((r): r is NonNullable<typeof r> => r !== null),
      settings,
      fallback: fallbackHero,
      mode: 'memory',
      warning: msg,
    };
  }

  let playlist: any[] = [];
  try {
    if (!active.length) {
      const diskRows = diskLoad();
      if (diskRows.length) {
        const ok = await syncDiskToDb(diskRows);
        if (ok) {
          active = await db
            .select()
            .from(billboardVideos)
            .where(and(eq(billboardVideos.isActive, true), eq(billboardVideos.isDefault, true)))
            .orderBy(desc(billboardVideos.displayOrder), desc(billboardVideos.createdAt))
            .limit(1);
          if (!active.length) {
            active = await db
              .select()
              .from(billboardVideos)
              .where(eq(billboardVideos.isActive, true))
              .orderBy(desc(billboardVideos.displayOrder), desc(billboardVideos.createdAt))
              .limit(1);
          }
        }
      }
    }

    if ((settings.displayMode as BillboardDisplayMode) === 'rotate') {
      playlist = await db
        .select()
        .from(billboardVideos)
        .where(eq(billboardVideos.isActive, true))
        .orderBy(desc(billboardVideos.displayOrder), desc(billboardVideos.createdAt));
    } else {
      playlist = active.length ? [active[0]] : [];
    }
  } catch (e) {
    const msg = shortMsg(e);
    console.warn('[billboard/public] DB degraded:', msg);
    return {
      billboard: memRowPublic(pickActiveMem()),
      playlist: pickPlaylistMem(settings).map(memRowPublic).filter((r): r is NonNullable<typeof r> => r !== null),
      settings,
      fallback: fallbackHero,
      mode: 'memory',
      warning: msg,
    };
  }

  return {
    billboard: active.length ? active[0] : memRowPublic(pickActiveMem()),
    playlist: playlist.length ? playlist : pickPlaylistMem(settings).map(memRowPublic).filter((r): r is NonNullable<typeof r> => r !== null),
    settings,
    fallback: fallbackHero,
  };
}
