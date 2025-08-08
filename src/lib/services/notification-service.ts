import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { FREE_CREDITS_FOR_NEW_USERS } from '@/lib/stripe';
import { sql } from 'drizzle-orm';

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'welcome' | 'credit' | 'system' | 'info',
    metadata?: any
  ) {
    return await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      isRead: false,
      metadata: metadata ? JSON.stringify(metadata) : null,
    }).returning();
  }

  /**
   * Create welcome notification for new users
   */
  static async createWelcomeNotification(userId: string, userName: string) {
    const welcomeMessage = `Welcome ${userName}! Thank you for joining MediaForge AI. You've been given ${FREE_CREDITS_FOR_NEW_USERS} free credits to get started. Explore our AI video generation, map animations, and image creation features. Happy creating!`;
    
    return await this.createNotification(
      userId,
      'Welcome to MediaForge AI! 🎉',
      welcomeMessage,
      'welcome',
      {
        credits: FREE_CREDITS_FOR_NEW_USERS,
        userName,
      }
    );
  }

  /**
   * Create credit-related notification
   */
  static async createCreditNotification(
    userId: string,
    title: string,
    message: string,
    metadata?: any
  ) {
    return await this.createNotification(userId, title, message, 'credit', metadata);
  }

  /**
   * Get user's notifications
   */
  static async getUserNotifications(userId: string, limit = 50) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(userId: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    return await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .returning();
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    return await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
  }

  /**
   * Delete all read notifications
   */
  static async deleteReadNotifications(userId: string) {
    return await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, true)
        )
      )
      .returning();
  }

  /**
   * Format notification date
   */
  static formatNotificationDate(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type: 'welcome' | 'credit' | 'system' | 'info') {
    switch (type) {
      case 'welcome':
        return '🎉';
      case 'credit':
        return '💰';
      case 'system':
        return '⚙️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }
}
