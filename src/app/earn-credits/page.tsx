"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Link2, Share2, Loader2, Check } from 'lucide-react';

interface ReferralLink {
  id: string;
  code: string;
  clicks: number;
  signups: number;
  proPurchases: number;
  creditsEarned: number;
}

interface ReferralEvent {
  id: string;
  type: 'click' | 'signup' | 'pro_purchase';
  linkCode?: string;
  createdAt: string;
  metadata?: string;
}

import { Header } from '@/components/header';

export default function EarnCreditsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState<ReferralLink | null>(null);
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/referrals');
      if (res.ok) {
        const data = await res.json();
        setLink(data.link || null);
        setEvents(data.events || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const createLink = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/referrals', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLink(data.link);
      }
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchStats();
      // try to attach referral if cookie exists
      fetch('/api/referrals/attach', { method: 'POST' });
    }
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  const fullUrl = link ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${link.code}` : '';

  const copyToClipboard = async () => {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    if (navigator.share && fullUrl) {
      await navigator.share({ title: 'Join MediaForge AI', url: fullUrl });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Earn Credits
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Share your unique link. When someone signs up and purchases the Pro Pack, you earn bonus credits.
              </p>
            </div>
          </div>
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(!user) ? (
                  <div className="text-center text-muted-foreground">Please sign in to generate your referral link.</div>
                ) : loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                ) : link ? (
                  <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Input readOnly value={fullUrl} className="w-full" />
                        <Button variant="outline" onClick={copyToClipboard}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button onClick={share}>
                          <Share2 className="h-4 w-4 mr-2" /> Share
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">Clicks: {link?.clicks ?? 0}</Badge>
                        <Badge variant="secondary">Signups: {link?.signups ?? 0}</Badge>
                        <Badge variant="secondary">Pro purchases: {link?.proPurchases ?? 0}</Badge>
                        <Badge variant="secondary">Credits earned: {link?.creditsEarned ?? 0}</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button onClick={createLink} disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />} Generate my link
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Generate your unique referral link and share it.</p>
                <p>2. A friend clicks your link and signs up.</p>
                <p>3. When they purchase the Pro Pack, you earn 50 bonus credits.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No activity yet.</div>
                ) : (
                  <div className="space-y-3">
                    {events.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between text-sm border rounded-md p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {ev.type === 'click' ? 'Click' : ev.type === 'signup' ? 'Signup' : 'Pro Purchase'}
                          </Badge>
                          <span className="text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="truncate max-w-[60%] text-right text-muted-foreground">
                          {ev.linkCode ? `Code: ${ev.linkCode}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
