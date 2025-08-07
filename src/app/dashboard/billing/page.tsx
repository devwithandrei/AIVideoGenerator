"use client";

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Coins, 
  ShoppingCart, 
  History, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Package
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  description: string;
}

export default function BillingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

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

      // Load credit packages
      const packagesResponse = await fetch('/api/credits/packages');
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setPackages(packagesData);
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

  const handlePurchase = async (packageId: string, credits: number, price: number) => {
    try {
      setPurchasing(packageId);
      
      // For now, we'll simulate a purchase
      // In a real implementation, you'd integrate with Stripe or another payment processor
      toast({
        title: "Purchase Feature",
        description: "Payment processing will be implemented with Stripe integration.",
      });

      // Simulate successful purchase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: `Successfully purchased ${credits} credits!`,
      });

      // Reload credit data
      await loadCreditData();
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast({
        title: "Error",
        description: "Failed to purchase credits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
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
          Manage your credits and purchase more to continue using our AI features.
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
          </CardContent>
        </Card>
      )}

      {/* Credit Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Available Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {pkg.credits} Credits
                  </div>
                  <div className="text-2xl font-semibold">
                    {formatPrice(pkg.price)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pkg.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(pkg.id, pkg.credits, pkg.price)}
                    disabled={purchasing === pkg.id}
                  >
                    {purchasing === pkg.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Pricing Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Feature Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Video Generation</h4>
              <div className="text-sm text-muted-foreground">
                <div>• Hailuo (6s with sound): 10 credits</div>
                <div>• Veo2: 5 credits</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Map Animation</h4>
              <div className="text-sm text-muted-foreground">
                <div>• Hailuo: 8 credits</div>
                <div>• Veo2: 4 credits</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Image Generation</h4>
              <div className="text-sm text-muted-foreground">
                <div>• Mock generation: 1 credit</div>
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
