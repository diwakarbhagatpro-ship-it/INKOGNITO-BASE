import type { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

// Simple in-memory rate limiter
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of Array.from(this.requests.entries())) {
        if (now > data.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  getKey(req: Request, keyGenerator?: (req: Request) => string): string {
    if (keyGenerator) {
      return keyGenerator(req);
    }
    
    // Default: use IP address
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const data = this.requests.get(key);

    if (!data || now > data.resetTime) {
      // First request or window expired
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (data.count >= maxRequests) {
      return false;
    }

    data.count++;
    return true;
  }

  getRemainingRequests(key: string, maxRequests: number, windowMs: number): number {
    const data = this.requests.get(key);
    if (!data || Date.now() > data.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - data.count);
  }

  getResetTime(key: string): number {
    const data = this.requests.get(key);
    return data ? data.resetTime : Date.now();
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

const rateLimiter = new RateLimiter();

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = rateLimiter.getKey(req, keyGenerator);
    const isAllowed = rateLimiter.isAllowed(key, maxRequests, windowMs);

    if (!isAllowed) {
      const remainingRequests = rateLimiter.getRemainingRequests(key, maxRequests, windowMs);
      const resetTime = rateLimiter.getResetTime(key);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remainingRequests.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        'Retry-After': retryAfter.toString()
      });

      return res.status(429).json({
        error: message,
        retryAfter,
        limit: maxRequests,
        remaining: remainingRequests
      });
    }

    // Add rate limit headers
    const remainingRequests = rateLimiter.getRemainingRequests(key, maxRequests, windowMs);
    const resetTime = rateLimiter.getResetTime(key);

    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remainingRequests.toString(),
      'X-RateLimit-Reset': new Date(resetTime).toISOString()
    });

    next();
  };
}

// Predefined rate limiters
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests, please try again later'
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => `auth:${req.ip}`
});

export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: 'API rate limit exceeded, please slow down'
});

export const strictRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests, please slow down'
});

// Cleanup on process exit
process.on('SIGINT', () => {
  rateLimiter.destroy();
});

process.on('SIGTERM', () => {
  rateLimiter.destroy();
});