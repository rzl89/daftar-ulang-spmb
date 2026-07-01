// Simple in-memory cache with TTL — used by server-side endpoints
// to reduce database hits for frequently-read data.

interface CacheEntry {
  data: unknown;
  expiry: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry>();

  /** Retrieve cached data. Returns null if missing or expired. */
  get<T = unknown>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /** Store data with a TTL in milliseconds. */
  set(key: string, data: unknown, ttlMs: number): void {
    this.store.set(key, { data, expiry: Date.now() + ttlMs });
  }

  /** Remove a specific key from the cache. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Remove all keys matching a prefix (e.g. 'settings:*'). */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Clear the entire cache. */
  clear(): void {
    this.store.clear();
  }
}

// Singleton — shared across all requests within one serverless instance
export const cache = new MemoryCache();
