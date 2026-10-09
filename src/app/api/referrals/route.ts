import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ReferralService } from '@/lib/services/referral-service';

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await ReferralService.getStats(user.id);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const link = await ReferralService.getOrCreateReferralLink(user.id);
  return NextResponse.json({ link });
}
