"use client";

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Users, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Activity,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAdminEmailsForClient } from "@/lib/admin";

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: string;
  lastSignInAt?: string;
  isActive: boolean;
  role: 'admin' | 'user';
  banned: boolean;
  emailVerified: boolean;
}

export default function AdminPanel() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

  // Admin check using environment variable
  const adminEmails = getAdminEmailsForClient();
  const isAdmin = currentUser?.publicMetadata?.role === 'admin' || 
                  (currentUser?.emailAddresses?.[0]?.emailAddress && 
                   adminEmails.includes(currentUser.emailAddresses[0].emailAddress)) ||
                  currentUser?.emailAddresses?.[0]?.emailAddress === 'devwithandrei@gmail.com';

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    if (isLoaded && isSignedIn && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      router.replace('/dashboard');
      return;
    }

    if (isLoaded && isSignedIn && isAdmin) {
      loadUsers();
    }
  }, [isLoaded, isSignedIn, isAdmin, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      
      const response = await fetch('/api/admin/users');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleUserAction = async (userId: string, action: 'view' | 'delete' | 'ban' | 'activate') => {
    try {
      switch (action) {
        case 'view':
          toast({
            title: "View User",
            description: `Viewing details for user ${userId}`,
          });
          break;
        case 'delete':
          const deleteResponse = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              targetUserId: userId,
              action: 'delete'
            }),
          });
          
          if (deleteResponse.ok) {
            setUsers(prev => prev.filter(user => user.id !== userId));
            toast({
              title: "User Deleted",
              description: "User has been deleted successfully.",
            });
          } else {
            throw new Error('Failed to delete user');
          }
          break;
        case 'ban':
          const banResponse = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              targetUserId: userId,
              action: 'ban'
            }),
          });
          
          if (banResponse.ok) {
            setUsers(prev => prev.map(user => 
              user.id === userId ? { ...user, isActive: false, banned: true } : user
            ));
            toast({
              title: "User Banned",
              description: "User has been banned successfully.",
            });
          } else {
            throw new Error('Failed to ban user');
          }
          break;
        case 'activate':
          const activateResponse = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              targetUserId: userId,
              action: 'unban'
            }),
          });
          
          if (activateResponse.ok) {
            setUsers(prev => prev.map(user => 
              user.id === userId ? { ...user, isActive: true, banned: false } : user
            ));
            toast({
              title: "User Activated",
              description: "User has been activated successfully.",
            });
          } else {
            throw new Error('Failed to activate user');
          }
          break;
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-headline bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage users and monitor application activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{users.length} Users</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <Activity className="h-4 w-4" />
              <span className="font-semibold">{users.filter(u => u.isActive).length} Active</span>
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="ml-2 font-medium">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{users.length}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              +{users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Active Users</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{users.filter(u => u.isActive).length}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {users.length > 0 ? Math.round((users.filter(u => u.isActive).length / users.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Admins</CardTitle>
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{users.filter(u => u.role === 'admin').length}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              System administrators
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Banned Users</CardTitle>
            <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{users.filter(u => !u.isActive).length}</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Suspended accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRole === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('all')}
              >
                All
              </Button>
              <Button
                variant={filterRole === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('admin')}
              >
                Admins
              </Button>
              <Button
                variant={filterRole === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('user')}
              >
                Users
              </Button>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                                     <TableRow>
                     <TableHead>User</TableHead>
                     <TableHead>Email</TableHead>
                     <TableHead>Role</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Verified</TableHead>
                     <TableHead>Joined</TableHead>
                     <TableHead>Last Active</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.imageUrl ? (
                              <img
                                src={user.imageUrl}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {user.role === 'admin' && (
                              <Shield className="h-3 w-3 text-blue-600 absolute -top-1 -right-1 bg-background rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : 'Unknown User'
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                                             <TableCell>
                         <Badge variant={user.isActive ? 'default' : 'destructive'}>
                           {user.isActive ? 'Active' : 'Banned'}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                           {user.emailVerified ? 'Verified' : 'Unverified'}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <Calendar className="h-3 w-3 text-muted-foreground" />
                           {formatDate(user.createdAt)}
                         </div>
                       </TableCell>
                      <TableCell>
                        {user.lastSignInAt ? (
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-muted-foreground" />
                            {formatDate(user.lastSignInAt)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'view')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'ban')}
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'activate')}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'delete')}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || filterRole !== 'all' 
                      ? 'No users match your filters.'
                      : 'No users found.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
} 