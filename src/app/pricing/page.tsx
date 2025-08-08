"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Video, 
  Image, 
  Map, 
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
  Play
} from "lucide-react";

const models = [
  {
    name: "Google Veo2",
    description: "Advanced AI video generation with superior quality and longer durations",
    price: "$0.15",
    perUnit: "per video",
    features: [
      "Up to 60 seconds duration",
      "High-quality 1080p output",
      "Advanced motion understanding",
      "Professional-grade results",
      "Fast processing (2-5 minutes)",
      "Multiple aspect ratios supported"
    ],
    icon: Sparkles,
    color: "border-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    popular: true
  },
  {
    name: "Hailuo",
    description: "Fast and efficient video generation for quick content creation",
    price: "$0.08",
    perUnit: "per video",
    features: [
      "Up to 30 seconds duration",
      "720p to 1080p output",
      "Quick generation (1-3 minutes)",
      "Cost-effective solution",
      "Good for social media content",
      "Multiple style options"
    ],
    icon: Zap,
    color: "border-green-500",
    bgColor: "bg-green-500/10",
    textColor: "text-green-600",
    popular: false
  }
];

const otherServices = [
  {
    name: "AI Image Generation",
    description: "Create stunning images from text descriptions",
    price: "$0.03",
    perUnit: "per image",
    icon: Image,
    features: ["High-resolution output", "Multiple styles", "Fast generation"]
  },
  {
    name: "Map Animation",
    description: "Create beautiful animated map routes and visualizations",
    price: "$0.05",
    perUnit: "per animation",
    icon: Map,
    features: ["Custom routes", "Multiple map styles", "Export options"]
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Video Generation Models */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Video Generation Models
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Choose between our two powerful AI video generation models
              </p>
            </div>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {models.map((model, index) => {
              const IconComponent = model.icon;
              return (
                <Card 
                  key={model.name}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    model.popular ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {model.popular && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${model.bgColor}`}>
                          <IconComponent className={`h-5 w-5 ${model.textColor}`} />
                        </div>
                        <CardTitle className="text-xl">{model.name}</CardTitle>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-4xl font-bold">{model.price}</span>
                        <span className="text-muted-foreground">{model.perUnit}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 flex flex-col h-full">
                    <div className="space-y-3 flex-grow">
                      {model.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <Play className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full mt-auto"
                      size="lg"
                    >
                      Try {model.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Other Services */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Additional Services
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Explore our other AI-powered tools and services
              </p>
            </div>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {otherServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={service.name} className="relative overflow-hidden transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold">{service.price}</span>
                      <span className="text-muted-foreground">{service.perUnit}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <Play className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Simple, transparent pricing with no hidden fees
              </p>
            </div>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Video className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Choose Your Model</h3>
              <p className="text-sm text-muted-foreground">
                Select between Google Veo2 for premium quality or Hailuo for cost-effective generation
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Generate Your Video</h3>
              <p className="text-sm text-muted-foreground">
                Upload your prompt and let our AI create your video in minutes
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Pay Per Use</h3>
              <p className="text-sm text-muted-foreground">
                Only pay for the videos you generate. No monthly fees or commitments
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Start Creating?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                Join thousands of creators who are already using MediaForge AI to bring their ideas to life.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/sign-up" prefetch={false}>
                  Start Creating Now
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