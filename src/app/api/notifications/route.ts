import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NotificationService } from '@/lib/services/notification-service';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await NotificationService.getUserNotifications(userId);
    const unreadCount = await NotificationService.getUnreadCount(userId);

    return NextResponse.json({ 
      notifications,
      unreadCount 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, notificationId } = await req.json();

    switch (action) {
      case 'markAsRead':
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }
        await NotificationService.markAsRead(notificationId, userId);
        break;
      
      case 'markAllAsRead':
        await NotificationService.markAllAsRead(userId);
        break;
      
      case 'delete':
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }
        await NotificationService.deleteNotification(notificationId, userId);
        break;
      
      case 'deleteRead':
        await NotificationService.deleteReadNotifications(userId);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
