import type { Request, Response, NextFunction } from "express";

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 300000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of Array.from(this.cache.values())) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: 0 // Would need to track hits/misses for this
    };
  }
}

// Singleton cache instance
const cache = new MemoryCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 300000);

// Cache middleware factory
export function createCacheMiddleware(ttl: number = 300000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      res.json(cachedData);
      return;
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(body: any) {
      cache.set(cacheKey, body, ttl);
      return originalJson.call(this, body);
    };

    next();
  };
}

// Cache invalidation middleware
export function invalidateCache(req: Request, res: Response, next: NextFunction) {
  // Only invalidate on non-GET requests
  if (req.method === 'GET') {
    return next();
  }

  // Store original json method
  const originalJson = res.json;

  // Override json method to invalidate cache
  res.json = function(body: any) {
    // Invalidate related cache entries
    const baseUrl = req.originalUrl.split('?')[0];
    const patterns = [
      `GET:${baseUrl}*`,
      `GET:${req.baseUrl}/*`
    ];

    for (const pattern of patterns) {
      // Simple pattern matching - in production, use a more sophisticated approach
      for (const key of Array.from(cache['cache'].keys())) {
        if (key.includes(baseUrl)) {
          cache.delete(key);
        }
      }
    }

    return originalJson.call(this, body);
  };

  next();
}

// Cache management endpoints
export function getCacheStats() {
  return cache.getStats();
}

export function clearCache() {
  cache.clear();
}

export function getCache() {
  return cache;
}

// Specific cache middleware for different endpoints
export const userCache = createCacheMiddleware(600000); // 10 minutes
export const requestCache = createCacheMiddleware(300000); // 5 minutes
export const analyticsCache = createCacheMiddleware(60000); // 1 minute