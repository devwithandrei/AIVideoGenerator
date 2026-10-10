"use client";

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Users, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Activity,
  Eye,
  CheckCircle,
  Trash2,
  Ban,
  RefreshCw,
  Coins,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  BarChart3,
  Clock,
  DollarSign,
  Upload,
  Film,
  Star,
  X,
  Settings2,
  Pencil,
  Save,
  RotateCcw,
  Clapperboard,
  Plus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAdminEmailsForClient } from "@/lib/admin";
import { FeatureIcon, FEATURE_ICON_NAMES } from "@/components/feature-icon";

interface BillboardVideoData {
  id: string;
  title: string;
  headline?: string | null;
  subheadline?: string | null;
  cloudinaryPublicId: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  isActive: boolean;
  isDefault: boolean;
  uploadedByAdminEmail?: string | null;
  durationSeconds?: number | null;
  displayOrder: number;
  lightingOverride?: number | null;
  createdAt: string;
}

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: string;
  lastSignInAt?: string;
  isActive: boolean;
  isOnline: boolean;
  lastSeenAt?: string;
  role: 'admin' | 'user';
  banned: boolean;
  emailVerified: boolean;
  credits: {
    balance: number;
    totalPurchased: number;
    totalUsed: number;
    hasUnlimitedAccess: boolean;
  };
  recentTransactions: Array<{
    id: string;
    type: 'purchase' | 'usage' | 'refund' | 'bonus';
    amount: number;
    description: string;
    model?: string;
    feature?: string;
    createdAt: string;
  }>;
  purchases: Array<{
    id: string;
    amount: number;
    currency: string;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    createdAt: string;
  }>;
  usageStats: {
    totalUsage: number;
    totalCreditsUsed: number;
    successCount: number;
    failedCount: number;
    successRate: number;
  };
  featureUsage: Array<{
    feature: string;
    model: string;
    count: number;
    totalCredits: number;
  }>;
}

