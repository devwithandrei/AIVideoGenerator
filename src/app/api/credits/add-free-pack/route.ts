import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CreditService } from '@/lib/services/credit-service';
import { CREDIT_PACKAGES } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId } = await req.json();
    
    // Find the package
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Verify it's a free package
    if (!selectedPackage.isFree) {
      return NextResponse.json({ error: 'Package is not free' }, { status: 400 });
    }

    // Add credits to user account
    const result = await CreditService.addCredits(
      userId,
      selectedPackage.credits,
      'bonus',
      `Free ${selectedPackage.name} - ${selectedPackage.credits} credits`,
      { 
        packageId,
        packageName: selectedPackage.name,
        source: 'free_pack'
      }
    );

    return NextResponse.json({ 
      success: true, 
      creditsAdded: result.creditsAdded,
      newBalance: result.newBalance 
    });
  } catch (error) {
    console.error('Error adding free credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
