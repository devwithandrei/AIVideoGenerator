import { db } from '@/lib/db';
import { referralLinks, referrals, referralEvents, users, credits } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CreditService } from './credit-service';

const REWARD_CREDITS_PER_PRO_PURCHASE = 50; // reward to referrer

export class ReferralService {
  static async getOrCreateReferralLink(referrerUserId: string) {
    if (!db) {
      // Fallback when DB not configured
      return {
        id: 'demo',
        referrerUserId,
        code: (randomUUID().split('-')[0] + Math.random().toString(36).slice(2, 8)).toLowerCase(),
        clicks: 0,
        signups: 0,
        proPurchases: 0,
        creditsEarned: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }

    try {
      const existing = await db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.referrerUserId, referrerUserId))
        .limit(1);

      if (existing.length > 0) return existing[0];

      const code = randomUUID().split('-')[0] + Math.random().toString(36).slice(2, 8);
      const created = await db
        .insert(referralLinks)
        .values({ referrerUserId, code })
        .returning();
      return created[0];
    } catch (error) {
      // DB error fallback
      return {
        id: 'demo',
        referrerUserId,
        code: (randomUUID().split('-')[0] + Math.random().toString(36).slice(2, 8)).toLowerCase(),
        clicks: 0,
        signups: 0,
        proPurchases: 0,
        creditsEarned: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
  }

  static async recordClick(code: string) {
    if (!db) return null;

    const link = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.code, code))
      .limit(1);

    if (link.length === 0) return null;

    await db
      .insert(referralEvents)
      .values({ referrerUserId: link[0].referrerUserId, linkCode: code, type: 'click' });

    await db
      .update(referralLinks)
      .set({ clicks: link[0].clicks + 1 })
      .where(eq(referralLinks.id, link[0].id));

    return link[0];
  }

  static async attachReferralOnSignup(referredUserId: string, code: string) {
    if (!db) return null;

    const link = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.code, code))
      .limit(1);

    if (link.length === 0) return null;

    await db.insert(referrals).values({
      referrerUserId: link[0].referrerUserId,
      referredUserId,
      linkCode: code,
      status: 'signed_up',
    });

    await db
      .insert(referralEvents)
      .values({ referrerUserId: link[0].referrerUserId, referredUserId, linkCode: code, type: 'signup' });

    await db
      .update(referralLinks)
      .set({ signups: link[0].signups + 1 })
      .where(eq(referralLinks.id, link[0].id));

    return link[0];
  }

  static async rewardOnProPurchase(referredUserId: string) {
    if (!db) return;
    // find referral
    const referral = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredUserId, referredUserId))
      .limit(1);

    if (referral.length === 0) return;

    const ref = referral[0];

    // Check if referrer is admin; admins don't get rewarded credits
    const referrerRows = await db
      .select()
      .from(users)
      .where(eq(users.id, ref.referrerUserId))
      .limit(1);
    const referrer = referrerRows[0];
    const isAdminReferrer = referrer?.role === 'admin';

    // reward credits to referrer
    if (!isAdminReferrer) {
      await CreditService.addCredits(
        ref.referrerUserId,
        REWARD_CREDITS_PER_PRO_PURCHASE,
        'bonus',
        `Referral reward for ${referredUserId} Pro purchase`,
        { referredUserId }
      );
    }

    // event + counters
    const link = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.code, ref.linkCode))
      .limit(1);

    if (link.length > 0) {
      await db
        .update(referralLinks)
        .set({
          proPurchases: link[0].proPurchases + 1,
          creditsEarned: link[0].creditsEarned + (isAdminReferrer ? 0 : REWARD_CREDITS_PER_PRO_PURCHASE),
        })
        .where(eq(referralLinks.id, link[0].id));
    }

    await db
      .insert(referralEvents)
      .values({ referrerUserId: ref.referrerUserId, referredUserId, linkCode: ref.linkCode, type: 'pro_purchase' });

    // update referral status
    await db
      .update(referrals)
      .set({ status: 'pro_purchased' })
      .where(eq(referrals.id, ref.id));
  }

  static async getStats(referrerUserId: string) {
    if (!db) {
      return { link: null, events: [] };
    }

    try {
      const link = await db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.referrerUserId, referrerUserId))
        .limit(1);

      const events = await db
        .select()
        .from(referralEvents)
        .where(eq(referralEvents.referrerUserId, referrerUserId))
        .orderBy(desc(referralEvents.createdAt));

      return { link: link[0] || null, events };
    } catch (error) {
      // DB error fallback
      return { link: null, events: [] };
    }
  }
}
