"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAdminEmailsForClient } from '@/lib/admin';
import { AdminNotificationService } from '@/lib/services/admin-notification-service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Check, 
  Trash2, 
  X, 
  MessageSquare,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'welcome' | 'credit' | 'system' | 'info';
  isRead: boolean;
  createdAt: string;
  metadata?: string;
}

export function NotificationBell() {
  const { user, isLoaded } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user ? getAdminEmailsForClient().includes(user.emailAddresses[0]?.emailAddress || '') : false;

  const fetchNotifications = async () => {
    if (!user || !isLoaded) return;
    
    // If user is admin, show admin notifications without API call
    if (isAdmin) {
      const adminNotifications = AdminNotificationService.getNotifications();
      setNotifications(adminNotifications);
      setUnreadCount(AdminNotificationService.getUnreadCount());
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else if (response.status === 401) {
        // User is not authenticated, don't show error
        return;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds (only for non-admin users)
      if (!isAdmin) {
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [user, isLoaded, isAdmin]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (isAdmin) {
      // For admin users, mark as read in the service
      AdminNotificationService.markAsRead(notificationId);
      setNotifications(AdminNotificationService.getNotifications());
      setUnreadCount(AdminNotificationService.getUnreadCount());
      return;
    }
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationId }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isAdmin) {
      // For admin users, mark all as read in the service
      AdminNotificationService.markAllAsRead();
      setNotifications(AdminNotificationService.getNotifications());
      setUnreadCount(AdminNotificationService.getUnreadCount());
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read.",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast({
          title: "All notifications marked as read",
          description: "All notifications have been marked as read.",
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (isAdmin) {
      // For admin users, delete from the service
      AdminNotificationService.deleteNotification(notificationId);
      setNotifications(AdminNotificationService.getNotifications());
      setUnreadCount(AdminNotificationService.getUnreadCount());
      return;
    }
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', notificationId }),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteRead = async () => {
    if (isAdmin) {
      // For admin users, delete read notifications from the service
      AdminNotificationService.deleteReadNotifications();
      setNotifications(AdminNotificationService.getNotifications());
      setUnreadCount(AdminNotificationService.getUnreadCount());
      toast({
        title: "Read notifications deleted",
        description: "All read notifications have been deleted.",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteRead' }),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => !n.isRead));
        toast({
          title: "Read notifications deleted",
          description: "All read notifications have been deleted.",
        });
      }
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return '🎉';
      case 'credit':
        return '💰';
      case 'system':
        return '⚙️';
      case 'info':
        return 'ℹ️';
      case 'new-user':
        return '👤';
      case 'new-purchase':
        return '💳';
      default:
        return '📢';
    }
  };

  if (!isLoaded || !user) return null;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-bell-shake' : ''}`} />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.some(n => n.isRead) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteRead}
                  className="h-6 px-2 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear read
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <ScrollArea className="h-64">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      !notification.isRead ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.id);
                      }
                      setSelectedNotification(notification);
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{selectedNotification && getNotificationIcon(selectedNotification.type)}</span>
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNotification && formatDate(selectedNotification.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {selectedNotification?.message}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
