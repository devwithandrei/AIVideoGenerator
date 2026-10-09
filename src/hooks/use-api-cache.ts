import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseApiCacheOptions {
  cacheTime?: number; // Cache duration in milliseconds (default: 2 minutes)
  staleTime?: number; // Time before data is considered stale (default: 1 minute)
  refetchOnWindowFocus?: boolean;
}

const cache = new Map<string, CacheEntry<any>>();

export function useApiCache<T>(
  url: string | null,
  options: UseApiCacheOptions = {}
): { data: T | null; loading: boolean; error: string | null; refetch: () => Promise<void> } {
  const {
    cacheTime = 120000, // 2 minutes
    staleTime = 60000,  // 1 minute
    refetchOnWindowFocus = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!url) return;
    
    const now = Date.now();
    const cached = cache.get(url);

    // Return cached data if it's still fresh
    if (!force && cached && now < cached.expiresAt) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Check if data is stale but still usable
    if (!force && cached && now < cached.timestamp + staleTime) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      
      // Refetch in background
      fetchData(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the result
      cache.set(url, {
        data: result,
        timestamp: now,
        expiresAt: now + cacheTime,
      });

      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error('API cache error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url, cacheTime, staleTime]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    
    fetchData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, fetchData]);

  // Refetch on window focus if enabled
  useEffect(() => {
    if (!refetchOnWindowFocus || !url) return;

    const handleFocus = () => {
      const cached = cache.get(url);
      if (cached && Date.now() > cached.timestamp + staleTime) {
        refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [url, refetchOnWindowFocus, refetch, staleTime]);

  return { data, loading, error, refetch };
}

// Utility function to clear cache
export function clearApiCache(url?: string) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}

// Utility function to get cache stats
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(cache.entries());
  
  return {
    totalEntries: entries.length,
    validEntries: entries.filter(([_, entry]) => now < entry.expiresAt).length,
    expiredEntries: entries.filter(([_, entry]) => now >= entry.expiresAt).length,
  };
}
