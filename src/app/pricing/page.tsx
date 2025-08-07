"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Check, 
  Zap, 
  Crown, 
  Building2, 
  Video, 
  Image, 
  Map, 
  Users,
  Star,
  ArrowRight
} from "lucide-react";

const plans = [
  {
    name: "Starter Plan",
    price: "$9.99",
    period: "per month",
    credits: "100",
    description: "Perfect for individuals getting started with AI content creation",
    features: [
      "100 credits per month",
      "AI Video Generation (Hailuo & Veo2)",
      "AI Image Generation",
      "Map Animation Creation",
      "Basic support",
      "Standard processing time"
    ],
    popular: false,
    icon: Zap,
    color: "border-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600"
  },
  {
    name: "Pro Plan",
    price: "$19.99",
    period: "per month",
    credits: "300",
    description: "For creators who need more power and faster processing",
    features: [
      "300 credits per month",
      "Priority AI Video Generation",
      "Advanced AI Image Suite",
      "Premium Map Animations",
      "Priority support",
      "Faster processing time",
      "Custom video durations",
      "Batch processing"
    ],
    popular: false,
    icon: Crown,
    color: "border-purple-500",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600"
  },
  {
    name: "Business Plan",
    price: "Let's Talk",
    period: "custom",
    credits: "Unlimited",
    description: "Enterprise solutions for teams and large-scale projects",
    features: [
      "Unlimited credits",
      "Dedicated AI processing",
      "Custom model training",
      "White-label solutions",
      "24/7 priority support",
      "API access",
      "Custom integrations",
      "Team management",
      "Analytics dashboard"
    ],
    popular: false,
    icon: Building2,
    color: "border-orange-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600"
  }
];

const features = [
  {
    title: "AI Video Generation",
    description: "Create stunning videos from text prompts with multiple AI models",
    icon: Video,
    credits: {
      starter: "10 credits",
      pro: "8 credits",
      business: "Unlimited"
    }
  },
  {
    title: "AI Image Creation",
    description: "Generate high-quality images and edit existing ones with AI",
    icon: Image,
    credits: {
      starter: "5 credits",
      pro: "3 credits",
      business: "Unlimited"
    }
  },
  {
    title: "Map Animations",
    description: "Create beautiful animated map routes and visualizations",
    icon: Map,
    credits: {
      starter: "8 credits",
      pro: "6 credits",
      business: "Unlimited"
    }
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Choose Your Plan
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Start creating amazing content with our AI-powered tools. Choose the plan that fits your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <Card 
                  key={plan.name}
                  className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                          <IconComponent className={`h-5 w-5 ${plan.textColor}`} />
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 flex flex-col h-full">
                    <div className="space-y-3 flex-grow">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full mt-auto"
                      size="lg"
                    >
                      {plan.name === "Business Plan" ? (
                        <>
                          Contact Sales
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Feature Comparison
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                See how our features compare across different plans
              </p>
            </div>
          </div>
          
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.title} className="relative overflow-hidden transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Starter</span>
                        <Badge variant="outline">{feature.credits.starter}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Pro</span>
                        <Badge variant="outline">{feature.credits.pro}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Business</span>
                        <Badge variant="outline">{feature.credits.business}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Get Started?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                Join thousands of creators who are already using MediaForge AI to bring their ideas to life.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/sign-up" prefetch={false}>
                  Start Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link href="/dashboard" prefetch={false}>
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 