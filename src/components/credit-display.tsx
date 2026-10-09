"use client";

import React, { useEffect, useState } from 'react';
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
  
  // Check if user is admin
  const isAdmin = user ? getAdminEmailsForClient().includes(user.emailAddresses[0]?.emailAddress || '') : false;

  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Skip API calls for instant loading
  useEffect(() => {
    if (user && !isAdmin) {
      // Set default credits immediately
      setCredits({
        balance: 50,
        totalPurchased: 0,
        totalUsed: 0,
      });
    }
  }, [user, isAdmin]);

  // If user is admin, show unlimited credits without API call
  if (isAdmin) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Zap className="h-3 w-3" />
        ∞
      </Badge>
    );
  }

  // Skip loading check - always show credits
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Zap className="h-3 w-3" />
        {isAdmin ? '∞' : '0'}
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