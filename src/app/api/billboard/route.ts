import { NextResponse } from 'next/server';
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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Disk-backed memory fallback singleton for public billboard playlist
const stateDir = (): string | null => {
  try {
    // On Vercel, process.cwd() is read-only; use /tmp for writable fallback.
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

/**
 * Sync disk-stored billboard rows into the DB.
 * Used when data was created locally while the DB was unreachable, so that
 * other environments (Vercel) can read it from Postgres.
 */
async function syncDiskToDb(rows: MemRow[]): Promise<boolean> {
  if (!db || !rows.length) return false;
  try {
    for (const r of rows) {
      await db.execute(sql.raw(`
        INSERT INTO billboard_videos
          (id, title, headline, subheadline, cloudinary_public_id, video_url,
           thumbnail_url, poster_url, is_active, is_default, uploaded_by_admin_email,
           duration_seconds, width, height, display_order, lighting_override, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          headline = EXCLUDED.headline,
          subheadline = EXCLUDED.subheadline,
          cloudinary_public_id = EXCLUDED.cloudinary_public_id,
          video_url = EXCLUDED.video_url,
          thumbnail_url = EXCLUDED.thumbnail_url,
          poster_url = EXCLUDED.poster_url,
          is_active = EXCLUDED.is_active,
          is_default = EXCLUDED.is_default,
          uploaded_by_admin_email = EXCLUDED.uploaded_by_admin_email,
          duration_seconds = EXCLUDED.duration_seconds,
          width = EXCLUDED.width,
          height = EXCLUDED.height,
          display_order = EXCLUDED.display_order,
          lighting_override = EXCLUDED.lighting_override,
          updated_at = EXCLUDED.updated_at
      `), [
        r.id, r.title, r.headline, r.subheadline, r.cloudinaryPublicId, r.videoUrl,
        r.thumbnailUrl, r.posterUrl, r.isActive, r.isDefault, r.uploadedByAdminEmail,
        r.durationSeconds, r.width, r.height, r.displayOrder, r.lightingOverride,
        r.createdAt, r.updatedAt || r.createdAt,
      ]);
    }
    return true;
  } catch (e) {
    console.warn('[billboard/public] sync disk→db failed:', (e as Error)?.message?.slice(0, 200));
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

let DB_WARNED_PUB = false;

function memResponse(warning?: string) {
  const s: BillboardSettings = { ...DEFAULT_BILLBOARD_SETTINGS };
  return NextResponse.json(
    {
      billboard: memRowPublic(pickActiveMem()),
      playlist: pickPlaylistMem(s).map(memRowPublic),
      settings: s,
      fallback: fallbackHero,
      mode: 'memory',
      warning: warning?.slice(0, 140) || undefined,
    },
    { status: 200 }
  );
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
    return 'Neon HTTP transport error — billboard served from memory/disk store';
  }
  if (lower.startsWith('failed query') || lower.includes(' select ') || lower.includes('from ')) {
    if (lower.includes('relation') || lower.includes('does not exist')) return 'Database schema missing — billboard served from memory/disk store';
    if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('enotfound')) return 'Database unreachable — billboard served from memory/disk store';
    return 'DB query failed — billboard served from memory/disk store';
  }
  return msg.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
}

export async function GET() {
  if (!db) return memResponse();

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
    const msg = shortMsg(e).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!DB_WARNED_PUB) {
      DB_WARNED_PUB = true;
      console.warn('[billboard/public] DB degraded:', msg);
      // Log the full error structure once for debugging on Vercel
      const err = e as any;
      const cause = err?.cause;
      console.warn('[billboard/public] error.message:', err?.message?.slice(0, 500));
      console.warn('[billboard/public] error.cause:', cause?.message || cause || '(none)');
    }
    return memResponse(msg);
  }

  let playlist: any[] = [];
  try {
    // If DB has no billboards but disk/memory does (data created while DB was down),
    // sync disk → DB so other environments (Vercel) can read it.
    if (!active.length) {
      const diskRows = diskLoad();
      if (diskRows.length) {
        const ok = await syncDiskToDb(diskRows);
        if (ok) {
          // Re-query now that data is in DB
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
    if (!DB_WARNED_PUB) { DB_WARNED_PUB = true; console.warn('[billboard/public] DB degraded:', msg); }
    const memSettings: BillboardSettings = settings;
    return NextResponse.json(
      {
        billboard: memRowPublic(pickActiveMem()),
        playlist: pickPlaylistMem(memSettings).map(memRowPublic),
        settings: memSettings,
        fallback: fallbackHero,
        mode: 'memory',
        warning: msg,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      billboard: active.length ? active[0] : memRowPublic(pickActiveMem()),
      playlist: playlist.length ? playlist : pickPlaylistMem(settings).map(memRowPublic),
      settings,
      fallback: fallbackHero,
    },
    { status: 200 }
  );
}
