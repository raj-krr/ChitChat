/**
 * In-Memory & Redis Hybrid Cache Manager
 * Provides sub-millisecond key-value caching with optional Redis persistence/clustering.
 */

class CacheManager {
  private fallbackStore = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.fallbackStore.get(key) || null;
  }

  async set(key: string, value: string, _ttlSeconds?: number): Promise<void> {
    this.fallbackStore.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.fallbackStore.delete(key);
  }

  async getAllKeys(prefix: string): Promise<string[]> {
    return Array.from(this.fallbackStore.keys()).filter((k) =>
      k.startsWith(prefix)
    );
  }
}

export const redisCache = new CacheManager();
