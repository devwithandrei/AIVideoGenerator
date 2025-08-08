import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { CREDIT_PACKAGES } from '@/lib/stripe';
import { db } from '@/lib/db';
import { purchases } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

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

    // Optionally include referral context from cookie header if proxied; not available here directly
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: selectedPackage.description,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/dashboard/billing?canceled=true`,
      metadata: {
        userId,
        packageId,
        credits: selectedPackage.credits.toString(),
        packageName: selectedPackage.name,
      },
    });

    // Create pending purchase record
    await db.insert(purchases).values({
      userId,
      amount: selectedPackage.price,
      currency: 'USD',
      credits: selectedPackage.credits,
      status: 'pending',
      transactionId: session.id,
      metadata: JSON.stringify({
        packageId,
        packageName: selectedPackage.name,
      }),
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
