import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getAdminEmails } from '@/lib/admin';
import { db } from '@/lib/db';
import { credits, creditTransactions, purchases, usageLogs } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await currentUser();
    
    console.log('API Route - user:', user?.id);
    
    if (!user) {
      console.log('API Route - No user found');
      return NextResponse.json({ error: 'Unauthorized - No user' }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    
    console.log('API Route - currentUser:', user.id, 'email:', userEmail);
    
    if (!userEmail) {
      console.log('API Route - No user email found');
      return NextResponse.json({ error: 'User email not found' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = getAdminEmails();
    const isAdmin = user.publicMetadata?.role === 'admin' || adminEmails.includes(userEmail);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch all users from Clerk using fetch
    console.log('CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);
    
    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Clerk API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Clerk API error:', errorText);
      throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Clerk API response:', data);
    // Clerk API returns users directly, not in a data property
    const users = Array.isArray(data) ? data : (data.data || []);
    console.log('Users found:', users.length);

    // Transform Clerk users to our format with credit information
    console.log('Transforming users with credit data...');
    const transformedUsers = await Promise.all(users.map(async (user) => {
      console.log('Processing user:', user.id, user.email_addresses?.[0]?.email_address);
      
      // Check if user is admin based on email or metadata
      const userEmail = user.email_addresses?.[0]?.email_address;
      const isAdmin = user.public_metadata?.role === 'admin' || 
                     (userEmail && getAdminEmails().includes(userEmail));
      
      // Get credit information from database
      let creditBalance = {
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
      };
      let recentTransactions: any[] = [];
      let purchaseHistory: any[] = [];
      let stats = {
        totalUsage: 0,
        totalCreditsUsed: 0,
        successCount: 0,
        failedCount: 0,
      };
      let featureUsage: any[] = [];

      try {
        if (db) {
          const userCredits = await db
            .select()
            .from(credits)
            .where(eq(credits.userId, user.id))
            .limit(1);

          creditBalance = userCredits.length > 0 ? userCredits[0] : creditBalance;

          // Get recent transactions
          recentTransactions = await db
            .select()
            .from(creditTransactions)
            .where(eq(creditTransactions.userId, user.id))
            .orderBy(desc(creditTransactions.createdAt))
            .limit(5);

          // Get purchase history
          purchaseHistory = await db
            .select()
            .from(purchases)
            .where(eq(purchases.userId, user.id))
            .orderBy(desc(purchases.createdAt))
            .limit(10);

          // Get usage statistics
          const usageStats = await db
            .select({
              totalUsage: sql<number>`count(*)`,
              totalCreditsUsed: sql<number>`sum(credits_used)`,
              successCount: sql<number>`count(*) filter (where status = 'success')`,
              failedCount: sql<number>`count(*) filter (where status = 'failed')`,
            })
            .from(usageLogs)
            .where(eq(usageLogs.userId, user.id));

          stats = usageStats[0] || stats;

          // Get feature usage breakdown
          featureUsage = await db
            .select({
              feature: usageLogs.feature,
              model: usageLogs.model,
              count: sql<number>`count(*)`,
              totalCredits: sql<number>`sum(credits_used)`,
            })
            .from(usageLogs)
            .where(eq(usageLogs.userId, user.id))
            .groupBy(usageLogs.feature, usageLogs.model);
        }
      } catch (error) {
        console.error('Database error for user', user.id, ':', error);
        // Continue with default values if database is not available
      }

      return {
        id: user.id,
        email: user.email_addresses?.[0]?.email_address || 'No email',
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        imageUrl: user.image_url || undefined,
        createdAt: new Date(user.created_at).toISOString(),
        lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : undefined,
        isActive: !user.banned, // Clerk uses 'banned' field
        role: isAdmin ? 'admin' : 'user',
        banned: user.banned || false,
        emailVerified: user.email_addresses?.[0]?.verification?.status === 'verified',
        
        // Credit Information
        credits: {
          balance: creditBalance.balance,
          totalPurchased: creditBalance.totalPurchased,
          totalUsed: creditBalance.totalUsed,
          hasUnlimitedAccess: isAdmin,
        },
        
        // Recent Activity
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          model: tx.model,
          feature: tx.feature,
          createdAt: tx.createdAt.toISOString(),
        })),
        
        // Purchase History
        purchases: purchaseHistory.map(purchase => ({
          id: purchase.id,
          amount: purchase.amount,
          currency: purchase.currency,
          credits: purchase.credits,
          status: purchase.status,
          createdAt: purchase.createdAt.toISOString(),
        })),
        
        // Usage Statistics
        usageStats: {
          totalUsage: Number(stats.totalUsage),
          totalCreditsUsed: Number(stats.totalCreditsUsed),
          successCount: Number(stats.successCount),
          failedCount: Number(stats.failedCount),
          successRate: stats.totalUsage > 0 ? (Number(stats.successCount) / Number(stats.totalUsage)) * 100 : 0,
        },
        
        // Feature Usage Breakdown
        featureUsage: featureUsage.map(usage => ({
          feature: usage.feature,
          model: usage.model,
          count: Number(usage.count),
          totalCredits: Number(usage.totalCredits),
        })),
      };
    }));
    console.log('Transformed users with credit data:', transformedUsers.length);

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentUser();
    
    console.log('PATCH API Route - user:', user?.id);
    
    if (!user) {
      console.log('PATCH API Route - No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    
    console.log('PATCH API Route - currentUser:', user.id, 'email:', userEmail);
    
    if (!userEmail) {
      console.log('PATCH API Route - No user email found');
      return NextResponse.json({ error: 'User email not found' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = getAdminEmails();
    const isAdmin = user.publicMetadata?.role === 'admin' || adminEmails.includes(userEmail);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { targetUserId, action } = await request.json();

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    switch (action) {
      case 'ban':
        await clerkClient.users.updateUser(targetUserId, {
          banned: true,
        });
        break;
      case 'unban':
        await clerkClient.users.updateUser(targetUserId, {
          banned: false,
        });
        break;
      case 'delete':
        await clerkClient.users.deleteUser(targetUserId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 