"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ImagePlus,
  Wand2,
  Coins,
  ArrowUp,
  Smartphone,
  Monitor,
  Square,
  Sparkles,
  ChevronDown,
  Film,
  Camera,
  Check,
  Gauge,
  RectangleHorizontal,
  RectangleVertical,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type BillboardVideo = {
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
  displayOrder: number;
  durationSeconds?: number | null;
  lightingOverride?: number | null;
  createdAt: string;
};

type BillboardSettings = {
  displayMode: 'single' | 'rotate';
  autoLoop: boolean;
  crossfadeMs: number;
  backgroundLighting: number;
};

const FALLBACK = {
  headline: "MiniMax H3 AI Video Generator",
  subheadline:
    "AISNV delivers high-speed, cost-efficient image and video generation with realistic visuals and synchronized audio — powered by MiniMax H3. Try it for free.",
  videoUrl: undefined as string | undefined,
  posterUrl: undefined as string | undefined,
};

type ModelDef = {
  id: string;
  label: string;
  credits: number;
  category: "Video" | "Image" | "Animation";
  tagline?: string;
};

const MODELS: ModelDef[] = [
  {
    id: "comfyui-minimax",
    label: "MiniMax H3",
    credits: 40,
    category: "Video",
    tagline: "Photo-real video + synchronized audio",
  },
  {
    id: "comfyui-minimax-h3-fast",
    label: "MiniMax H3 Fast",
    credits: 20,
    category: "Video",
    tagline: "2× faster, slightly lower fidelity",
  },
  {
    id: "comfyui-veo3-fast",
    label: "Veo 3 Fast",
    credits: 60,
    category: "Video",
    tagline: "Cinematic motion & long-shot scenes",
  },
  {
    id: "comfyui-auraimage",
    label: "AuraImage Turbo",
    credits: 10,
    category: "Image",
    tagline: "High-quality still image generation",
  },
  {
    id: "comfyui-lipsync",
    label: "MiniMax LipSync",
    credits: 50,
    category: "Animation",
    tagline: "Talking portrait from audio + face",
  },
  {
    id: "comfyui-sdxl-studio",
    label: "SDXL Studio",
    credits: 8,
    category: "Image",
    tagline: "Classic SDXL with LoRAs",
  },
];

type ResolutionDef = {
  value: string;
  aspect: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9";
  width: number;
  height: number;
  label: string;
  groupLabel: "Landscape" | "Portrait" | "Square" | "Cinematic";
  icon: "monitor" | "phone" | "square" | "ultrawide";
};

const RESOLUTIONS: ResolutionDef[] = [
  { value: "16:9:720p",  aspect: "16:9", width: 1280, height: 720,  label: "16:9 · 720p",  groupLabel: "Landscape", icon: "monitor" },
  { value: "16:9:1080p", aspect: "16:9", width: 1920, height: 1080, label: "16:9 · 1080p", groupLabel: "Landscape", icon: "monitor" },
  { value: "16:9:4k",    aspect: "16:9", width: 3840, height: 2160, label: "16:9 · 4K",    groupLabel: "Landscape", icon: "monitor" },
  { value: "4:3:1024",   aspect: "4:3",  width: 1024, height: 768,  label: "4:3 · 1024",   groupLabel: "Landscape", icon: "monitor" },

  { value: "9:16:720p",  aspect: "9:16", width: 720,  height: 1280, label: "9:16 · 720p",  groupLabel: "Portrait",  icon: "phone" },
  { value: "9:16:1080p", aspect: "9:16", width: 1080, height: 1920, label: "9:16 · 1080p", groupLabel: "Portrait",  icon: "phone" },
  { value: "9:16:4k",    aspect: "9:16", width: 2160, height: 3840, label: "9:16 · 4K",    groupLabel: "Portrait",  icon: "phone" },
  { value: "3:4:1024",   aspect: "3:4",  width: 768,  height: 1024, label: "3:4 · 1024",   groupLabel: "Portrait",  icon: "phone" },

  { value: "1:1:768",    aspect: "1:1",  width: 768,  height: 768,  label: "1:1 · 768",    groupLabel: "Square",    icon: "square" },
  { value: "1:1:1024",   aspect: "1:1",  width: 1024, height: 1024, label: "1:1 · 1024",   groupLabel: "Square",    icon: "square" },
  { value: "1:1:2048",   aspect: "1:1",  width: 2048, height: 2048, label: "1:1 · 2K",     groupLabel: "Square",    icon: "square" },

  { value: "21:9:1080p", aspect: "21:9", width: 2560, height: 1080, label: "21:9 · 1080p", groupLabel: "Cinematic", icon: "ultrawide" },
  { value: "21:9:4k",    aspect: "21:9", width: 5120, height: 2160, label: "21:9 · 4K",    groupLabel: "Cinematic", icon: "ultrawide" },
];

