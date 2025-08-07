import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { creditPackages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const packages = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.credits);

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit packages' },
      { status: 500 }
    );
  }
} 