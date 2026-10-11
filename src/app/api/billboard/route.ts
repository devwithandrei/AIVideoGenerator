import { NextResponse } from 'next/server';
import { getBillboardPublicData } from '@/lib/billboard-public';

export async function GET() {
  try {
    const data = await getBillboardPublicData();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.warn('[billboard/public] GET error:', e?.message || e);
    return NextResponse.json(
      {
        billboard: null,
        playlist: [],
        settings: { displayMode: 'single', autoLoop: true, crossfadeMs: 450, backgroundLighting: 55 },
        fallback: {
          headline: 'MiniMax H3 AI Video Generator',
          subheadline: 'AISNV delivers high-speed, cost-efficient image and video generation.',
        },
      },
      { status: 200 }
    );
  }
}
