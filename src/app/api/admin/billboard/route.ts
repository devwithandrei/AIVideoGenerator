import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { billboardVideos, BillboardVideo } from '@/lib/db/schema';
import { ensureDbSchemaInitialized } from '@/lib/db/auto-init';
import { desc, eq, sql } from 'drizzle-orm';
import CloudinaryService from '@/lib/cloudinary';
import { evaluateAdminAccess } from '@/lib/admin';
import { getBillboardSettings, saveBillboardSettings, DEFAULT_BILLBOARD_SETTINGS } from '@/lib/billboard-settings';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const maxDuration = 180;

let DB_WARNED_ADM = false;
function dbWarnOnce(tag: string, e: unknown) {
  if (DB_WARNED_ADM) return;
  DB_WARNED_ADM = true;
  let msg = 'DB unavailable';
  const err = e as any;
  if (typeof err === 'string') msg = err;
  else if (err?.cause?.message) msg = String(err.cause.message);
  else if (err?.message) msg = String(err.message);
  const lower = msg.toLowerCase();
  if (lower.includes('payload') || lower.includes('http request body') || lower.includes('untagged enum')) {
    msg = 'Neon HTTP transport error — using memory store';
  } else if (lower.startsWith('failed query') || lower.includes(' select ') || lower.includes('from ')) {
    if (lower.includes('relation') || lower.includes('does not exist')) msg = 'Database schema missing (using memory store)';
    else if (lower.includes('fetch failed') || lower.includes('econnrefused')) msg = 'DB not reachable (using memory store)';
    else msg = 'DB query failed (using memory store)';
  }
  console.warn(`[${tag}] DB degraded (once):`, msg.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160));
}

async function safeEnsureSchema() {
  if (!db) return;
  try { await ensureDbSchemaInitialized(); } catch (e) { dbWarnOnce('admin/billboard/schema', e); }
}

/**
 * In-memory billboard fallback store.
 * Used when process.env.DATABASE_URL is not set (db === undefined / null).
 * Lives for the lifetime of the Next.js Node process. Billboards still upload to Cloudinary.
 */
