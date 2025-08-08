"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2 } from 'lucide-react';
import { getAdminEmailsForClient } from '@/lib/admin';

interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
}

export function CreditDisplay() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user ? getAdminEmailsForClient().includes(user.emailAddresses[0]?.emailAddress || '') : false;

  const fetchCredits = async () => {
    if (!user || !isLoaded) return;
    
    // If user is admin, show unlimited credits without API call
    if (isAdmin) {
      setCredits({
        balance: -1, // -1 indicates unlimited
        totalPurchased: 0,
        totalUsed: 0,
      });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/credits/balance');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, don't show error
          return;
        }
        throw new Error('Failed to fetch credits');
      }
      
      const data = await response.json();
      setCredits(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchCredits();
    }
  }, [isLoaded, user]);

  // Refresh credits every 30 seconds (only for non-admin users)
  useEffect(() => {
    if (!user || !isLoaded || isAdmin) return;
    
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [user, isLoaded, isAdmin]);

  if (!isLoaded || !user) {
    return null;
  }

  if (loading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-red-500">
        <Zap className="h-3 w-3" />
        Error
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Zap className="h-3 w-3" />
      {isAdmin ? '∞' : (credits?.balance || 0)}
    </Badge>
  );
} 