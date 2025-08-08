"use client";

import React from 'react';
import { Header } from '@/components/header';

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="container px-4 md:px-6 py-10">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">MediaForge AI API</h1>
              <p className="text-muted-foreground">Powerful video, image, and map generation APIs.</p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">1. Get Your API Key</h3>
                  <p className="text-sm text-muted-foreground mb-3">Sign up and get your API key from the dashboard.</p>
                  <div className="p-3 bg-muted rounded-md">
                    <code className="text-sm">mf_sk_test_1234567890abcdef</code>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Make Your First Request</h3>
                  <p className="text-sm text-muted-foreground mb-3">Generate a video with a simple API call.</p>
                  <div className="p-3 bg-muted rounded-md overflow-x-auto">
                    <code className="text-sm whitespace-pre">
{`curl -X POST https://api.mediaforge.ai/v1/videos/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"prompt": "A beautiful sunset"}'`}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">Join thousands of developers building with our API.</p>
              <div className="flex gap-4 justify-center">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md">View Documentation</button>
                <button className="px-6 py-3 border border-input bg-background rounded-md">Get API Key</button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-4 sm:py-6 w-full shrink-0 items-center justify-between px-4 lg:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} MediaForge AI. All rights reserved.</p>
        <nav className="flex gap-3 sm:gap-4 md:gap-6">
          <a href="/terms" className="text-xs hover:underline underline-offset-4">Terms of Service</a>
          <a href="/privacy" className="text-xs hover:underline underline-offset-4">Privacy Policy</a>
        </nav>
      </footer>
    </div>
  );
}