type MemRow = Omit<BillboardVideo, 'createdAt' | 'updatedAt'> & { createdAt: string | Date; updatedAt?: string | Date };
const STORAGE_KEY = '__AISNV_MEM_BILLBOARDS__';
declare global { var __AISNV_MEM_BILLBOARDS__: MemRow[] | undefined; }
function stateDir() { try { const d = join(process.cwd(), '.aisnv-state'); if (!existsSync(d)) mkdirSync(d, { recursive: true }); return d; } catch { return null; } }
function statePath() { const d = stateDir(); return d ? join(d, 'billboard-mem.json') : null; }
function storageLoadFromDisk(): MemRow[] {
  try {
    const p = statePath();
    if (!p || !existsSync(p)) return [];
    const raw = readFileSync(p, 'utf8');
    if (!raw) return [];
    const anyArr = JSON.parse(raw) as any[];
    if (!Array.isArray(anyArr)) return [];
    return anyArr.map((r: any) => ({
      ...r,
      displayOrder: Number(r?.displayOrder) || 0,
      lightingOverride:
        r && (r.lightingOverride === null || r.lightingOverride === undefined || !Number.isFinite(Number(r.lightingOverride)))
          ? null
          : Math.max(0, Math.min(100, Number(r.lightingOverride))),
    })) as MemRow[];
  } catch (e) {
    console.warn('[billboard-mem] disk load failed:', e);
    return [];
  }
}
function storageFlushToDisk() {
  try {
    const p = statePath();
    if (!p) return;
    writeFileSync(p, JSON.stringify(storageUnsafe(), null, 2), 'utf8');
  } catch (e) {
    console.warn('[billboard-mem] disk flush failed:', e);
  }
}
let STORAGE_LOADED = false;
function storageUnsafe(): MemRow[] {
  return (globalThis as any)[STORAGE_KEY] as MemRow[];
}
function storage(): MemRow[] {
  if (!STORAGE_LOADED) {
    STORAGE_LOADED = true;
    if (typeof (globalThis as any)[STORAGE_KEY] === 'undefined' || !(globalThis as any)[STORAGE_KEY]) {
      const fromDisk = storageLoadFromDisk();
      (globalThis as any)[STORAGE_KEY] = fromDisk.length ? fromDisk : [];
    }
  }
  if (typeof (globalThis as any)[STORAGE_KEY] === 'undefined' || !(globalThis as any)[STORAGE_KEY]) (globalThis as any)[STORAGE_KEY] = [];
  return (globalThis as any)[STORAGE_KEY] as MemRow[];
}
function toRow(r: MemRow): BillboardVideo {
  return {
    ...r,
    createdAt: (r.createdAt instanceof Date) ? r.createdAt : new Date(r.createdAt || Date.now()),
    updatedAt: r.updatedAt ? ((r.updatedAt instanceof Date) ? r.updatedAt : new Date(r.updatedAt)) : (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt || Date.now())),
  } as BillboardVideo;
}
function memList(): MemRow[] {
  return [...storage()].sort(
    (a, b) =>
      (Number(b.displayOrder || 0) - Number(a.displayOrder || 0)) ||
      (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
}
function memFind(id: string) {
  return storage().find((r) => r.id === id);
}
function memUpsert(row: MemRow): MemRow {
  const m = storage();
  const i = m.findIndex((r) => r.id === row.id);
  if (i >= 0) m[i] = row;
  else m.unshift(row);
  storageFlushToDisk();
  return row;
}
function memDelete(id: string) {
  const m = storage();
  const i = m.findIndex((r) => r.id === id);
  if (i >= 0) m.splice(i, 1);
  storageFlushToDisk();
}
function memResetActiveDefault(flags: { active: boolean; def: boolean }) {
  const m = storage();
  for (const r of m) {
    if (flags.active) r.isActive = false;
    if (flags.def) r.isDefault = false;
    r.updatedAt = new Date().toISOString();
  }
  storageFlushToDisk();
}
function newId() {
  return 'mem-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

async function ensureAdmin(): Promise<{ ok: boolean; error?: NextResponse; adminEmail?: string }> {
  try {
    const sessionAuth = await auth();
    const userId = (sessionAuth as any).userId;
    if (!userId) {
      return { ok: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const user = await currentUser();
    const sessionClaimsEmail = (sessionAuth as any).sessionClaims?.email as string | undefined;
    const sessionClaimsRole = (sessionAuth as any).sessionClaims?.metadata?.role as string | undefined;
    const primaryEmail = user?.emailAddresses?.[0]?.emailAddress;

    const decision = evaluateAdminAccess({
      publicMetadataRole: user?.publicMetadata?.role,
      primaryEmail: primaryEmail || sessionClaimsEmail || undefined,
      sessionClaimsRole,
      sessionClaimsEmail,
    });
    if (!decision.ok) {
      return { ok: false, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true, adminEmail: decision.adminEmail };
  } catch (e: any) {
    return { ok: false, error: NextResponse.json({ error: 'Auth error: ' + String(e?.message || e) }, { status: 500 }) };
  }
}

function userError(e: unknown, fallback: string) {
  const err = e as { message?: unknown; cause?: unknown };
  let msg: string = '';
  if (typeof err === 'string') msg = err;
  else if (err && typeof err === 'object' && typeof err.message === 'string') msg = err.message;
  else if (err && typeof err === 'object' && (err as any).cause && typeof (err as any).cause === 'object') {
    const c = (err as any).cause as any;
    if (typeof c.message === 'string') msg = c.message;
    else if (typeof c.code === 'string') msg = c.code;
  }
  if (!msg) msg = String(e ?? '');
  if (!msg) return fallback;
  const lower = msg.toLowerCase();
  if (
    lower.includes('neon') ||
    lower.includes('fetch failed') ||
    lower.includes('econnrefused') ||
    lower.includes('database') ||
    lower.includes('relation') ||
    lower.includes('column') ||
    lower.includes('does not exist')
  ) {
    return fallback + ' (Database unavailable or missing migration — billboard uses in-memory store until schema is ready)';
  }
  return fallback + ': ' + msg.slice(0, 160);
}

export async function GET() {
  const admin = await ensureAdmin();
  if (!admin.ok) return admin.error!;
  await safeEnsureSchema();
  const settings = (await getBillboardSettings()) || { ...DEFAULT_BILLBOARD_SETTINGS };
  if (!db) {
    return NextResponse.json({ billboards: memList().map(toRow), settings, mode: 'memory' }, { status: 200 });
  }
  try {
    const rows = await db
      .select()
      .from(billboardVideos)
      .orderBy(desc(billboardVideos.displayOrder), desc(billboardVideos.createdAt));
    return NextResponse.json({ billboards: rows as BillboardVideo[], settings }, { status: 200 });
  } catch (e) {
    dbWarnOnce('admin/billboard/list', e);
    return NextResponse.json(
      { billboards: memList().map(toRow), settings, mode: 'memory', warning: userError(e, 'DB read failed') },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin.ok) return admin.error!;

  try {
    await safeEnsureSchema();
    const formData = await req.formData();
    const file = formData.get('video') as File | null;
    const title = (formData.get('title') as string)?.trim();
    const headline = (formData.get('headline') as string)?.trim() || null;
    const subheadline = (formData.get('subheadline') as string)?.trim() || null;
    const setActive = formData.get('setActive') === 'true' || formData.get('setActive') === '1';
    const setDefault = formData.get('setDefault') === 'true' || formData.get('setDefault') === '1';

    if (!file) return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 10);
    const publicId = `billboard-${timestamp}-${randomId}`;

    const upload = await CloudinaryService.uploadVideo(buffer, {
      folder: 'billboards',
      public_id: publicId,
      resource_type: 'video',
    });

    const thumbnail = upload.public_id
      ? `https://res.cloudinary.com/dfqrcm0il/video/upload/${upload.public_id}.jpg`
      : undefined;
    const poster = thumbnail;

    if (!db) {
      if (setActive || setDefault) memResetActiveDefault({ active: setActive, def: setDefault });
      const row: MemRow = {
        id: newId(),
        title,
        headline,
        subheadline,
        cloudinaryPublicId: upload.public_id,
        videoUrl: upload.secure_url,
        thumbnailUrl: thumbnail ?? null,
        posterUrl: poster ?? null,
        isActive: setActive,
        isDefault: setDefault,
        uploadedByAdminEmail: admin.adminEmail || null,
        durationSeconds: upload.duration ? Math.round(upload.duration) : null,
        width: null,
        height: null,
        displayOrder: 0,
        lightingOverride: null,
        createdAt: new Date().toISOString(),
      };
      memUpsert(row);
      return NextResponse.json({ success: true, billboard: toRow(row), upload, mode: 'memory' }, { status: 201 });
    }

    try {
      if (setActive || setDefault) {
        await db
          .update(billboardVideos)
          .set({
            ...(setActive ? { isActive: false } : {}),
            ...(setDefault ? { isDefault: false } : {}),
            updatedAt: sql`now()`,
          });
      }
    } catch (preErr) {
      console.warn('[admin/billboard/upload] pre-reset DB failed, continuing insert with in-memory fallback', preErr);
    }

    try {
      const inserted = await db
        .insert(billboardVideos)
        .values({
          title,
          headline,
          subheadline,
          cloudinaryPublicId: upload.public_id,
          videoUrl: upload.secure_url,
          thumbnailUrl: thumbnail,
          posterUrl: poster,
          isActive: setActive,
          isDefault: setDefault,
          uploadedByAdminEmail: admin.adminEmail || null,
          durationSeconds: upload.duration ? Math.round(upload.duration) : null,
          width: null,
          height: null,
          displayOrder: 0,
          lightingOverride: null,
        })
        .returning();

      return NextResponse.json(
        { success: true, billboard: inserted[0] as BillboardVideo, upload },
        { status: 201 }
      );
    } catch (insertErr: any) {
      console.warn('[admin/billboard/upload] DB insert failed; falling back to memory store', insertErr);
      if (setActive || setDefault) memResetActiveDefault({ active: setActive, def: setDefault });
      const row: MemRow = {
        id: 'fallback-' + newId(),
        title,
        headline,
        subheadline,
        cloudinaryPublicId: upload.public_id,
        videoUrl: upload.secure_url,
        thumbnailUrl: thumbnail ?? null,
        posterUrl: poster ?? null,
        isActive: setActive,
        isDefault: setDefault,
        uploadedByAdminEmail: admin.adminEmail || null,
        durationSeconds: upload.duration ? Math.round(upload.duration) : null,
        width: null,
        height: null,
        displayOrder: 0,
        lightingOverride: null,
        createdAt: new Date().toISOString(),
      };
      memUpsert(row);
      return NextResponse.json(
        { success: true, billboard: toRow(row), upload, mode: 'memory', warning: userError(insertErr, 'DB write failed — stored in memory instead') },
        { status: 201 }
      );
    }
  } catch (e: any) {
    dbWarnOnce('admin/billboard/upload', e);
    return NextResponse.json(
      { error: userError(e, 'Failed to upload billboard') },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin.ok) return admin.error!;
  try {
    await safeEnsureSchema();
    const body = await req.json();
    const { id, action } = body as { id?: string; action?: 'activate' | 'deactivate' | 'default' | 'update' | 'order' | 'settings' } & Record<string, any>;

    if (action === 'settings') {
      const patch = body.settings as Record<string, any> | undefined;
      const merged = await saveBillboardSettings({
        displayMode: patch?.displayMode === 'rotate' ? 'rotate' : (patch?.displayMode === 'single' ? 'single' : undefined),
        autoLoop: typeof patch?.autoLoop === 'boolean' ? patch.autoLoop : undefined,
        crossfadeMs: typeof patch?.crossfadeMs === 'number' ? patch.crossfadeMs : undefined,
      });
      return NextResponse.json({ success: true, settings: merged }, { status: 200 });
    }

    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

    if (action === 'activate') {
      const resetOthers = body.resetOthers !== false;
      if (db) {
        if (resetOthers) {
          try { await db.update(billboardVideos).set({ isActive: false, updatedAt: sql`now()` }); } catch (_) {}
        }
      } else if (resetOthers) {
        memResetActiveDefault({ active: true, def: false });
      }
      if (db) {
        try {
          const r = await db.update(billboardVideos).set({ isActive: true, updatedAt: sql`now()` }).where(eq(billboardVideos.id, id)).returning();
          if (r && r.length) return NextResponse.json({ success: true, billboard: r[0] as BillboardVideo }, { status: 200 });
        } catch (e) { console.warn('[admin/billboard/patch] DB activate failed, falling back', e); }
      }
      const row = memFind(id);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (resetOthers) {
        const current = globalThis.__AISNV_MEM_BILLBOARDS__ || [];
        for (const r of current) {
          if (r.id !== id) r.isActive = false;
        }
      }
      row.isActive = true;
      row.updatedAt = new Date().toISOString();
      memUpsert(row);
      return NextResponse.json({ success: true, billboard: toRow(row), mode: 'memory' }, { status: 200 });
    }
    if (action === 'deactivate') {
      if (db) {
        try {
          const r = await db.update(billboardVideos).set({ isActive: false, updatedAt: sql`now()` }).where(eq(billboardVideos.id, id)).returning();
          if (r && r.length) return NextResponse.json({ success: true, billboard: r[0] as BillboardVideo }, { status: 200 });
        } catch (e) { console.warn('[admin/billboard/patch] DB deactivate failed', e); }
      }
      const row = memFind(id);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      row.isActive = false;
      row.updatedAt = new Date().toISOString();
      memUpsert(row);
      return NextResponse.json({ success: true, billboard: toRow(row), mode: 'memory' }, { status: 200 });
    }
    if (action === 'default') {
      if (db) {
        try { await db.update(billboardVideos).set({ isDefault: false, updatedAt: sql`now()` }); } catch (_) {}
      }
      memResetActiveDefault({ active: false, def: true });
      if (db) {
        try {
          const r = await db.update(billboardVideos).set({ isDefault: true, isActive: true, updatedAt: sql`now()` }).where(eq(billboardVideos.id, id)).returning();
          if (r && r.length) return NextResponse.json({ success: true, billboard: r[0] as BillboardVideo }, { status: 200 });
        } catch (e) { console.warn('[admin/billboard/patch] DB default failed', e); }
      }
      const row = memFind(id);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      row.isDefault = true;
      row.isActive = true;
      row.updatedAt = new Date().toISOString();
      memUpsert(row);
      return NextResponse.json({ success: true, billboard: toRow(row), mode: 'memory' }, { status: 200 });
    }
    if (action === 'update') {
      const set: Partial<BillboardVideo> = { updatedAt: new Date() as any };
      if ('title' in body && typeof body.title === 'string') set.title = body.title;
      if ('headline' in body) set.headline = body.headline as any;
      if ('subheadline' in body) set.subheadline = body.subheadline as any;
      if ('displayOrder' in body) set.displayOrder = Number(body.displayOrder) || 0;
      if ('lightingOverride' in body) {
        const v = body.lightingOverride;
        set.lightingOverride = v === null || v === undefined ? null : Number.isFinite(Number(v)) ? Math.max(0, Math.min(100, Number(v))) : null;
      }
      if (db) {
        try {
          const r = await db.update(billboardVideos).set(set as any).where(eq(billboardVideos.id, id)).returning();
          if (r && r.length) return NextResponse.json({ success: true, billboard: r[0] as BillboardVideo }, { status: 200 });
        } catch (e) { console.warn('[admin/billboard/patch] DB update failed', e); }
      }
      const row = memFind(id);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if ('title' in body) row.title = set.title ?? row.title;
      if ('headline' in body) row.headline = (body.headline ?? row.headline) as any;
      if ('subheadline' in body) row.subheadline = (body.subheadline ?? row.subheadline) as any;
      if ('displayOrder' in body) row.displayOrder = Number(body.displayOrder) || 0;
      if ('lightingOverride' in body) {
        const v = body.lightingOverride;
        (row as any).lightingOverride = v === null || v === undefined ? null : Number.isFinite(Number(v)) ? Math.max(0, Math.min(100, Number(v))) : null;
      }
      row.updatedAt = new Date().toISOString();
      memUpsert(row);
      return NextResponse.json({ success: true, billboard: toRow(row), mode: 'memory' }, { status: 200 });
    }
    if (action === 'order') {
      const dispOrder = Number(body.displayOrder) || 0;
      if (db) {
        try {
          const r = await db.update(billboardVideos).set({ displayOrder: dispOrder, updatedAt: new Date() as any }).where(eq(billboardVideos.id, id)).returning();
          if (r && r.length) return NextResponse.json({ success: true, billboard: r[0] as BillboardVideo }, { status: 200 });
        } catch (e) { console.warn('[admin/billboard/patch] DB order failed', e); }
      }
      const row = memFind(id);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      row.displayOrder = dispOrder;
      row.updatedAt = new Date().toISOString();
      memUpsert(row);
      return NextResponse.json({ success: true, billboard: toRow(row), mode: 'memory' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    dbWarnOnce('admin/billboard/patch', e);
    return NextResponse.json({ error: userError(e, 'Failed to update billboard') }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin.ok) return admin.error!;
  try {
    await safeEnsureSchema();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    let cloudPubId: string | undefined;
    if (db) {
      try {
        const existing = await db.select().from(billboardVideos).where(eq(billboardVideos.id, id)).limit(1);
        if (existing && existing.length) cloudPubId = existing[0].cloudinaryPublicId ?? undefined;
      } catch (_) {}
    }
    if (!cloudPubId) {
      const memRow = memFind(id);
      if (memRow) cloudPubId = memRow.cloudinaryPublicId ?? undefined;
    }

    if (cloudPubId) {
      try { await CloudinaryService.deleteVideo(cloudPubId); }
      catch (cdel) { console.warn('[admin/billboard/delete] Cloudinary delete failed, proceeding', cdel); }
    }

    if (db) {
      try { await db.delete(billboardVideos).where(eq(billboardVideos.id, id)); }
      catch (e) { console.warn('[admin/billboard/delete] DB delete failed, deleting memory row only', e); }
    }
    memDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    dbWarnOnce('admin/billboard/delete', e);
    return NextResponse.json({ error: userError(e, 'Failed to delete billboard') }, { status: 500 });
  }
}