const RESOLUTION_ICON_CLASSES = {
  monitor: "text-emerald-300",
  phone: "text-sky-300",
  square: "text-fuchsia-300",
  ultrawide: "text-amber-300",
} as const;

export default function BillboardHero() {
  const router = useRouter();
  const [billboard, setBillboard] = useState<BillboardVideo | null>(null);
  const [playlist, setPlaylist] = useState<BillboardVideo[]>([]);
  const [settings, setSettings] = useState<BillboardSettings>({ displayMode: 'single', autoLoop: true, crossfadeMs: 450, backgroundLighting: 55 });
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const [resolutionKey, setResolutionKey] = useState<string>(RESOLUTIONS[0].value);

  const [modelOpen, setModelOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);

  const refreshBillboard = async () => {
    try {
      const r = await fetch("/api/billboard", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setBillboard(d.billboard || null);
      const list: BillboardVideo[] = Array.isArray(d.playlist) && d.playlist.length ? d.playlist : (d.billboard ? [d.billboard] : []);
      setPlaylist((prev) => {
        const sameIds = prev.length === list.length && prev.every((p, i) => list[i] && p.id === list[i].id);
        if (sameIds) return prev;
        if (settings.displayMode !== 'rotate') return list;
        setPlaylistIndex(0);
        return list;
      });
      if (d.settings && typeof d.settings === 'object') {
        setSettings({
          displayMode: d.settings.displayMode === 'rotate' ? 'rotate' : 'single',
          autoLoop: typeof d.settings.autoLoop === 'boolean' ? d.settings.autoLoop : true,
          crossfadeMs: Number.isFinite(d.settings.crossfadeMs) ? Math.max(0, Math.min(5000, Number(d.settings.crossfadeMs))) : 450,
          backgroundLighting: Number.isFinite(d.settings.backgroundLighting) ? Math.max(0, Math.min(100, Number(d.settings.backgroundLighting))) : 55,
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    let alive = true;
    refreshBillboard()
      .then(() => alive && setLoading(false))
      .catch(() => alive && setLoading(false));

    let visibleLast = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
    let lastPoll = Date.now();

    const POLL_INTERVAL_MS = 8000;
    const VISIBLE_BACKOFF_MS = 500;

    const tick = () => {
      if (!alive) return;
      const now = Date.now();
      const visible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
      if (visible !== visibleLast) {
        visibleLast = visible;
        if (visible) void refreshBillboard();
      }
      if (visible && now - lastPoll >= POLL_INTERVAL_MS) {
        lastPoll = now;
        void refreshBillboard();
      }
    };
    const id = window.setInterval(tick, VISIBLE_BACKOFF_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const current =
    settings.displayMode === 'rotate' && playlist.length
      ? playlist[playlistIndex % playlist.length] || billboard || null
      : billboard || playlist[0] || null;

  const headline = current?.headline || FALLBACK.headline;
  const subheadline = current?.subheadline || FALLBACK.subheadline;
  const videoSrc = current?.videoUrl || FALLBACK.videoUrl;
  const posterSrc = current?.posterUrl || current?.thumbnailUrl || undefined;

  const lightingRaw =
    current && current.lightingOverride !== null && current.lightingOverride !== undefined && Number.isFinite(Number(current.lightingOverride))
      ? Number(current.lightingOverride)
      : Number.isFinite(settings.backgroundLighting)
        ? settings.backgroundLighting
        : 55;
  const lighting = Math.max(0, Math.min(100, lightingRaw));
  const lightingT = lighting / 100; // 0 = fully darkened; 1 = fully bright (min dark overlay)
  const bottomDark = Math.max(0.02, 1 - lightingT * 0.95); // from 1.0 → 0.05
  const middleDark = Math.max(0.01, 0.55 - lightingT * 0.54); // 0.55 → 0.01
  const topDark = Math.max(0.0, 0.15 - lightingT * 0.15); // 0.15 → 0
  const leftEdgeDark = Math.max(0.0, 0.7 - lightingT * 0.7); // 0.7 → 0
  const rightEdgeDark = Math.max(0.0, 0.55 - lightingT * 0.55); // 0.55 → 0
  const vignetteDark = Math.max(0.0, 0.85 - lightingT * 0.85); // heavy vignette edges to none when bright
  const videoBrightness = 0.78 + lightingT * 0.30; // 0.78 → 1.08 (gentle brightness lift on video itself to fix "too dark")
  const videoContrast = 0.98 + lightingT * 0.08; // slight contrast boost at max brightness

  const handleVideoEnded = () => {
    if (settings.displayMode !== 'rotate' || playlist.length <= 1) return;
    const nextIndex = playlistIndex + 1;
    if (nextIndex >= playlist.length) {
      if (!settings.autoLoop) return;
      setTransitioning(true);
      window.setTimeout(() => {
        setPlaylistIndex(0);
        window.setTimeout(() => setTransitioning(false), Math.max(120, settings.crossfadeMs));
      }, Math.max(80, Math.round(settings.crossfadeMs * 0.4)));
      return;
    }
    setTransitioning(true);
    window.setTimeout(() => {
      setPlaylistIndex(nextIndex);
      window.setTimeout(() => setTransitioning(false), Math.max(120, settings.crossfadeMs));
    }, Math.max(80, Math.round(settings.crossfadeMs * 0.4)));
  };

  const selectedModel = useMemo(
    () => MODELS.find((m) => m.id === modelId) || MODELS[0],
    [modelId]
  );
  const selectedResolution = useMemo(
    () => RESOLUTIONS.find((r) => r.value === resolutionKey) || RESOLUTIONS[0],
    [resolutionKey]
  );

  const startGenerating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: "Describe your idea",
        description: "Write a short prompt to get started.",
        variant: "default",
      });
    }
    const qs = new URLSearchParams();
    if (prompt.trim()) qs.set("prompt", prompt.trim());
    qs.set("model", modelId);
    qs.set("aspect", selectedResolution.aspect);
    qs.set("width", String(selectedResolution.width));
    qs.set("height", String(selectedResolution.height));
    qs.set("resolution", selectedResolution.value);
    router.push(`/studio/video-generator?${qs.toString()}`);
  };

  const groupedResolutions = useMemo(() => {
    const order: ResolutionDef["groupLabel"][] = ["Landscape", "Portrait", "Square", "Cinematic"];
    return order
      .map((g) => ({
        group: g,
        items: RESOLUTIONS.filter((r) => r.groupLabel === g),
      }))
      .filter((g) => g.items.length > 0);
  }, []);

  const groupedModels = useMemo(() => {
    const order: ModelDef["category"][] = ["Video", "Image", "Animation"];
    return order
      .map((c) => ({
        category: c,
        items: MODELS.filter((m) => m.category === c),
      }))
      .filter((g) => g.items.length > 0);
  }, []);

  const videoLoopAttr = settings.displayMode === 'rotate' ? false : true;

  return (
    <section className="relative w-screen max-w-none min-h-[100svh] flex items-end overflow-hidden m-0 p-0 bg-[#0a0a0f]">
      <div className="absolute inset-0 -z-0 w-screen h-full m-0 p-0">
        {/* Gradient fallback layer — visible when no video loads */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(249,115,22,0.18) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(56,189,248,0.12) 0%, transparent 50%), linear-gradient(135deg, #0a0a0f 0%, #13111c 45%, #0a0a0f 100%)',
          }}
        />
        {!loading || videoSrc ? (
          <video
            key={`${videoSrc}-${videoLoopAttr ? 'loop' : 'seq'}`}
            autoPlay
            muted
            loop={videoLoopAttr}
            playsInline
            poster={posterSrc}
            onEnded={handleVideoEnded}
            className={cn(
              "absolute inset-0 w-screen h-full m-0 p-0 object-cover transition-opacity will-change-[filter,opacity]",
              transitioning ? "opacity-30" : "opacity-100"
            )}
            style={{
              transitionDuration: `${Math.max(120, settings.crossfadeMs)}ms`,
              filter: `brightness(${videoBrightness.toFixed(3)}) contrast(${videoContrast.toFixed(3)})`,
            }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : null}
        {transitioning ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-black/60 pointer-events-none"
            style={{ transition: `opacity ${Math.max(120, settings.crossfadeMs)}ms` }}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,${bottomDark.toFixed(3)}) 0%, rgba(0,0,0,${middleDark.toFixed(3)}) 45%, rgba(0,0,0,${topDark.toFixed(3)}) 100%)`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,${leftEdgeDark.toFixed(3)}) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,${rightEdgeDark.toFixed(3)}) 100%)`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none mix-blend-multiply"
          style={{
            background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,${(vignetteDark * 0.45).toFixed(3)}) 65%, rgba(0,0,0,${vignetteDark.toFixed(3)}) 100%)`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,${Math.max(0.35, bottomDark).toFixed(3)}) 0%, rgba(0,0,0,0) 100%)`,
          }}
        />
      </div>

      <div className="absolute inset-x-0 top-0 h-14 pointer-events-none" />

      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-14 md:pb-20 lg:pb-28 pt-28 sm:pt-32 md:pt-40">
        <div className="max-w-7xl mx-auto text-white space-y-5 md:space-y-6 text-center">
          <h1 className="font-headline font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[88px] drop-shadow-[0_10px_34px_rgba(0,0,0,0.6)]">
            {headline}
          </h1>
          <p className="max-w-5xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-white/85 leading-relaxed drop-shadow">
            {subheadline}
          </p>

          <form
            onSubmit={startGenerating}
            className="mx-auto mt-2 md:mt-4 max-w-6xl w-full bg-black/40 backdrop-blur-2xl border border-white/12 rounded-[28px] p-2.5 md:p-3 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.85)]"
          >
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch gap-2.5 md:gap-3">
              {/* LEFT: prompt input */}
              <div className="flex items-stretch gap-2.5 md:gap-3 flex-1 min-w-0">
                <div className="shrink-0 w-12 md:w-14 h-12 md:h-[64px] rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.22),0_10px_26px_-8px_rgba(249,115,22,0.6)]">
                  <Wand2 className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0 py-1.5 md:py-1">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your idea to create."
                    className="h-auto min-h-[40px] md:min-h-[44px] bg-transparent border-0 text-white placeholder:text-white/45 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 md:px-2 text-base md:text-lg shadow-none rounded-none"
                  />
                  <div className="flex gap-2 items-center px-1 md:px-2 pt-1.5 md:pt-2 text-[11px] md:text-xs text-white/60">
                    <button
                      type="button"
                      onClick={() =>
                        toast({
                          title: "Reference images",
                          description: "Upload a reference in the Video Generator.",
                          variant: "default",
                        })
                      }
                      className="inline-flex items-center gap-1 hover:text-white/90 transition"
                    >
                      <ImagePlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span>+ Image</span>
                    </button>
                    <span className="opacity-50">·</span>
                    <span className="opacity-85">Optional</span>
                  </div>
                </div>
              </div>

              {/* SEPARATOR */}
              <div className="md:w-px h-auto md:h-[64px] bg-white/10 rounded-full" />

              {/* RIGHT: compact chips (dropdown + dropdown + coin + submit) */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-2.5 py-1 md:py-0 md:pr-1.5 text-white/80 w-full md:w-auto">
                {/* ============ MODEL DROPDOWN CHIP ============ */}
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "group inline-flex items-center gap-2 h-9 md:h-10 px-3 md:px-3.5 rounded-2xl",
                        "bg-white/5 border border-white/12 text-white",
                        "hover:bg-white/10 hover:border-white/22",
                        "transition-all duration-150",
                        "data-[state=open]:bg-white/10 data-[state=open]:border-white/25",
                        "active:scale-[0.99]"
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-300 shrink-0" />
                      <span className="text-[13px] md:text-sm font-medium leading-none max-w-[120px] md:max-w-[140px] truncate">
                        {selectedModel.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] md:text-[11px] text-yellow-300/95 bg-yellow-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                        <Coins className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        {selectedModel.credits}
                      </span>
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 md:w-4 md:h-4 text-white/55 shrink-0 transition-transform",
                        modelOpen && "rotate-180 text-white/85"
                      )} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="w-[min(90vw,310px)] p-1.5 rounded-[22px] border border-white/10 bg-black/85 backdrop-blur-2xl text-white shadow-[0_20px_60px_-16px_rgba(0,0,0,0.9)]"
                  >
                    <div
                      className="max-h-[420px] overflow-y-auto py-0.5 pr-1.5 mr-[-6px]"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255,255,255,0.18) rgba(255,255,255,0.04)",
                      }}
                    >
                      <style>{`
                        .billboard-scroll::-webkit-scrollbar {
                          width: 6px;
                          height: 6px;
                        }
                        .billboard-scroll::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        .billboard-scroll::-webkit-scrollbar-thumb {
                          background-color: rgba(255,255,255,0.18);
                          border-radius: 9999px;
                          border: none;
                        }
                        .billboard-scroll::-webkit-scrollbar-thumb:hover {
                          background-color: rgba(255,255,255,0.32);
                        }
                      `}</style>
                      <div className="billboard-scroll">
                      {groupedModels.map((g, gi) => (
                        <div key={g.category} className="mb-1 last:mb-0">
                          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                            {g.category === "Video" && <Film className="w-3 h-3" />}
                            {g.category === "Image" && <Camera className="w-3 h-3" />}
                            {g.category === "Animation" && <Gauge className="w-3 h-3" />}
                            {g.category}
                          </div>
                          <div className="space-y-0.5">
                            {g.items.map((m) => {
                              const active = m.id === modelId;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => { setModelId(m.id); setModelOpen(false); }}
                                  className={cn(
                                    "w-full text-left rounded-xl px-2 py-1.75 flex items-start gap-2 transition-all",
                                    "relative overflow-hidden",
                                    active
                                      ? "bg-white/8"
                                      : "hover:bg-white/6"
                                  )}
                                >
                                  {active && (
                                    <span
                                      aria-hidden
                                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-orange-400 to-amber-300"
                                    />
                                  )}
                                  <div className="ml-0.5 shrink-0 w-3.5 h-3.5 flex items-center justify-center mt-0.5">
                                    {active ? (
                                      <Check className="w-3.5 h-3.5 text-orange-300" strokeWidth={2.5} />
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={cn("truncate text-[13px] font-medium", active ? "text-white" : "text-white/88")}>
                                        {m.label}
                                      </span>
                                      <span className="inline-flex items-center gap-1 shrink-0 text-[10.5px] text-yellow-300/95 bg-yellow-500/10 px-1.5 py-[2px] rounded-full">
                                        <Coins className="w-2.5 h-2.5" />
                                        {m.credits}
                                      </span>
                                    </div>
                                    {m.tagline ? (
                                      <p className="text-[11px] leading-snug text-white/48 mt-0.5 truncate">
                                        {m.tagline}
                                      </p>
                                    ) : null}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {gi < groupedModels.length - 1 ? (
                            <div className="h-px bg-white/7 my-1 mx-1" />
                          ) : null}
                        </div>
                      ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* ============ RESOLUTION DROPDOWN CHIP ============ */}
                <Popover open={resolutionOpen} onOpenChange={setResolutionOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "group inline-flex items-center gap-2 h-9 md:h-10 px-3 md:px-3.5 rounded-2xl",
                        "bg-white/5 border border-white/12 text-white",
                        "hover:bg-white/10 hover:border-white/22",
                        "transition-all duration-150",
                        "data-[state=open]:bg-white/10 data-[state=open]:border-white/25",
                        "active:scale-[0.99]"
                      )}
                    >
                      {selectedResolution.icon === "monitor" && (
                        <Monitor className={cn("w-3.5 h-3.5 md:w-4 md:h-4 shrink-0", RESOLUTION_ICON_CLASSES.monitor)} />
                      )}
                      {selectedResolution.icon === "phone" && (
                        <Smartphone className={cn("w-3.5 h-3.5 md:w-4 md:h-4 shrink-0", RESOLUTION_ICON_CLASSES.phone)} />
                      )}
                      {selectedResolution.icon === "square" && (
                        <Square className={cn("w-3.5 h-3.5 md:w-4 md:h-4 shrink-0", RESOLUTION_ICON_CLASSES.square)} />
                      )}
                      {selectedResolution.icon === "ultrawide" && (
                        <RectangleHorizontal className={cn("w-3.5 h-3.5 md:w-4 md:h-4 shrink-0", RESOLUTION_ICON_CLASSES.ultrawide)} />
                      )}
                      <span className="text-[13px] md:text-sm font-medium leading-none whitespace-nowrap">
                        {selectedResolution.label}
                      </span>
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 md:w-4 md:h-4 text-white/55 shrink-0 transition-transform",
                        resolutionOpen && "rotate-180 text-white/85"
                      )} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="w-[min(90vw,310px)] p-1.5 rounded-[22px] border border-white/10 bg-black/85 backdrop-blur-2xl text-white shadow-[0_20px_60px_-16px_rgba(0,0,0,0.9)]"
                  >
                    <div
                      className="max-h-[480px] overflow-y-auto py-0.5 pr-1.5 mr-[-6px]"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255,255,255,0.18) rgba(255,255,255,0.04)",
                      }}
                    >
                      <style>{`
                        .billboard-scroll::-webkit-scrollbar {
                          width: 6px;
                          height: 6px;
                        }
                        .billboard-scroll::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        .billboard-scroll::-webkit-scrollbar-thumb {
                          background-color: rgba(255,255,255,0.18);
                          border-radius: 9999px;
                          border: none;
                        }
                        .billboard-scroll::-webkit-scrollbar-thumb:hover {
                          background-color: rgba(255,255,255,0.32);
                        }
                      `}</style>
                      <div className="billboard-scroll">
                      {groupedResolutions.map((g, gi) => (
                        <div key={g.group} className="mb-1 last:mb-0">
                          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                            {g.group === "Landscape" && (<><RectangleHorizontal className="w-3 h-3" /> Landscape</>)}
                            {g.group === "Portrait" && (<><RectangleVertical className="w-3 h-3" /> Portrait</>)}
                            {g.group === "Square" && (<><Square className="w-3 h-3" /> Square</>)}
                            {g.group === "Cinematic" && (<><Film className="w-3 h-3" /> Cinematic</>)}
                          </div>
                          <div className="space-y-0.5">
                            {g.items.map((r) => {
                              const active = r.value === resolutionKey;
                              return (
                                <button
                                  key={r.value}
                                  type="button"
                                  onClick={() => { setResolutionKey(r.value); setResolutionOpen(false); }}
                                  className={cn(
                                    "w-full text-left rounded-xl px-2 py-1.75 flex items-center gap-2 transition-all relative overflow-hidden",
                                    active
                                      ? "bg-white/8"
                                      : "hover:bg-white/6"
                                  )}
                                >
                                  {active && (
                                    <span
                                      aria-hidden
                                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-orange-400 to-amber-300"
                                    />
                                  )}
                                  <div className="shrink-0 w-3.5 h-3.5 flex items-center justify-center ml-0.5">
                                    {active ? (
                                      <Check className="w-3.5 h-3.5 text-orange-300" strokeWidth={2.5} />
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {r.icon === "monitor" && <Monitor className={cn("w-4 h-4", RESOLUTION_ICON_CLASSES.monitor)} />}
                                    {r.icon === "phone" && <Smartphone className={cn("w-4 h-4", RESOLUTION_ICON_CLASSES.phone)} />}
                                    {r.icon === "square" && <Square className={cn("w-4 h-4", RESOLUTION_ICON_CLASSES.square)} />}
                                    {r.icon === "ultrawide" && <RectangleHorizontal className={cn("w-4 h-4", RESOLUTION_ICON_CLASSES.ultrawide)} />}
                                    <span className={cn("text-[13px] font-medium", active ? "text-white" : "text-white/88")}>
                                      {r.label}
                                    </span>
                                  </div>
                                  <span className="ml-auto text-[10.5px] tabular-nums text-white/45 shrink-0">
                                    {r.width}×{r.height}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {gi < groupedResolutions.length - 1 ? (
                            <div className="h-px bg-white/7 my-1 mx-1" />
                          ) : null}
                        </div>
                      ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Credit chip (always visible, not clickable) */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 md:h-10 rounded-2xl bg-white/5 border border-white/10 text-white">
                  <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-300" />
                  <span className="text-[13px] md:text-sm font-semibold tabular-nums leading-none">
                    {selectedModel.credits}
                  </span>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="icon"
                  className="ml-auto h-10 w-10 md:h-11 md:w-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-[0_14px_28px_-10px_rgba(249,115,22,0.8)]"
                  aria-label="Start generating"
                >
                  <ArrowUp className="w-4.5 h-4.5 md:w-5 md:h-5" />
                </Button>
              </div>
            </div>
          </form>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 md:pt-5">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="rounded-full px-7 md:px-8 py-5 md:py-6 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-[0_20px_50px_-16px_rgba(249,115,22,0.8)] text-base md:text-lg font-semibold"
                >
                  Start for Free
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button
                asChild
                size="lg"
                className="rounded-full px-7 md:px-8 py-5 md:py-6 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-[0_20px_50px_-16px_rgba(249,115,22,0.8)] text-base md:text-lg font-semibold"
              >
                <Link href="/studio/video-generator">Go to Studio</Link>
              </Button>
            </SignedIn>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-7 md:px-8 py-5 md:py-6 bg-white/5 text-white border-white/25 hover:bg-white/10 hover:text-white hover:border-white/40 backdrop-blur text-base md:text-lg"
            >
              <Link href="#features">Explore Features</Link>
            </Button>
          </div>

          {settings.displayMode === 'rotate' && playlist.length > 1 ? (
            <div className="absolute bottom-6 right-6 md:bottom-8 md:right-10 flex items-center gap-2 z-20">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                {playlistIndex + 1} / {playlist.length}
              </span>
              <div className="flex items-center gap-1.5">
                {playlist.map((p, i) => (
                  <button
                    aria-label={`Play billboard ${i + 1}`}
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setTransitioning(true);
                      window.setTimeout(() => {
                        setPlaylistIndex(i);
                        window.setTimeout(() => setTransitioning(false), Math.max(120, settings.crossfadeMs));
                      }, Math.max(60, Math.round(settings.crossfadeMs * 0.3)));
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === playlistIndex
                        ? "w-7 bg-white/90 shadow-[0_0_0_2px_rgba(249,115,22,0.35)]"
                        : "w-3 bg-white/25 hover:bg-white/50"
                    )}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
