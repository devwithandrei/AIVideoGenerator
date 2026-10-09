import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ReferralService } from '@/lib/services/referral-service';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json().catch(() => ({ code: null }));
  const cookieCode = req.cookies.get('ref')?.value || null;
  const finalCode = code || cookieCode;

  if (!finalCode) return NextResponse.json({ ok: true, attached: false });

  await ReferralService.attachReferralOnSignup(user.id, finalCode);
  return NextResponse.json({ ok: true, attached: true });
}
