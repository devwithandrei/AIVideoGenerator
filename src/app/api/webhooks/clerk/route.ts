import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { CreditService } from '@/lib/services/credit-service';
import { NotificationService } from '@/lib/services/notification-service';
import { AdminNotificationService } from '@/lib/services/admin-notification-service';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { FREE_CREDITS_FOR_NEW_USERS } from '@/lib/stripe';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      return new Response('No email found', { status: 400 });
    }

    try {
      // Create user in database
      await db.insert(users).values({
        id,
        email,
        firstName: first_name || null,
        lastName: last_name || null,
        imageUrl: image_url || null,
        role: 'user',
        isActive: true,
        banned: false,
        emailVerified: email_addresses?.[0]?.verification?.status === 'verified',
      });

      // Allocate free credits to new user
      await CreditService.addCredits(
        id,
        FREE_CREDITS_FOR_NEW_USERS,
        'bonus',
        `Welcome bonus - ${FREE_CREDITS_FOR_NEW_USERS} free credits for new user`,
        { source: 'user_registration' }
      );

      // Create welcome notification
      const userName = first_name || email?.split('@')[0] || 'User';
      await NotificationService.createWelcomeNotification(id, userName);

      // Attach referral if cookie/code was present at signup (best-effort client will call attach API)
      // No-op here; client /api/referrals/attach will handle.

      // Add admin notification for new user
      AdminNotificationService.addNewUserNotification(id, email, userName);

      console.log(`New user ${id} created with ${FREE_CREDITS_FOR_NEW_USERS} free credits and welcome notification`);
    } catch (error) {
      console.error('Error creating user or allocating credits:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  return new Response('Success', { status: 200 });
}
