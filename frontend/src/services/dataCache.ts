/**
 * In-Memory Data Cache with TTL for smooth navigation
 * Prevents screens from re-fetching data from scratch on every focus/transition.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 60 * 1000; // 60 seconds

  get<T>(key: string, maxAgeMs: number = this.defaultTTL): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > maxAgeMs) {
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const dataCache = new DataCache();
