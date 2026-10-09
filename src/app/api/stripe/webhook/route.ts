import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { CreditService } from '@/lib/services/credit-service';
import { AdminNotificationService } from '@/lib/services/admin-notification-service';
import { db } from '@/lib/db';
import { purchases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  if (!stripe) {
    console.error('Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, packageId, credits } = session.metadata!;

        // Update purchase status
        await db
          .update(purchases)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(purchases.transactionId, session.id));

        // Add credits to user account
        await CreditService.addCredits(
          userId,
          parseInt(credits),
          'purchase',
          `Credit purchase - ${credits} credits`,
          {
            sessionId: session.id,
            packageId,
            paymentIntent: session.payment_intent,
          }
        );

        // Add admin notification for new purchase
        const packageName = session.metadata?.packageName || 'Credit Package';
        const amount = session.amount_total || 0;
        AdminNotificationService.addNewPurchaseNotification(userId, 'Unknown', packageName, amount);

        // If Pro pack, reward referrer
        if (packageId === 'pro') {
          // best effort reward; no user email needed
          const { ReferralService } = await import('@/lib/services/referral-service');
          await ReferralService.rewardOnProPurchase(userId);
        }

        console.log(`Credits added to user ${userId}: ${credits}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        // Update purchase status to failed
        await db
          .update(purchases)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(purchases.transactionId, paymentIntent.id));

        console.log(`Payment failed for session: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
