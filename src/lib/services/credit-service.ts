import { db } from '@/lib/db';
import { credits, creditTransactions, usageLogs, featurePricing, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export class CreditService {
  /**
   * Get user's credit balance
   */
  static async getUserCredits(userId: string) {
    if (!db) {
      console.warn('Database not available, returning default credits');
      return {
        id: 'default',
        userId,
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    try {
      const userCredits = await db
        .select()
        .from(credits)
        .where(eq(credits.userId, userId))
        .limit(1);

      if (userCredits.length === 0) {
        // Create new credit record for user
        const newCredits = await db
          .insert(credits)
          .values({
            userId,
            balance: 0,
            totalPurchased: 0,
            totalUsed: 0,
          })
          .returning();

        return newCredits[0];
      }

      return userCredits[0];
    } catch (error) {
      console.error('Error getting user credits:', error);
      return {
        id: 'default',
        userId,
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Check if user has enough credits for a feature
   */
  static async checkCredits(userId: string, feature: string, model: string): Promise<{
    hasCredits: boolean;
    requiredCredits: number;
    currentBalance: number;
    isAdmin: boolean;
  }> {
    if (!db) {
      console.warn('Database not available, allowing access');
      return {
        hasCredits: true,
        requiredCredits: 0,
        currentBalance: 0,
        isAdmin: false,
      };
    }

    try {
      // Check if user is admin
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const isAdmin = user.length > 0 && user[0].role === 'admin';

      if (isAdmin) {
        return {
          hasCredits: true,
          requiredCredits: 0,
          currentBalance: 0,
          isAdmin: true,
        };
      }

      // Get feature pricing
      const pricing = await db
        .select()
        .from(featurePricing)
        .where(
          and(
            eq(featurePricing.feature, feature),
            eq(featurePricing.model, model),
            eq(featurePricing.isActive, true)
          )
        )
        .limit(1);

      if (pricing.length === 0) {
        throw new Error(`No pricing found for feature: ${feature} with model: ${model}`);
      }

      const requiredCredits = pricing[0].creditsPerUse;

      // Get user's credit balance
      const userCredits = await this.getUserCredits(userId);

      return {
        hasCredits: userCredits.balance >= requiredCredits,
        requiredCredits,
        currentBalance: userCredits.balance,
        isAdmin: false,
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return {
        hasCredits: true,
        requiredCredits: 0,
        currentBalance: 0,
        isAdmin: false,
      };
    }
  }

  /**
   * Deduct credits for feature usage
   */
  static async deductCredits(
    userId: string,
    feature: string,
    model: string,
    prompt?: string,
    metadata?: any
  ): Promise<{
    success: boolean;
    creditsDeducted: number;
    newBalance: number;
  }> {
    // Check if user is admin
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isAdmin = user.length > 0 && user[0].role === 'admin';

    if (isAdmin) {
      // Log usage for admin (no credits deducted)
      await this.logUsage(userId, feature, model, 0, 'success', prompt, metadata);
      return {
        success: true,
        creditsDeducted: 0,
        newBalance: 0,
      };
    }

    // Get feature pricing
    const pricing = await db
      .select()
      .from(featurePricing)
      .where(
        and(
          eq(featurePricing.feature, feature),
          eq(featurePricing.model, model),
          eq(featurePricing.isActive, true)
        )
      )
      .limit(1);

    if (pricing.length === 0) {
      throw new Error(`No pricing found for feature: ${feature} with model: ${model}`);
    }

    const creditsToDeduct = pricing[0].creditsPerUse;

    // Get current credit balance
    const userCredits = await this.getUserCredits(userId);

    if (userCredits.balance < creditsToDeduct) {
      throw new Error(`Insufficient credits. Required: ${creditsToDeduct}, Available: ${userCredits.balance}`);
    }

    // Deduct credits
    const updatedCredits = await db
      .update(credits)
      .set({
        balance: userCredits.balance - creditsToDeduct,
        totalUsed: userCredits.totalUsed + creditsToDeduct,
        updatedAt: new Date(),
      })
      .where(eq(credits.userId, userId))
      .returning();

    // Log transaction
    await db.insert(creditTransactions).values({
      userId,
      type: 'usage',
      amount: -creditsToDeduct,
      description: `Used ${creditsToDeduct} credits for ${feature} with ${model}`,
      model,
      feature,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    // Log usage
    await this.logUsage(userId, feature, model, creditsToDeduct, 'success', prompt, metadata);

    return {
      success: true,
      creditsDeducted: creditsToDeduct,
      newBalance: updatedCredits[0].balance,
    };
  }

  /**
   * Add credits to user account
   */
  static async addCredits(
    userId: string,
    amount: number,
    type: 'purchase' | 'bonus' | 'refund',
    description: string,
    metadata?: any
  ): Promise<{
    success: boolean;
    creditsAdded: number;
    newBalance: number;
  }> {
    const userCredits = await this.getUserCredits(userId);

    const updatedCredits = await db
      .update(credits)
      .set({
        balance: userCredits.balance + amount,
        totalPurchased: type === 'purchase' ? userCredits.totalPurchased + amount : userCredits.totalPurchased,
        updatedAt: new Date(),
      })
      .where(eq(credits.userId, userId))
      .returning();

    // Log transaction
    await db.insert(creditTransactions).values({
      userId,
      type,
      amount,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return {
      success: true,
      creditsAdded: amount,
      newBalance: updatedCredits[0].balance,
    };
  }

  /**
   * Log usage for analytics
   */
  static async logUsage(
    userId: string,
    feature: string,
    model: string,
    creditsUsed: number,
    status: 'success' | 'failed' | 'cancelled',
    prompt?: string,
    metadata?: any,
    errorMessage?: string,
    processingTime?: number,
    inputSize?: number,
    outputSize?: number
  ) {
    await db.insert(usageLogs).values({
      userId,
      feature,
      model,
      creditsUsed,
      prompt,
      status,
      errorMessage,
      processingTime,
      inputSize,
      outputSize,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  }

  /**
   * Get user's transaction history
   */
  static async getTransactionHistory(userId: string, limit = 50) {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);
  }

  /**
   * Get user's usage history
   */
  static async getUsageHistory(userId: string, limit = 50) {
    return await db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId))
      .orderBy(desc(usageLogs.createdAt))
      .limit(limit);
  }

  /**
   * Initialize default feature pricing
   */
  static async initializeDefaultPricing() {
    const defaultPricing = [
      {
        feature: 'video-generation',
        model: 'hailuo',
        creditsPerUse: 8,
        description: 'Hailuo video generation',
      },
      {
        feature: 'video-generation',
        model: 'veo2',
        creditsPerUse: 15,
        description: 'Veo2 video generation',
      },
      {
        feature: 'map-animation',
        model: 'hailuo',
        creditsPerUse: 5,
        description: 'Hailuo map animation',
      },
      {
        feature: 'map-animation',
        model: 'veo2',
        creditsPerUse: 10,
        description: 'Veo2 map animation',
      },
      {
        feature: 'image-generation',
        model: 'default',
        creditsPerUse: 3,
        description: 'Image generation',
      },
    ];

    for (const pricing of defaultPricing) {
      const existing = await db
        .select()
        .from(featurePricing)
        .where(
          and(
            eq(featurePricing.feature, pricing.feature),
            eq(featurePricing.model, pricing.model)
          )
        );

      if (existing.length === 0) {
        await db.insert(featurePricing).values(pricing);
      }
    }
  }

  /**
   * Initialize default credit packages
   */
  static async initializeDefaultPackages() {
    const defaultPackages = [
      {
        name: 'Starter Pack',
        credits: 50,
        price: 0, // Free for new users
        description: 'Free starter pack for new users',
      },
      {
        name: 'Pro Pack',
        credits: 200,
        price: 2999, // $29.99
        description: 'Great for regular users',
      },
      {
        name: 'Enterprise Pack',
        credits: 1000,
        price: 9999, // $99.99
        description: 'For power users and businesses',
      },
    ];

    for (const pkg of defaultPackages) {
      const existing = await db
        .select()
        .from(creditPackages)
        .where(eq(creditPackages.name, pkg.name));

      if (existing.length === 0) {
        await db.insert(creditPackages).values(pkg);
      }
    }
  }
} 