export default function AdminPanel() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user: authUser } = useUser();
  const user = authUser ?? (userId ? ({ id: userId }) as any : null);
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [, setClockTick] = useState(0);

  // Billboard state
  const [billboards, setBillboards] = useState<BillboardVideoData[]>([]);
  const [billboardLoading, setBillboardLoading] = useState(false);
  const [editingBillboardId, setEditingBillboardId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    headline: string;
    subheadline: string;
    displayOrder: number;
    lightingOverride: number | null;
  }>({ title: '', headline: '', subheadline: '', displayOrder: 0, lightingOverride: null });
  const [savingBillboardId, setSavingBillboardId] = useState<string | null>(null);
  const [deletingBillboardId, setDeletingBillboardId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [billboardSettings, setBillboardSettings] = useState<{ displayMode: 'single' | 'rotate'; autoLoop: boolean; crossfadeMs: number; backgroundLighting: number }>({
    displayMode: 'single',
    autoLoop: true,
    crossfadeMs: 450,
    backgroundLighting: 55,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [newBillboardTitle, setNewBillboardTitle] = useState('');
  const [newBillboardHeadline, setNewBillboardHeadline] = useState('');
  const [newBillboardSubheadline, setNewBillboardSubheadline] = useState('');
  const [newBillboardFile, setNewBillboardFile] = useState<File | null>(null);
  const [newBillboardSetActive, setNewBillboardSetActive] = useState(true);
  const [newBillboardSetDefault, setNewBillboardSetDefault] = useState(true);
  const [uploadingBillboard, setUploadingBillboard] = useState(false);

  // Feature videos state (homepage feature cards: dynamic list)
  interface FeatureItemData {
    id: string;
    title: string;
    description: string;
    icon: string;
    videoUrl: string | null;
    cloudinaryPublicId: string | null;
    posterUrl: string | null;
    durationSeconds: number | null;
    displayOrder: number;
    updatedAt: string;
  }
  const [features, setFeatures] = useState<FeatureItemData[]>([]);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureBusyId, setFeatureBusyId] = useState<string | null>(null);
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');
  const [newFeatureIcon, setNewFeatureIcon] = useState('Sparkles');
  const [featureIcons, setFeatureIcons] = useState<string[]>([]);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [featureEditDraft, setFeatureEditDraft] = useState<{ title: string; description: string; icon: string }>({
    title: '',
    description: '',
    icon: 'Sparkles',
  });

  // Admin check using environment variable
  const adminEmails = getAdminEmailsForClient();
  const isAdmin = user?.publicMetadata?.role === 'admin' || 
                  (user?.emailAddresses?.[0]?.emailAddress && 
                   adminEmails.includes(user.emailAddresses[0].emailAddress)) ||
                  user?.emailAddresses?.[0]?.emailAddress === 'devwithandrei@gmail.com';

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    if (isLoaded && isSignedIn && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      router.replace('/studio');
      return;
    }

    if (isLoaded && isSignedIn && isAdmin) {
      loadUsers();
      loadBillboards();
      loadFeatureVideos();
    }
  }, [isLoaded, isSignedIn, isAdmin, router]);

  useEffect(() => {
    let alive = true;
    let lastPoll = 0;
    const POLL_MS = 10000;

    const refreshPresence = async () => {
      if (!alive) return;
      try {
        const res = await fetch('/api/presence', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const ids: string[] = Array.isArray(data.onlineUserIds) ? data.onlineUserIds : [];
        const lastSeenMap: Record<string, number> =
          data.lastSeen && typeof data.lastSeen === 'object' ? data.lastSeen : {};
        setUsers((prev) => {
          let changed = false;
          const next = prev.map((u) => {
            const online = ids.includes(u.id);
            const ls = lastSeenMap[u.id];
            const lsIso = ls ? new Date(ls).toISOString() : undefined;
            const lsChanged = !!lsIso !== !!u.lastSeenAt || (lsIso && u.lastSeenAt !== lsIso);
            if (u.isOnline !== online || lsChanged) {
              changed = true;
              return { ...u, isOnline: online, lastSeenAt: lsIso ?? u.lastSeenAt };
            }
            return u;
          });
          return changed ? next : prev;
        });
      } catch (_) {}
    };

    const tick = () => {
      if (!alive) return;
      if (document.visibilityState === 'visible' && Date.now() - lastPoll >= POLL_MS) {
        lastPoll = Date.now();
        void refreshPresence();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastPoll = Date.now();
        void refreshPresence();
      }
    };

    const id = window.setInterval(tick, 2000);
    document.addEventListener('visibilitychange', onVisibility);
    void refreshPresence();

    const clockId = window.setInterval(() => setClockTick((t) => t + 1), 30000);

    return () => {
      alive = false;
      window.clearInterval(id);
      window.clearInterval(clockId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const loadBillboards = async () => {
    try {
      setBillboardLoading(true);
      const res = await fetch('/api/admin/billboard');
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBillboards(data.billboards || []);
      if (data.settings && typeof data.settings === 'object') {
        setBillboardSettings({
          displayMode: data.settings.displayMode === 'rotate' ? 'rotate' : 'single',
          autoLoop: typeof data.settings.autoLoop === 'boolean' ? data.settings.autoLoop : true,
          crossfadeMs: Number.isFinite(data.settings.crossfadeMs) ? Math.max(0, Math.min(5000, Number(data.settings.crossfadeMs))) : 450,
          backgroundLighting: Number.isFinite(data.settings.backgroundLighting) ? Math.max(0, Math.min(100, Number(data.settings.backgroundLighting))) : 55,
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to load billboards.',
        variant: 'destructive',
      });
    } finally {
      setBillboardLoading(false);
    }
  };

  const handleUploadBillboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillboardFile || !newBillboardTitle.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please provide a title and a video file.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setUploadingBillboard(true);
      const fd = new FormData();
      fd.append('video', newBillboardFile);
      fd.append('title', newBillboardTitle.trim());
      if (newBillboardHeadline.trim()) fd.append('headline', newBillboardHeadline.trim());
      if (newBillboardSubheadline.trim()) fd.append('subheadline', newBillboardSubheadline.trim());
      fd.append('setActive', newBillboardSetActive ? 'true' : 'false');
      fd.append('setDefault', newBillboardSetDefault ? 'true' : 'false');

      const res = await fetch('/api/admin/billboard', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      await res.json();
      toast({ title: 'Success', description: 'Billboard uploaded to Cloudinary.' });
      setNewBillboardTitle('');
      setNewBillboardHeadline('');
      setNewBillboardSubheadline('');
      setNewBillboardFile(null);
      await loadBillboards();
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Upload failed',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    } finally {
      setUploadingBillboard(false);
    }
  };

  const billboardAction = async (id: string, action: 'activate' | 'deactivate' | 'default' | 'delete') => {
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/billboard?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        setBillboards(prev => prev.filter(b => b.id !== id));
        toast({ title: 'Deleted', description: 'Billboard removed.' });
        return;
      }
      const body: any = { id, action };
      const resetOthers = billboardSettings.displayMode !== 'rotate';
      if (action === 'activate') body.resetOthers = resetOthers;
      const res = await fetch('/api/admin/billboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBillboards(prev =>
        prev.map(b => {
          if (action === 'activate') {
            return resetOthers ? { ...b, isActive: b.id === id } : { ...b, isActive: b.id === id ? true : b.isActive };
          }
          if (action === 'deactivate') return { ...b, isActive: b.id === id ? false : b.isActive };
          if (action === 'default') return { ...b, isDefault: b.id === id, isActive: b.id === id ? true : b.isActive };
          return (data.billboard && data.billboard.id === b.id) ? data.billboard : b;
        })
      );
      toast({ title: 'Success', description: `Billboard ${action}d.` });
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Action failed',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    }
  };

  const updateBillboardMeta = async (id: string, patch: { title?: string; headline?: string; subheadline?: string; displayOrder?: number; lightingOverride?: number | null }) => {
    try {
      const res = await fetch('/api/admin/billboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'update', ...patch }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBillboards(prev => prev.map(b => b.id === id && data.billboard ? data.billboard : b));
      toast({ title: 'Updated' });
    } catch (e: any) {
      toast({ title: 'Update failed', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  const startBillboardEdit = (b: BillboardVideoData) => {
    setEditingBillboardId(b.id);
    setEditDraft({
      title: b.title || '',
      headline: (b.headline as any) ?? '',
      subheadline: (b.subheadline as any) ?? '',
      displayOrder: Number(b.displayOrder) || 0,
      lightingOverride:
        b.lightingOverride === null || b.lightingOverride === undefined
          ? null
          : Number.isFinite(Number(b.lightingOverride))
            ? Number(b.lightingOverride)
            : null,
    });
  };

  const cancelBillboardEdit = () => {
    setEditingBillboardId(null);
    setEditDraft({ title: '', headline: '', subheadline: '', displayOrder: 0, lightingOverride: null });
  };

  const saveBillboardEdit = async (id: string) => {
    try {
      setSavingBillboardId(id);
      await updateBillboardMeta(id, {
        title: editDraft.title.trim() || 'Untitled',
        headline: editDraft.headline.trim() ? editDraft.headline : null as any,
        subheadline: editDraft.subheadline.trim() ? editDraft.subheadline : null as any,
        displayOrder: Number(editDraft.displayOrder) || 0,
        lightingOverride: editDraft.lightingOverride,
      });
      cancelBillboardEdit();
    } finally {
      setSavingBillboardId(null);
    }
  };

  const confirmDeleteBillboard = async (id: string) => {
    try {
      setDeletingBillboardId(id);
      await billboardAction(id, 'delete');
    } finally {
      setDeletingBillboardId(null);
      setDeleteConfirmId(null);
    }
  };

  const saveHeroSettings = async () => {
    try {
      setSavingSettings(true);
      const res = await fetch('/api/admin/billboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settings', settings: billboardSettings }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.settings) setBillboardSettings(data.settings);
      toast({ title: 'Hero display settings saved.' });
    } catch (e: any) {
      toast({ title: 'Failed to save settings', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const loadFeatureVideos = async () => {
    try {
      setFeatureLoading(true);
      const res = await fetch('/api/admin/feature-videos', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.features)) setFeatures(data.features);
      if (Array.isArray(data.icons) && data.icons.length) setFeatureIcons(data.icons);
    } catch (e: any) {
      toast({ title: 'Failed to load features', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setFeatureLoading(false);
    }
  };

  const addNewFeature = async () => {
    if (!newFeatureTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    try {
      setAddingFeature(true);
      const res = await fetch('/api/admin/feature-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newFeatureTitle.trim(),
          description: newFeatureDescription.trim(),
          icon: newFeatureIcon,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.features)) setFeatures(data.features);
      setNewFeatureTitle('');
      setNewFeatureDescription('');
      setNewFeatureIcon('Sparkles');
      toast({ title: 'Feature added' });
    } catch (e: any) {
      toast({ title: 'Failed to add feature', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setAddingFeature(false);
    }
  };

  const updateFeatureMeta = async (id: string, patch: { title?: string; description?: string; icon?: string; displayOrder?: number }) => {
    try {
      const res = await fetch('/api/admin/feature-videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.features)) setFeatures(data.features);
    } catch (e: any) {
      toast({ title: 'Update failed', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  const uploadFeatureVideo = async (id: string, file: File) => {
    try {
      setFeatureBusyId(id);
      const fd = new FormData();
      fd.append('id', id);
      fd.append('video', file);
      const res = await fetch('/api/admin/feature-videos', { method: 'PATCH', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.features)) setFeatures(data.features);
      toast({ title: 'Feature video uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setFeatureBusyId(null);
    }
  };

  const removeFeatureVideo = async (id: string) => {
    try {
      setFeatureBusyId(id);
      const fd = new FormData();
      fd.append('id', id);
      fd.append('removeVideo', 'true');
      const res = await fetch('/api/admin/feature-videos', { method: 'PATCH', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.features)) setFeatures(data.features);
      toast({ title: 'Feature video removed' });
    } catch (e: any) {
      toast({ title: 'Remove failed', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setFeatureBusyId(null);
    }
  };

  const deleteFeature = async (id: string) => {
    try {
      setFeatureBusyId(id);
      const res = await fetch(`/api/admin/feature-videos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.features)) setFeatures(data.features);
      toast({ title: 'Feature deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: String(e?.message || e), variant: 'destructive' });
    } finally {
      setFeatureBusyId(null);
    }
  };

  const moveFeature = async (id: string, direction: -1 | 1) => {
    const idx = features.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= features.length) return;
    const ordered = [...features];
    const [item] = ordered.splice(idx, 1);
    ordered.splice(target, 0, item);
    try {
      const res = await fetch('/api/admin/feature-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: ordered.map((f) => f.id) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.features)) setFeatures(data.features);
    } catch (e: any) {
      toast({ title: 'Reorder failed', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  const startFeatureEdit = (f: FeatureItemData) => {
    setEditingFeatureId(f.id);
    setFeatureEditDraft({ title: f.title, description: f.description, icon: f.icon });
  };

  const cancelFeatureEdit = () => {
    setEditingFeatureId(null);
    setFeatureEditDraft({ title: '', description: '', icon: 'Sparkles' });
  };

  const saveFeatureEdit = async (id: string) => {
    if (!featureEditDraft.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    await updateFeatureMeta(id, {
      title: featureEditDraft.title.trim(),
      description: featureEditDraft.description,
      icon: featureEditDraft.icon,
    });
    cancelFeatureEdit();
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      
      const response = await fetch('/api/admin/users');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleUserAction = async (userId: string, action: 'view' | 'delete' | 'ban' | 'activate') => {
    try {
      switch (action) {
        case 'view':
          const user = users.find(u => u.id === userId);
          if (user) {
            setSelectedUser(user);
          }
          break;
        case 'delete':
          const deleteResponse = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              targetUserId: userId,
              action: 'delete'
            }),
          });
          
          if (deleteResponse.ok) {
            setUsers(prev => prev.filter(user => user.id !== userId));
            toast({
              title: "User Deleted",
              description: "User has been deleted successfully.",
            });
          } else {
            throw new Error('Failed to delete user');
          }
          break;
        case 'ban':
          const banResponse = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              targetUserId: userId,
              action: 'ban'
            }),
          });
          
          if (banResponse.ok) {
            setUsers(prev => prev.map(user => 
              user.id === userId ? { ...user, isActive: false, banned: true } : user
            ));
            toast({
              title: "User Banned",
              description: "User has been banned successfully.",
            });
          } else {
            throw new Error('Failed to ban user');
          }
          break;
        case 'activate':
          const activateResponse = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              targetUserId: userId,
              action: 'unban'
            }),
          });
          
          if (activateResponse.ok) {
            setUsers(prev => prev.map(user => 
              user.id === userId ? { ...user, isActive: true, banned: false } : user
            ));
            toast({
              title: "User Activated",
              description: "User has been activated successfully.",
            });
          } else {
            throw new Error('Failed to activate user');
          }
          break;
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPreciseDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'never';
    const then = new Date(dateString).getTime();
    if (Number.isNaN(then)) return 'never';
    const diffMs = Date.now() - then;
    if (diffMs < 0) return 'just now';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    const wk = Math.floor(day / 7);
    if (wk < 5) return `${wk}w ago`;
    const mo = Math.floor(day / 30);
    if (mo < 12) return `${mo}mo ago`;
    const yr = Math.floor(day / 365);
    return `${yr}y ago`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  // Calculate overall statistics
  const totalCreditsPurchased = users.reduce((sum, user) => sum + user.credits.totalPurchased, 0);
  const totalCreditsUsed = users.reduce((sum, user) => sum + user.credits.totalUsed, 0);
  const totalRevenue = users.reduce((sum, user) => 
    sum + user.purchases.filter(p => p.status === 'completed').reduce((pSum, p) => pSum + p.amount, 0), 0
  );
  const activeUsers = users.filter(u => u.isOnline).length;

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 py-5 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-headline bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage users and monitor application activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{users.length} Users</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <Activity className="h-4 w-4" />
              <span className="font-semibold">{activeUsers} Online</span>
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="ml-2 font-medium">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{users.length}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              +{users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Credits Purchased</CardTitle>
            <Coins className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{totalCreditsPurchased.toLocaleString()}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {totalCreditsUsed.toLocaleString()} used
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              From completed purchases
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Users</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{activeUsers}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              online now · {users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full space-y-6">
        <TabsList className="grid grid-cols-3 max-w-xl">
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="billboard" className="gap-2"><Film className="h-4 w-4" /> Billboard Videos</TabsTrigger>
          <TabsTrigger value="features" className="gap-2"><Clapperboard className="h-4 w-4" /> Feature Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {/* Filters and Search */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
            <div className="flex gap-2">
              <Button
                variant={filterRole === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('all')}
              >
                All
              </Button>
              <Button
                variant={filterRole === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('admin')}
              >
                Admins
              </Button>
              <Button
                variant={filterRole === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('user')}
              >
                Users
              </Button>
            </div>
          </div>

          {/* Enhanced Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.imageUrl ? (
                              <img
                                src={user.imageUrl}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {user.role === 'admin' && (
                              <Shield className="h-3 w-3 text-blue-600 absolute -top-1 -right-1 bg-background rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : 'Unknown User'
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Coins className="h-3 w-3 text-yellow-600" />
                          {user.credits.hasUnlimitedAccess ? (
                            <Badge variant="outline" className="text-green-600">
                              Unlimited
                            </Badge>
                          ) : (
                            <span className="font-medium">{user.credits.balance}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={user.banned ? 'destructive' : 'secondary'}
                            className={!user.banned && user.isOnline ? 'bg-green-600 text-white hover:bg-green-700 border-transparent' : undefined}
                            title={user.lastSeenAt ? `Last seen: ${formatPreciseDate(user.lastSeenAt)}` : undefined}
                          >
                            {user.banned ? 'Banned' : user.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                          {!user.banned && (
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {user.isOnline ? 'active now' : `last seen ${formatRelativeTime(user.lastSeenAt)}`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {user.usageStats.totalUsage} uses
                          </span>
                          {user.usageStats.totalUsage > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {user.usageStats.successRate.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>User Details - {user.firstName} {user.lastName}</DialogTitle>
                                <DialogDescription>
                                  Comprehensive user information including credits, purchases, and usage statistics.
                                </DialogDescription>
                              </DialogHeader>
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="credits">Credits</TabsTrigger>
                                  <TabsTrigger value="purchases">Purchases</TabsTrigger>
                                  <TabsTrigger value="usage">Usage</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Basic Info</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div><strong>Email:</strong> {user.email}</div>
                                        <div><strong>Role:</strong> {user.role}</div>
                                        <div><strong>Status:</strong> {user.banned ? 'Banned' : user.isOnline ? 'Online' : 'Offline'}</div>
                                        <div><strong>Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</div>
                                        <div><strong>Joined:</strong> {formatDate(user.createdAt)}</div>
                                        {user.lastSeenAt && (
                                          <div><strong>Last Seen:</strong> {formatPreciseDate(user.lastSeenAt)} ({formatRelativeTime(user.lastSeenAt)})</div>
                                        )}
                                        {user.lastSignInAt && (
                                          <div><strong>Last Sign In:</strong> {formatDate(user.lastSignInAt)}</div>
                                        )}
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Credit Summary</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div><strong>Balance:</strong> {user.credits.hasUnlimitedAccess ? 'Unlimited' : user.credits.balance}</div>
                                        <div><strong>Total Purchased:</strong> {user.credits.totalPurchased}</div>
                                        <div><strong>Total Used:</strong> {user.credits.totalUsed}</div>
                                        <div><strong>Usage Count:</strong> {user.usageStats.totalUsage}</div>
                                        <div><strong>Success Rate:</strong> {user.usageStats.successRate.toFixed(1)}%</div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="credits" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Recent Transactions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        {user.recentTransactions.length > 0 ? (
                                          user.recentTransactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-2 border rounded">
                                              <div>
                                                <div className="font-medium">{tx.description}</div>
                                                <div className="text-sm text-muted-foreground">
                                                  {tx.type} • {tx.model || 'N/A'} • {formatDate(tx.createdAt)}
                                                </div>
                                              </div>
                                              <Badge variant={tx.amount > 0 ? 'default' : 'secondary'}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                              </Badge>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-muted-foreground">No recent transactions</p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="purchases" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Purchase History</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        {user.purchases.length > 0 ? (
                                          user.purchases.map((purchase) => (
                                            <div key={purchase.id} className="flex items-center justify-between p-2 border rounded">
                                              <div>
                                                <div className="font-medium">{purchase.credits} credits</div>
                                                <div className="text-sm text-muted-foreground">
                                                  {formatCurrency(purchase.amount, purchase.currency)} • {purchase.status} • {formatDate(purchase.createdAt)}
                                                </div>
                                              </div>
                                              <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                                                {purchase.status}
                                              </Badge>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-muted-foreground">No purchase history</p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="usage" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Usage Statistics</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div><strong>Total Usage:</strong> {user.usageStats.totalUsage}</div>
                                        <div><strong>Credits Used:</strong> {user.usageStats.totalCreditsUsed}</div>
                                        <div><strong>Success Count:</strong> {user.usageStats.successCount}</div>
                                        <div><strong>Failed Count:</strong> {user.usageStats.failedCount}</div>
                                        <div><strong>Success Rate:</strong> {user.usageStats.successRate.toFixed(1)}%</div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-sm">Feature Usage</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2">
                                          {user.featureUsage.length > 0 ? (
                                            user.featureUsage.map((usage, index) => (
                                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                  <div className="font-medium">{usage.feature}</div>
                                                  <div className="text-sm text-muted-foreground">{usage.model}</div>
                                                </div>
                                                <div className="text-right">
                                                  <div className="font-medium">{usage.count}</div>
                                                  <div className="text-sm text-muted-foreground">{usage.totalCredits} credits</div>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-muted-foreground">No feature usage</p>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                          {user.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'ban')}
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'activate')}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'delete')}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || filterRole !== 'all' 
                      ? 'No users match your filters.'
                      : 'No users found.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="billboard">
        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Billboard Video</CardTitle>
              <p className="text-sm text-muted-foreground">Upload to Cloudinary and publish on the landing page hero.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleUploadBillboard} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input
                    placeholder="e.g. Hero Spring Promo"
                    value={newBillboardTitle}
                    onChange={(e) => setNewBillboardTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Headline (overlaid on hero)</label>
                  <Input
                    placeholder="e.g. MiniMax H3 AI Video Generator"
                    value={newBillboardHeadline}
                    onChange={(e) => setNewBillboardHeadline(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Subheadline (under headline)</label>
                  <Input
                    placeholder="Short marketing copy visible on the main page."
                    value={newBillboardSubheadline}
                    onChange={(e) => setNewBillboardSubheadline(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Video file * (mp4/webm/mov)</label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setNewBillboardFile(f || null);
                    }}
                  />
                  {newBillboardFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(newBillboardFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBillboardSetActive}
                      onChange={(e) => setNewBillboardSetActive(e.target.checked)}
                      className="accent-primary"
                    />
                    Set active on landing page immediately
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBillboardSetDefault}
                      onChange={(e) => setNewBillboardSetDefault(e.target.checked)}
                      className="accent-primary"
                    />
                    Mark as default billboard
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploadingBillboard || !newBillboardFile || !newBillboardTitle.trim()}
                >
                  {uploadingBillboard ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Upload to Cloudinary
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg col-span-1 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold flex items-center gap-2"><Settings2 className="h-5 w-5" /> Hero Display Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose how billboards play on the landing page hero.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5">
                <label className="text-sm font-medium block">Display mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillboardSettings((s) => ({ ...s, displayMode: 'single' }))}
                    className={cn(
                      "relative rounded-xl border px-3 py-2.5 text-left transition-all",
                      billboardSettings.displayMode === 'single'
                        ? "border-primary bg-primary/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                        : "border-border hover:border-primary/40 hover:bg-accent/40"
                    )}
                  >
                    <p className="text-[13px] font-semibold">Single Billboard</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Plays only the active + default hero video on loop.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillboardSettings((s) => ({ ...s, displayMode: 'rotate' }))}
                    className={cn(
                      "relative rounded-xl border px-3 py-2.5 text-left transition-all",
                      billboardSettings.displayMode === 'rotate'
                        ? "border-primary bg-primary/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                        : "border-border hover:border-primary/40 hover:bg-accent/40"
                    )}
                  >
                    <p className="text-[13px] font-semibold">Auto-Rotate Playlist</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Cycles all active billboards when each video ends.</p>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium leading-tight">Restart automatically</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Loop the playlist after the last billboard ends.</p>
                </div>
                <Switch
                  checked={billboardSettings.autoLoop}
                  onCheckedChange={(c) => setBillboardSettings((s) => ({ ...s, autoLoop: !!c }))}
                  disabled={billboardSettings.displayMode !== 'rotate'}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Crossfade</label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {billboardSettings.crossfadeMs} ms
                  </span>
                </div>
                <Slider
                  disabled={billboardSettings.displayMode !== 'rotate'}
                  min={0}
                  max={2000}
                  step={50}
                  value={[billboardSettings.crossfadeMs]}
                  onValueChange={(v) => setBillboardSettings((s) => ({ ...s, crossfadeMs: Number(v?.[0] ?? 450) }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Background Lighting</label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {billboardSettings.backgroundLighting}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[billboardSettings.backgroundLighting]}
                  onValueChange={(v) => setBillboardSettings((s) => ({ ...s, backgroundLighting: Number(v?.[0] ?? 55) }))}
                  className="w-full"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Lower values darken the hero video more on the edges (more vignette); higher values brighten it (closer to the original raw video brightness).
                </p>
              </div>

              <Button className="w-full" onClick={saveHeroSettings} disabled={savingSettings}>
                <Save className={`h-4 w-4 ${savingSettings ? 'animate-spin' : ''}`} />
                {savingSettings ? 'Saving…' : 'Save Hero Display Settings'}
              </Button>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {billboardSettings.displayMode === 'single'
                  ? 'Single mode: activating a billboard will automatically deactivate all others so exactly one is visible on the landing page.'
                  : 'Rotate mode: activate multiple billboards — they play sequentially by display order on the landing page, with a fade between each video. Default is still the starting video.'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2"><Film className="h-5 w-5" /> Billboard Library</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {billboardSettings.displayMode === 'single'
                    ? 'Only one billboard can be active at a time. The active & default billboard plays on the landing page.'
                    : `All active billboards play in sequence on the landing page (${billboards.filter(b => b.isActive).length} in playlist, order by display order).`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadBillboards} disabled={billboardLoading}>
                <RefreshCw className={`h-4 w-4 ${billboardLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {billboardLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
              ) : billboards.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No billboards uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 -mx-2 px-2">
                  {billboards.map((b) => {
                    const isEditing = editingBillboardId === b.id;
                    const isSaving = savingBillboardId === b.id;
                    const isDeleting = deletingBillboardId === b.id;
                    return (
                      <div
                        key={b.id}
                        data-active={b.isActive}
                        data-editing={isEditing}
                        className={cn(
                          "w-full max-w-full rounded-xl border p-4 transition-all overflow-hidden",
                          b.isActive && !isEditing
                            ? "bg-primary/5 border-primary/25 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]"
                            : "bg-card/40 border-border",
                          isEditing && "bg-amber-50/40 dark:bg-amber-950/10 border-amber-400/40"
                        )}
                      >
                        <div className="grid w-full max-w-full grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,360px)] gap-4 items-start">
                          {/* LEFT: status badges + meta */}
                          <div className="flex flex-col gap-2 min-w-0">
                            <div className="flex flex-wrap gap-1.5">
                              {b.isActive ? (
                                <Badge className="gap-1"><Star className="h-3 w-3" /> Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground gap-1">
                                  <Clock className="h-3 w-3" /> Inactive
                                </Badge>
                              )}
                              {b.isDefault && (
                                <Badge variant="secondary" className="gap-1"><Settings2 className="h-3 w-3" /> Default</Badge>
                              )}
                              <Badge variant="outline" className="font-mono gap-1 text-[10px] md:text-[11px]">
                                #{b.displayOrder ?? 0}
                              </Badge>
                              {b.durationSeconds ? (
                                <Badge variant="outline" className="text-[10px] md:text-[11px]">{b.durationSeconds}s</Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <span className="tabular-nums">{formatDate(b.createdAt)}</span>
                              {b.uploadedByAdminEmail ? (
                                <> · {b.uploadedByAdminEmail.split('@')[0]}</>
                              ) : null}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                              ID: <code className="bg-muted px-1 rounded">{b.cloudinaryPublicId.slice(-18) || b.cloudinaryPublicId}</code>
                            </p>
                          </div>

                          {/* MIDDLE: title + headline + sub (read or edit) */}
                          <div className="min-w-0 space-y-2.5">
                            {isEditing ? (
                              <div className="space-y-2 w-full">
                                <Input
                                  value={editDraft.title}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                                  className="font-semibold h-auto py-1.5 border-amber-400/60 focus-visible:ring-amber-400"
                                  autoFocus
                                />
                                <Input
                                  value={editDraft.headline}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, headline: e.target.value }))}
                                  placeholder="Hero headline (shown large on landing page)"
                                />
                                <Input
                                  value={editDraft.subheadline}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, subheadline: e.target.value }))}
                                  placeholder="Short supporting text below headline"
                                />
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-muted-foreground">Display order</label>
                                    <Input
                                      type="number"
                                      value={editDraft.displayOrder}
                                      onChange={(e) => setEditDraft((d) => ({ ...d, displayOrder: Number(e.target.value) || 0 }))}
                                      className="w-20 h-8 py-1 text-center"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[220px] space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-medium text-muted-foreground">Lighting override</label>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-muted-foreground tabular-nums">
                                          {editDraft.lightingOverride === null ? 'Use global' : `${editDraft.lightingOverride}%`}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={editDraft.lightingOverride === null}
                                          onClick={() => setEditDraft((d) => ({ ...d, lightingOverride: null }))}
                                        >
                                          Reset
                                        </Button>
                                      </div>
                                    </div>
                                    <Slider
                                      min={0}
                                      max={100}
                                      step={1}
                                      value={[editDraft.lightingOverride === null ? billboardSettings.backgroundLighting : editDraft.lightingOverride]}
                                      onValueChange={(v) => setEditDraft((d) => ({ ...d, lightingOverride: Number(v?.[0] ?? d.lightingOverride ?? billboardSettings.backgroundLighting) }))}
                                      className="w-full"
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                      Overrides the global Background Lighting setting only for this billboard.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="min-w-0 space-y-1.5">
                                <p className="font-semibold text-sm leading-tight truncate">
                                  {b.title || <span className="text-muted-foreground italic">Untitled billboard</span>}
                                </p>
                                <p className="text-[13px] font-medium leading-snug line-clamp-2">
                                  {(b.headline as any) ? (b.headline as any) : <span className="text-muted-foreground italic">No headline set</span>}
                                </p>
                                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                                  {(b.subheadline as any) ? (b.subheadline as any) : <span className="italic">No subheadline</span>}
                                </p>
                                {b.lightingOverride !== null && b.lightingOverride !== undefined && Number.isFinite(Number(b.lightingOverride)) ? (
                                  <p className="text-[11px] text-amber-400/80 font-medium">
                                    ✦ Lighting override: {b.lightingOverride}%
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {/* RIGHT: actions (always fully visible) */}
                          <div className="w-full md:w-auto min-w-0 flex flex-col items-end justify-end gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-wrap justify-end w-full md:w-auto">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => saveBillboardEdit(b.id)}
                                  disabled={isSaving}
                                  className="shrink-0"
                                >
                                  <Save className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                                  {isSaving ? 'Saving…' : 'Save'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelBillboardEdit}
                                  disabled={isSaving}
                                  className="shrink-0"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" /> Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-5 gap-1.5 w-full md:w-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startBillboardEdit(b)}
                                  className="shrink-0 justify-center"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                                </Button>
                                {!b.isActive ? (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => billboardAction(b.id, 'activate')}
                                    className="shrink-0 justify-center"
                                  >
                                    <Star className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Activate</span>
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => billboardAction(b.id, 'deactivate')}
                                    className="shrink-0 justify-center"
                                  >
                                    <X className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Deactivate</span>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant={b.isDefault ? 'secondary' : 'outline'}
                                  onClick={() => billboardAction(b.id, 'default')}
                                  className="shrink-0 justify-center"
                                >
                                  <Settings2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Default</span>
                                </Button>
                                <Dialog
                                  open={deleteConfirmId === b.id}
                                  onOpenChange={(o) => { if (!o && deleteConfirmId === b.id) setDeleteConfirmId(null); }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeleteConfirmId(b.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0 justify-center col-span-2 sm:col-span-2 md:col-span-2 xl:col-span-2"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                      <span className="hidden sm:inline truncate max-w-[90px]">Delete</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Delete this billboard?</DialogTitle>
                                      <DialogDescription>
                                        This will permanently remove the row from the library and delete the hosted video from Cloudinary. This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDeleteConfirmId(null)}
                                        disabled={isDeleting}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={isDeleting}
                                        onClick={() => confirmDeleteBillboard(b.id)}
                                      >
                                        <Trash2 className={`h-3.5 w-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                                        {isDeleting ? 'Deleting…' : 'Yes, delete billboard'}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="features">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3 flex-col sm:flex-row">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2"><Clapperboard className="h-5 w-5" /> Homepage Features</CardTitle>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Add, edit, reorder and remove the feature cards shown on the homepage. Each card can optionally play a video instead of an icon. Changes appear on the homepage automatically.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadFeatureVideos} disabled={featureLoading}>
                <RefreshCw className={`h-4 w-4 ${featureLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" onClick={() => setAddingFeature((v) => !v)}>
                <Plus className="h-4 w-4" /> Add feature
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {addingFeature && (
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-semibold">New feature</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Feature title (e.g. AI Video Generation)"
                    value={newFeatureTitle}
                    onChange={(e) => setNewFeatureTitle(e.target.value)}
                  />
                  <select
                    value={newFeatureIcon}
                    onChange={(e) => setNewFeatureIcon(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {FEATURE_ICON_NAMES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <Input
                  placeholder="Short description (shown under the title on the homepage)"
                  value={newFeatureDescription}
                  onChange={(e) => setNewFeatureDescription(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">You can upload a video after creating the feature.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAddingFeature(false)}>Cancel</Button>
                    <Button size="sm" onClick={addNewFeature} disabled={addingFeature || !newFeatureTitle.trim()}>
                      {addingFeature ? 'Adding…' : 'Add feature'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {features.length === 0 && !addingFeature ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                <p className="text-sm">No features yet. Click <span className="font-medium text-foreground">Add feature</span> to create your first homepage feature card.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((f, idx) => {
                  const isBusy = featureBusyId === f.id;
                  const isEditing = editingFeatureId === f.id;
                  const iconList = featureIcons.length ? featureIcons : [...FEATURE_ICON_NAMES];
                  return (
                    <div key={f.id} className="rounded-xl border p-4 bg-card/40 flex flex-col gap-3 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FeatureIcon name={f.icon} className="h-5 w-5 text-primary shrink-0" />
                          {isEditing ? (
                            <Input
                              value={featureEditDraft.title}
                              onChange={(e) => setFeatureEditDraft((d) => ({ ...d, title: e.target.value }))}
                              className="h-8 py-1 text-sm font-semibold"
                            />
                          ) : (
                            <p className="font-semibold text-sm truncate">{f.title}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveFeature(f.id, -1)} disabled={idx === 0 || isBusy}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveFeature(f.id, 1)} disabled={idx === features.length - 1 || isBusy}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <select
                            value={featureEditDraft.icon}
                            onChange={(e) => setFeatureEditDraft((d) => ({ ...d, icon: e.target.value }))}
                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {iconList.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <textarea
                            value={featureEditDraft.description}
                            onChange={(e) => setFeatureEditDraft((d) => ({ ...d, description: e.target.value }))}
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={cancelFeatureEdit} disabled={isBusy}>Cancel</Button>
                            <Button size="sm" onClick={() => saveFeatureEdit(f.id)} disabled={isBusy || !featureEditDraft.title.trim()}>
                              <Save className="h-3.5 w-3.5" /> Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                          {f.description || <span className="italic">No description</span>}
                        </p>
                      )}

                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/40 border">
                        {f.videoUrl ? (
                          <video
                            key={f.videoUrl}
                            src={f.videoUrl}
                            poster={f.posterUrl || undefined}
                            muted
                            loop
                            playsInline
                            autoPlay
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                            <FeatureIcon name={f.icon} className="h-8 w-8 opacity-40" />
                            <p className="text-[11px]">No video</p>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 flex gap-1.5 flex-wrap justify-end">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="hidden"
                              disabled={isBusy}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void uploadFeatureVideo(f.id, file);
                                e.target.value = '';
                              }}
                            />
                            <span className="inline-flex items-center gap-1 rounded-md bg-black/70 hover:bg-black/85 text-white text-[11px] px-2 py-1 transition-colors">
                              <Upload className="h-3 w-3" /> {f.videoUrl ? (isBusy ? '…' : 'Replace') : (isBusy ? '…' : 'Upload')}
                            </span>
                          </label>
                          {f.videoUrl && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void removeFeatureVideo(f.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-600/85 hover:bg-amber-700 text-white text-[11px] px-2 py-1 transition-colors disabled:opacity-50"
                            >
                              <X className="h-3 w-3" /> Remove video
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-muted-foreground truncate">
                          {f.videoUrl && f.durationSeconds
                            ? `${Math.floor(f.durationSeconds / 60)}:${String(f.durationSeconds % 60).padStart(2, '0')} • `
                            : ''}
                          Updated {new Date(f.updatedAt).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isEditing && (
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => startFeatureEdit(f)} disabled={isBusy}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => void deleteFeature(f.id)} disabled={isBusy}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 