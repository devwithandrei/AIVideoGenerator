import { NextResponse } from 'next/server';
import { getFeatures } from '@/lib/feature-videos';

export const revalidate = 0;

export async function GET() {
  try {
    const features = await getFeatures();
    return NextResponse.json({ features }, { status: 200 });
  } catch (e: any) {
    console.warn('[feature-videos/public] error:', e?.message || e);
    return NextResponse.json({ features: [] }, { status: 200 });
  }
}
