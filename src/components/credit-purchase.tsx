"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Zap, Gift } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/stripe';
import { toast } from '@/hooks/use-toast';

export function CreditPurchase() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    if (!user) return;

    try {
      setLoading(packageId);
      
      const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      
      if (!selectedPackage) {
        throw new Error('Invalid package');
      }

      // If it's the free starter pack, add credits directly
      if (selectedPackage.isFree) {
        const response = await fetch('/api/credits/add-free-pack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ packageId }),
        });

        if (!response.ok) {
          throw new Error('Failed to add free credits');
        }

        toast({
          title: "Free Credits Added",
          description: `Successfully added ${selectedPackage.credits} free credits to your account!`,
        });

        // Refresh the page to update credit display
        window.location.reload();
        return;
      }

      // For paid packages, use Stripe checkout
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to initiate purchase. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please sign in to purchase credits.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {CREDIT_PACKAGES.map((pkg) => (
        <Card 
          key={pkg.id} 
          className={`relative transition-all duration-300 hover:shadow-lg ${
            pkg.popular ? 'ring-2 ring-primary' : ''
          }`}
        >
          {pkg.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>
          )}
          
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{pkg.name}</CardTitle>
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{pkg.credits}</span>
              <span className="text-muted-foreground">credits</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {pkg.isFree ? 'FREE' : `$${(pkg.price / 100).toFixed(2)}`}
            </div>
            <p className="text-sm text-muted-foreground">{pkg.description}</p>
          </CardHeader>
          
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => handlePurchase(pkg.id)}
              disabled={loading === pkg.id}
              variant={pkg.isFree ? 'default' : 'outline'}
            >
              {loading === pkg.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {pkg.isFree ? (
                    <>
                      Get Free Credits
                      <Gift className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Purchase Credits
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
