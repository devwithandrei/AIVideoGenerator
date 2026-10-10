import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  heartbeat,
  markOffline,
  getOnlineUserIds,
  getOnlineCount,
  isOnline,
  getLastSeenMap,
} from '@/lib/presence';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    let offline = false;
    let bodyUserId: string | undefined;
    try {
      const body = await req.json().catch(() => ({}));
      offline = body?.offline === true;
      if (typeof body?.userId === 'string' && body.userId) bodyUserId = body.userId;
    } catch (_) {}

    let userId: string | undefined;
    try {
      const sessionAuth = await auth();
      userId = (sessionAuth as any)?.userId;
    } catch (_) {}
    if (!userId) userId = bodyUserId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (offline) {
      markOffline(userId);
    } else {
      heartbeat(userId);
    }
    return NextResponse.json({ ok: true, online: !offline, onlineCount: getOnlineCount() });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Heartbeat failed: ' + String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    let userId: string | undefined;
    try {
      const sessionAuth = await auth();
      userId = (sessionAuth as any)?.userId;
    } catch (_) {}
    if (!userId) {
      try {
        const body = await req.json().catch(() => ({}));
        if (typeof body?.userId === 'string' && body.userId) userId = body.userId;
      } catch (_) {}
    }
    if (userId) markOffline(userId);
    return NextResponse.json({ ok: true });
  } catch (_) {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      onlineUserIds: getOnlineUserIds(),
      onlineCount: getOnlineCount(),
      lastSeen: getLastSeenMap(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e), onlineUserIds: [], onlineCount: 0, lastSeen: {} },
      { status: 500 }
    );
  }
}
