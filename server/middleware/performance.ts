import type { Request, Response, NextFunction } from "express";

interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  slowestRequests: Array<{
    method: string;
    path: string;
    duration: number;
    timestamp: Date;
  }>;
  errorCount: number;
  successCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    slowestRequests: [],
    errorCount: 0,
    successCount: 0
  };

  private readonly MAX_SLOW_REQUESTS = 10;
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second

  recordRequest(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const originalSend = res.send;

    // Override res.send to capture response time
    const self = this;
    res.send = function(body: any) {
      const duration = Date.now() - startTime;
      
      // Record metrics
      self.recordMetrics(req.method, req.path, duration, res.statusCode);
      
      // Call original send
      return originalSend.call(this, body);
    };

    next();
  }

  private recordMetrics(method: string, path: string, duration: number, statusCode: number) {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += duration;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;

    // Track slow requests
    if (duration > this.SLOW_REQUEST_THRESHOLD) {
      this.metrics.slowestRequests.push({
        method,
        path,
        duration,
        timestamp: new Date()
      });

      // Keep only the slowest requests
      this.metrics.slowestRequests.sort((a, b) => b.duration - a.duration);
      if (this.metrics.slowestRequests.length > this.MAX_SLOW_REQUESTS) {
        this.metrics.slowestRequests = this.metrics.slowestRequests.slice(0, this.MAX_SLOW_REQUESTS);
      }
    }

    // Track success/error counts
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowestRequests: [],
      errorCount: 0,
      successCount: 0
    };
  }

  getHealthStatus() {
    const errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0;

    const isHealthy = errorRate < 10 && this.metrics.averageResponseTime < 500;

    return {
      healthy: isHealthy,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(this.metrics.averageResponseTime),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Middleware to record request performance
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  performanceMonitor.recordRequest(req, res, next);
}

// Get performance metrics
export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceMonitor.getMetrics();
}

// Get health status
export function getHealthStatus() {
  return performanceMonitor.getHealthStatus();
}

// Reset metrics
export function resetPerformanceMetrics() {
  performanceMonitor.resetMetrics();
}

// Memory usage monitoring
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
  };
}

// Database connection monitoring
export function getDatabaseHealth() {
  // This would be implemented based on your database connection
  // For now, return a mock status
  return {
    connected: true,
    latency: Math.random() * 100, // Mock latency
    lastQuery: new Date(),
    connectionPool: {
      total: 10,
      active: 3,
      idle: 7
    }
  };
}