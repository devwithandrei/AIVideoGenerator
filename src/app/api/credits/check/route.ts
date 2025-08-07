import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CreditService } from '@/lib/services/credit-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { feature, model } = await request.json();
    
    if (!feature || !model) {
      return NextResponse.json(
        { error: 'Feature and model are required' },
        { status: 400 }
      );
    }

    const creditCheck = await CreditService.checkCredits(userId, feature, model);
    
    return NextResponse.json(creditCheck);
  } catch (error) {
    console.error('Error checking credits:', error);
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    );
  }
} 