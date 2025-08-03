import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check, CreditCard } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    description: "For individuals and hobbyists starting out.",
    features: [
      "100 credits per month",
      "Basic video & image editing",
      "Watermarked exports",
      "Community support",
    ],
    cta: "Your Current Plan",
    current: true,
  },
  {
    name: "Pro",
    price: "$25",
    period: "/ month",
    description: "For professionals and small teams.",
    features: [
      "2,500 credits per month",
      "Full video & image editing suite",
      "No watermarks",
      "4K exports",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    accent: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with advanced needs.",
    features: [
      "Unlimited credits",
      "Custom model training",
      "Dedicated account manager",
      "API access",
      "Enterprise-grade security",
    ],
    cta: "Contact Sales",
  },
];

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Billing & Plans</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.accent ? "border-primary shadow-lg" : ""}>
            <CardHeader>
              <CardTitle className="font-headline">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.accent ? "default" : "outline"}
                disabled={plan.current}
                style={plan.accent ? {backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'} : {}}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Your primary payment method on file.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-semibold">Visa ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2026</p>
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
