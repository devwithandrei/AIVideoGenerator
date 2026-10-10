import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const ONLINE_WINDOW_MS = 90_000;

const stateDir = (): string | null => {
  try {
    const d = join(process.cwd(), '.aisnv-state');
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
    return d;
  } catch (_) {
    return null;
  }
};

const diskPath = (): string | null => {
  const d = stateDir();
  return d ? join(d, 'presence.json') : null;
};

declare global {
  // eslint-disable-next-line no-var
  var __AISNV_PRESENCE__: Map<string, number> | undefined;
}

function getStore(): Map<string, number> {
  if (!globalThis.__AISNV_PRESENCE__) {
    const store = new Map<string, number>();
    const p = diskPath();
    if (p && existsSync(p)) {
      try {
        const parsed = JSON.parse(readFileSync(p, 'utf-8'));
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([k, v]) => {
            if (typeof v === 'number') store.set(k, v);
          });
        }
      } catch (_) {}
    }
    globalThis.__AISNV_PRESENCE__ = store;
  }
  return globalThis.__AISNV_PRESENCE__;
}

function flush(store: Map<string, number>) {
  const p = diskPath();
  if (!p) return;
  try {
    const obj: Record<string, number> = {};
    store.forEach((v, k) => { obj[k] = v; });
    writeFileSync(p, JSON.stringify(obj), 'utf-8');
  } catch (_) {}
}

function prune(store: Map<string, number>) {
  const cutoff = Date.now() - ONLINE_WINDOW_MS * 4;
  let changed = false;
  store.forEach((v, k) => {
    if (v < cutoff) {
      store.delete(k);
      changed = true;
    }
  });
  if (changed) flush(store);
}

export function heartbeat(userId: string): void {
  if (!userId) return;
  const store = getStore();
  store.set(userId, Date.now());
  prune(store);
  flush(store);
}

export function markOffline(userId: string): void {
  if (!userId) return;
  const store = getStore();
  store.delete(userId);
  flush(store);
}

export function isOnline(userId: string): boolean {
  if (!userId) return false;
  const store = getStore();
  const last = store.get(userId);
  if (!last) return false;
  return Date.now() - last <= ONLINE_WINDOW_MS;
}

export function getLastSeen(userId: string): number | null {
  if (!userId) return null;
  const store = getStore();
  return store.get(userId) || null;
}

export function getOnlineUserIds(): string[] {
  const store = getStore();
  const now = Date.now();
  const ids: string[] = [];
  store.forEach((last, id) => {
    if (now - last <= ONLINE_WINDOW_MS) ids.push(id);
  });
  return ids;
}

export function getOnlineCount(): number {
  return getOnlineUserIds().length;
}

export function getLastSeenMap(): Record<string, number> {
  const store = getStore();
  const map: Record<string, number> = {};
  store.forEach((last, id) => {
    map[id] = last;
  });
  return map;
}
