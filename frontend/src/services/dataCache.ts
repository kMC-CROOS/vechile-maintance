/**
 * In-Memory Data Cache with TTL for smooth navigation
 * Prevents screens from re-fetching data from scratch on every focus/transition.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class DataCache {
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

  clear(): void {
    this.cache.clear();
  }

  /**
   * Helper to build cache keys strictly scoped to user and vehicle ID.
   * Prevents cross-account data leakage.
   */
  static scopedKey(
    userId?: number | string | null,
    vehicleId?: number | string | null,
    suffix?: string
  ): string {
    const u = userId ? `u_${userId}` : 'u_anon';
    const v = vehicleId ? `v_${vehicleId}` : 'v_none';
    return suffix ? `${u}:${v}:${suffix}` : `${u}:${v}`;
  }
}

export const dataCache = new DataCache();
