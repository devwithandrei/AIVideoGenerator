import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { ensureDbSchemaInitialized } from '@/lib/db/auto-init';
import CloudinaryService from '@/lib/cloudinary';
import { evaluateAdminAccess } from '@/lib/admin';
import {
  getFeatures,
  addFeature,
  updateFeature,
  deleteFeature,
  reorderFeatures,
  DEFAULT_FEATURE_ICONS,
  FeatureItem,
} from '@/lib/feature-videos';

export const maxDuration = 180;

let DB_WARNED = false;
function dbWarnOnce(tag: string, e: unknown) {
  if (DB_WARNED) return;
  DB_WARNED = true;
  console.warn(`[${tag}] DB degraded (once):`, String((e as any)?.message || e).slice(0, 160));
}

async function safeEnsureSchema() {
  if (!db) return;
  try { await ensureDbSchemaInitialized(); } catch (e) { dbWarnOnce('admin/feature-videos/schema', e); }
}

async function ensureAdmin() {
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

export async function GET() {
  const admin = await ensureAdmin();
  if (!admin.ok) return admin.error!;
  await safeEnsureSchema();
  const features = await getFeatures();
  return NextResponse.json({ features, icons: DEFAULT_FEATURE_ICONS }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin.ok) return admin.error!;

  try {
    await safeEnsureSchema();
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const title = (formData.get('title') as string)?.trim();
      const description = (formData.get('description') as string)?.trim() || '';
      const icon = (formData.get('icon') as string)?.trim() || 'Sparkles';
      const file = formData.get('video') as File | null;

      if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

      let videoUrl: string | null = null;
      let cloudinaryPublicId: string | null = null;
      let posterUrl: string | null = null;
      let durationSeconds: number | null = null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).slice(2, 10);
        const publicId = `feature-${timestamp}-${randomId}`;
        const upload = await CloudinaryService.uploadVideo(buffer, {
          folder: 'features',
          public_id: publicId,
          resource_type: 'video',
        });
        videoUrl = upload.secure_url;
        cloudinaryPublicId = upload.public_id;
        posterUrl = upload.public_id
          ? `https://res.cloudinary.com/dfqrcm0il/video/upload/${upload.public_id}.jpg`
          : null;
        durationSeconds = upload.duration ? Math.round(upload.duration) : null;
      }

      const features = await addFeature({
        title,
        description,
        icon,
        videoUrl,
        cloudinaryPublicId,
        posterUrl,
        durationSeconds,
      });
      return NextResponse.json({ success: true, features }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, description, icon, orderedIds } = body as any;

    if (Array.isArray(orderedIds)) {
      const features = await reorderFeatures(orderedIds.map(String));
      return NextResponse.json({ success: true, features }, { status: 200 });
    }

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const features = await addFeature({
      title: String(title),
      description: description ? String(description) : '',
      icon: icon ? String(icon) : 'Sparkles',
    });
    return NextResponse.json({ success: true, features }, { status: 200 });
  } catch (e: any) {
    console.error('[admin/feature-videos/post] error:', e);
    return NextResponse.json(
      { error: 'Operation failed: ' + String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin.ok) return admin.error!;

  try {
    await safeEnsureSchema();
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const id = (formData.get('id') as string)?.trim();
      if (!id) return NextResponse.json({ error: 'Feature id is required' }, { status: 400 });

      const current = (await getFeatures()).find((f) => f.id === id);
      if (!current) return NextResponse.json({ error: 'Feature not found' }, { status: 404 });

      const patch: Partial<FeatureItem> = {};
      const title = formData.get('title');
      const description = formData.get('description');
      const icon = formData.get('icon');
      if (typeof title === 'string' && title.trim()) patch.title = title.trim();
      if (typeof description === 'string') patch.description = description;
      if (typeof icon === 'string' && DEFAULT_FEATURE_ICONS.includes(icon)) patch.icon = icon;

      const file = formData.get('video') as File | null;
      if (file) {
        if (current.cloudinaryPublicId) {
          try { await CloudinaryService.deleteVideo(current.cloudinaryPublicId); } catch (_) {}
        }
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).slice(2, 10);
        const publicId = `feature-${timestamp}-${randomId}`;
        const upload = await CloudinaryService.uploadVideo(buffer, {
          folder: 'features',
          public_id: publicId,
          resource_type: 'video',
        });
        patch.videoUrl = upload.secure_url;
        patch.cloudinaryPublicId = upload.public_id;
        patch.posterUrl = upload.public_id
          ? `https://res.cloudinary.com/dfqrcm0il/video/upload/${upload.public_id}.jpg`
          : null;
        patch.durationSeconds = upload.duration ? Math.round(upload.duration) : null;
      }

      const removeVideo = formData.get('removeVideo') === 'true';
      if (removeVideo) {
        if (current.cloudinaryPublicId) {
          try { await CloudinaryService.deleteVideo(current.cloudinaryPublicId); } catch (_) {}
        }
        patch.videoUrl = null;
        patch.cloudinaryPublicId = null;
        patch.posterUrl = null;
        patch.durationSeconds = null;
      }

      const features = await updateFeature(id, patch);
      return NextResponse.json({ success: true, features }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, title, description, icon, displayOrder } = body as any;
    if (!id) return NextResponse.json({ error: 'Feature id is required' }, { status: 400 });

    const patch: Partial<FeatureItem> = {};
    if (typeof title === 'string' && title.trim()) patch.title = title.trim();
    if (typeof description === 'string') patch.description = description;
    if (typeof icon === 'string' && DEFAULT_FEATURE_ICONS.includes(icon)) patch.icon = icon;
    if (Number.isFinite(Number(displayOrder))) patch.displayOrder = Number(displayOrder);

    const features = await updateFeature(String(id), patch);
    return NextResponse.json({ success: true, features }, { status: 200 });
  } catch (e: any) {
    console.error('[admin/feature-videos/patch] error:', e);
    return NextResponse.json(
      { error: 'Update failed: ' + String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin.ok) return admin.error!;

  try {
    await safeEnsureSchema();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Feature id is required' }, { status: 400 });

    const current = (await getFeatures()).find((f) => f.id === id);
    if (current?.cloudinaryPublicId) {
      try { await CloudinaryService.deleteVideo(current.cloudinaryPublicId); } catch (e) {
        console.warn('[admin/feature-videos/delete] cloudinary delete failed (continuing):', e);
      }
    }

    const features = await deleteFeature(id);
    return NextResponse.json({ success: true, features }, { status: 200 });
  } catch (e: any) {
    console.error('[admin/feature-videos/delete] error:', e);
    return NextResponse.json(
      { error: 'Delete failed: ' + String(e?.message || e) },
      { status: 500 }
    );
  }
}
