"use client";

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

const HEARTBEAT_INTERVAL_MS = 45_000;

export default function PresenceHeartbeat() {
  const { userId } = useAuth();
  const userIdRef = useRef<string | null | undefined>(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    let alive = true;
    let lastBeat = 0;

    const sendOfflineBeacon = () => {
      try {
        if (navigator.sendBeacon && userIdRef.current) {
          const blob = new Blob(
            [JSON.stringify({ offline: true, userId: userIdRef.current })],
            { type: 'application/json' }
          );
          navigator.sendBeacon('/api/presence', blob);
        }
      } catch (_) {}
    };

    const beat = async () => {
      if (!alive) return;
      const uid = userIdRef.current;
      if (!uid) return;
      try {
        const res = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid }),
          keepalive: true,
        });
        if (res.ok) {
          lastBeat = Date.now();
        }
      } catch (_) {}
    };

    const firstTimer = window.setTimeout(() => void beat(), 1500);

    const tick = () => {
      if (!alive) return;
      const visible = document.visibilityState === 'visible';
      if (visible && Date.now() - lastBeat >= HEARTBEAT_INTERVAL_MS) {
        void beat();
      }
    };
    const interval = window.setInterval(tick, 5000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void beat();
      } else {
        sendOfflineBeacon();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onPageHide = () => sendOfflineBeacon();
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);

    return () => {
      alive = false;
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
      sendOfflineBeacon();
    };
  }, []);

  return null;
}
