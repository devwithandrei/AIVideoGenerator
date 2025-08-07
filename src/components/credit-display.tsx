"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, AlertCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
}

export function CreditDisplay() {
  const { user } = useUser();
  const router = useRouter();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadCreditBalance();
    }
  }, [user?.id]);

  const loadCreditBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const balance = await response.json();
        setCreditBalance(balance);
      } else {
        setError('Failed to load credit balance');
      }
    } catch (error) {
      console.error('Error loading credit balance:', error);
      setError('Failed to load credit balance');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = () => {
    router.push('/dashboard/billing');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Credits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAdmin ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Admin Account
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlimited access to all features
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {creditBalance?.balance || 0}
              </span>
              <Button
                size="sm"
                onClick={handlePurchaseCredits}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Buy Credits
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Total Purchased: {creditBalance?.totalPurchased || 0}</div>
              <div>Total Used: {creditBalance?.totalUsed || 0}</div>
            </div>
            {creditBalance && creditBalance.balance < 5 && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">
                  Low credits. Consider purchasing more to continue using features.
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 