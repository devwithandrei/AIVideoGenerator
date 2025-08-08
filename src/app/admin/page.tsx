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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw,
  Coins,
  ShoppingCart,
  TrendingUp,
  Zap,
  CreditCard,
  BarChart3,
  Clock,
  DollarSign
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
  credits: {
    balance: number;
    totalPurchased: number;
    totalUsed: number;
    hasUnlimitedAccess: boolean;
  };
  recentTransactions: Array<{
    id: string;
    type: 'purchase' | 'usage' | 'refund' | 'bonus';
    amount: number;
    description: string;
    model?: string;
    feature?: string;
    createdAt: string;
  }>;
  purchases: Array<{
    id: string;
    amount: number;
    currency: string;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    createdAt: string;
  }>;
  usageStats: {
    totalUsage: number;
    totalCreditsUsed: number;
    successCount: number;
    failedCount: number;
    successRate: number;
  };
  featureUsage: Array<{
    feature: string;
    model: string;
    count: number;
    totalCredits: number;
  }>;
}

export default function AdminPanel() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

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
          const user = users.find(u => u.id === userId);
          if (user) {
            setSelectedUser(user);
          }
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  // Calculate overall statistics
  const totalCreditsPurchased = users.reduce((sum, user) => sum + user.credits.totalPurchased, 0);
  const totalCreditsUsed = users.reduce((sum, user) => sum + user.credits.totalUsed, 0);
  const totalRevenue = users.reduce((sum, user) => 
    sum + user.purchases.filter(p => p.status === 'completed').reduce((pSum, p) => pSum + p.amount, 0), 0
  );
  const activeUsers = users.filter(u => u.isActive && u.role === 'user').length;

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
              <span className="font-semibold">{activeUsers} Active</span>
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

      {/* Enhanced Stats Cards */}
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
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Credits Purchased</CardTitle>
            <Coins className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{totalCreditsPurchased.toLocaleString()}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {totalCreditsUsed.toLocaleString()} used
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              From completed purchases
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Users</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{activeUsers}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0}% of total
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

          {/* Enhanced Users Table */}
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
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Joined</TableHead>
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
                        <div className="flex items-center gap-2">
                          <Coins className="h-3 w-3 text-yellow-600" />
                          {user.credits.hasUnlimitedAccess ? (
                            <Badge variant="outline" className="text-green-600">
                              Unlimited
                            </Badge>
                          ) : (
                            <span className="font-medium">{user.credits.balance}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Banned'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {user.usageStats.totalUsage} uses
                          </span>
                          {user.usageStats.totalUsage > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {user.usageStats.successRate.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>User Details - {user.firstName} {user.lastName}</DialogTitle>
                                <DialogDescription>
                                  Comprehensive user information including credits, purchases, and usage statistics.
                                </DialogDescription>
                              </DialogHeader>
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="credits">Credits</TabsTrigger>
                                  <TabsTrigger value="purchases">Purchases</TabsTrigger>
                                  <TabsTrigger value="usage">Usage</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Basic Info</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div><strong>Email:</strong> {user.email}</div>
                                        <div><strong>Role:</strong> {user.role}</div>
                                        <div><strong>Status:</strong> {user.isActive ? 'Active' : 'Banned'}</div>
                                        <div><strong>Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</div>
                                        <div><strong>Joined:</strong> {formatDate(user.createdAt)}</div>
                                        {user.lastSignInAt && (
                                          <div><strong>Last Active:</strong> {formatDate(user.lastSignInAt)}</div>
                                        )}
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Credit Summary</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div><strong>Balance:</strong> {user.credits.hasUnlimitedAccess ? 'Unlimited' : user.credits.balance}</div>
                                        <div><strong>Total Purchased:</strong> {user.credits.totalPurchased}</div>
                                        <div><strong>Total Used:</strong> {user.credits.totalUsed}</div>
                                        <div><strong>Usage Count:</strong> {user.usageStats.totalUsage}</div>
                                        <div><strong>Success Rate:</strong> {user.usageStats.successRate.toFixed(1)}%</div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="credits" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Recent Transactions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        {user.recentTransactions.length > 0 ? (
                                          user.recentTransactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-2 border rounded">
                                              <div>
                                                <div className="font-medium">{tx.description}</div>
                                                <div className="text-sm text-muted-foreground">
                                                  {tx.type} • {tx.model || 'N/A'} • {formatDate(tx.createdAt)}
                                                </div>
                                              </div>
                                              <Badge variant={tx.amount > 0 ? 'default' : 'secondary'}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                              </Badge>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-muted-foreground">No recent transactions</p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="purchases" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Purchase History</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        {user.purchases.length > 0 ? (
                                          user.purchases.map((purchase) => (
                                            <div key={purchase.id} className="flex items-center justify-between p-2 border rounded">
                                              <div>
                                                <div className="font-medium">{purchase.credits} credits</div>
                                                <div className="text-sm text-muted-foreground">
                                                  {formatCurrency(purchase.amount, purchase.currency)} • {purchase.status} • {formatDate(purchase.createdAt)}
                                                </div>
                                              </div>
                                              <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                                                {purchase.status}
                                              </Badge>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-muted-foreground">No purchase history</p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="usage" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Usage Statistics</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div><strong>Total Usage:</strong> {user.usageStats.totalUsage}</div>
                                        <div><strong>Credits Used:</strong> {user.usageStats.totalCreditsUsed}</div>
                                        <div><strong>Success Count:</strong> {user.usageStats.successCount}</div>
                                        <div><strong>Failed Count:</strong> {user.usageStats.failedCount}</div>
                                        <div><strong>Success Rate:</strong> {user.usageStats.successRate.toFixed(1)}%</div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Feature Usage</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2">
                                          {user.featureUsage.length > 0 ? (
                                            user.featureUsage.map((usage, index) => (
                                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                  <div className="font-medium">{usage.feature}</div>
                                                  <div className="text-sm text-muted-foreground">{usage.model}</div>
                                                </div>
                                                <div className="text-right">
                                                  <div className="font-medium">{usage.count}</div>
                                                  <div className="text-sm text-muted-foreground">{usage.totalCredits} credits</div>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-muted-foreground">No feature usage</p>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
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