export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'new-user' | 'new-purchase' | 'system' | 'info';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export class AdminNotificationService {
  private static notifications: AdminNotification[] = [
    {
      id: 'admin-welcome',
      title: 'Admin Dashboard',
      message: 'Welcome to the admin panel. You have unlimited access to all features.',
      type: 'system',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'admin-users',
      title: 'User Management',
      message: 'You can view and manage all users, their credits, and usage statistics.',
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
    }
  ];

  static getNotifications(): AdminNotification[] {
    return this.notifications;
  }

  static getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  static markAsRead(notificationId: string): void {
    this.notifications = this.notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
  }

  static markAllAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
  }

  static deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  static deleteReadNotifications(): void {
    this.notifications = this.notifications.filter(n => !n.isRead);
  }

  static addNewUserNotification(userId: string, userEmail: string, userName: string): void {
    const notification: AdminNotification = {
      id: `new-user-${userId}`,
      title: 'New User Registered',
      message: `${userName} (${userEmail}) has joined the platform. They have been given 50 free credits.`,
      type: 'new-user',
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        userId,
        userEmail,
        userName,
      }
    };
    
    this.notifications.unshift(notification);
  }

  static addNewPurchaseNotification(userId: string, userEmail: string, packageName: string, amount: number): void {
    const notification: AdminNotification = {
      id: `new-purchase-${userId}-${Date.now()}`,
      title: 'New Credit Purchase',
      message: `${userEmail} purchased ${packageName} for $${(amount / 100).toFixed(2)}.`,
      type: 'new-purchase',
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        userId,
        userEmail,
        packageName,
        amount,
      }
    };
    
    this.notifications.unshift(notification);
  }

  static addSystemNotification(title: string, message: string): void {
    const notification: AdminNotification = {
      id: `system-${Date.now()}`,
      title,
      message,
      type: 'system',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    this.notifications.unshift(notification);
  }
}
