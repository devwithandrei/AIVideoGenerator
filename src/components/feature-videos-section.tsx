"use client";

import { useEffect, useState } from "react";
import { FeatureIcon } from "@/components/feature-icon";

interface FeatureItem {
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

const featuresEqual = (a: FeatureItem[], b: FeatureItem[]) => {
  if (a.length !== b.length) return false;
  return a.every((f, i) => {
    const g = b[i];
    return (
      f.id === g.id &&
      f.title === g.title &&
      f.description === g.description &&
      f.icon === g.icon &&
      (f.videoUrl || null) === (g.videoUrl || null) &&
      (f.posterUrl || null) === (g.posterUrl || null) &&
      f.displayOrder === g.displayOrder
    );
  });
};

export default function FeatureVideosSection({ initialFeatures }: { initialFeatures?: FeatureItem[] }) {
  const [features, setFeatures] = useState<FeatureItem[]>(initialFeatures ?? []);

  useEffect(() => {
    let alive = true;

    const refresh = async () => {
      try {
        const r = await fetch("/api/feature-videos", { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (Array.isArray(d.features) && alive) {
          setFeatures((prev) => {
            const next = d.features as FeatureItem[];
            return featuresEqual(prev, next) ? prev : next;
          });
        }
      } catch (_) {}
    };

    void refresh();

    let visibleLast = typeof document !== "undefined" ? document.visibilityState === "visible" : true;
    let lastPoll = Date.now();
    const POLL_INTERVAL_MS = 8000;
    const TICK_MS = 500;

    const tick = () => {
      if (!alive) return;
      const now = Date.now();
      const visible = typeof document !== "undefined" ? document.visibilityState === "visible" : true;
      if (visible !== visibleLast) {
        visibleLast = visible;
        if (visible) void refresh();
      }
      if (visible && now - lastPoll >= POLL_INTERVAL_MS) {
        lastPoll = now;
        void refresh();
      }
    };
    const id = window.setInterval(tick, TICK_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <section id="features" className="w-full py-8 sm:py-12 md:py-24 lg:py-32 bg-card">
      <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14">
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-2 sm:px-3 py-1 text-xs sm:text-sm">Key Features</div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter lg:text-5xl font-headline">
              Everything You Need to Create
            </h2>
            <p className="max-w-[900px] text-sm sm:text-base text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              From text prompts to polished final cuts, AISNV provides a seamless, powerful, and intuitive creation experience with realistic results.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-6xl items-start gap-6 sm:gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-8 sm:mt-12">
          {features.map((f) => (
            <div key={f.id} className="grid gap-3 text-center">
              <div className="mx-auto w-full max-w-[320px] aspect-video rounded-xl overflow-hidden bg-muted/40 border">
                {f.videoUrl ? (
                  <video
                    key={f.videoUrl}
                    src={f.videoUrl}
                    poster={f.posterUrl || undefined}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FeatureIcon name={f.icon} className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold font-headline">{f.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
