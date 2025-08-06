import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getAdminEmails } from '@/lib/admin';

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



    // Transform Clerk users to our format
    console.log('Transforming users...');
    const transformedUsers = users.map(user => {
      console.log('Processing user:', user.id, user.email_addresses?.[0]?.email_address);
      
      // Check if user is admin based on email or metadata
      const userEmail = user.email_addresses?.[0]?.email_address;
      const isAdmin = user.public_metadata?.role === 'admin' || 
                     (userEmail && getAdminEmails().includes(userEmail));
      
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
      };
    });
    console.log('Transformed users:', transformedUsers.length);

    // Add a test admin user to demonstrate admin functionality
    const testAdminUser = {
      id: 'test_admin_1',
      email: 'admin@mediaforge.ai',
      firstName: 'Admin',
      lastName: 'User',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      lastSignInAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isActive: true,
      role: 'admin',
      banned: false,
      emailVerified: true,
    };

    // Add a test regular user
    const testRegularUser = {
      id: 'test_user_1',
      email: 'user@mediaforge.ai',
      firstName: 'Regular',
      lastName: 'User',
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      lastSignInAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isActive: true,
      role: 'user',
      banned: false,
      emailVerified: true,
    };

    // Combine real users with test users
    const allUsers = [...transformedUsers, testAdminUser, testRegularUser];
    console.log('Total users (including test users):', allUsers.length);

    return NextResponse.json({ users: allUsers });
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