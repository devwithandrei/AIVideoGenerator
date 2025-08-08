"use client";

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  TrendingUp,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { CreditPurchase } from "@/components/credit-purchase";
import { CreditDisplay } from "@/components/credit-display";
import { toast } from "@/hooks/use-toast";

interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
}

export default function BillingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    if (isLoaded && isSignedIn) {
      loadCreditData();
    }
  }, [isLoaded, isSignedIn, router]);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      
      // Load credit balance
      const balanceResponse = await fetch('/api/credits/balance');
      if (balanceResponse.ok) {
        const balance = await balanceResponse.json();
        setCreditBalance(balance);
      }
    } catch (error) {
      console.error('Error loading credit data:', error);
      toast({
        title: "Error",
        description: "Failed to load credit information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Credits</h1>
        <p className="text-muted-foreground">
          Get free credits to start, then purchase credit packs to continue using our AI features.
        </p>
      </div>

      {/* Credit Balance */}
      {creditBalance && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Credit Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {creditBalance.balance}
                </div>
                <div className="text-sm text-muted-foreground">Available Credits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {creditBalance.totalPurchased}
                </div>
                <div className="text-sm text-muted-foreground">Total Purchased</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {creditBalance.totalUsed}
                </div>
                <div className="text-sm text-muted-foreground">Total Used</div>
              </div>
            </div>
            
            {/* Low Credit Warning */}
            {creditBalance.balance < 10 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Low Credits</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  You're running low on credits. Purchase more to continue using our features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Credit Purchase */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credit Packs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Choose a credit pack to add credits to your account. Credits are consumed as you use our AI features.
            </p>
          </div>
          <CreditPurchase />
        </CardContent>
      </Card>

      {/* Feature Pricing Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Credit Consumption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Credits are automatically deducted from your account when you use our AI features. Each feature has a specific credit cost.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Video Generation</h4>
              <div className="text-sm text-muted-foreground">
                <div>• Hailuo: 8 credits per video</div>
                <div>• Veo2: 15 credits per video</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Map Animation</h4>
              <div className="text-sm text-muted-foreground">
                <div>• Hailuo: 5 credits per animation</div>
                <div>• Veo2: 10 credits per animation</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Image Generation</h4>
              <div className="text-sm text-muted-foreground">
                <div>• Default: 3 credits per image</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notice */}
      {user?.publicMetadata?.role === 'admin' && (
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Admin Account</span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              As an admin, you have unlimited access to all features without credit restrictions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
