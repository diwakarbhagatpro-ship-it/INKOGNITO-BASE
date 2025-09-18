/**
 * Simple monitoring service for tracking errors and performance
 */

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class MonitoringService {
  private static instance: MonitoringService;
  private errors: ErrorReport[] = [];
  private metrics: PerformanceMetric[] = [];
  private maxStoredErrors = 50;
  private isEnabled = true;

  private constructor() {
    // Initialize error listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleWindowError);
      window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    }
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public captureError(error: Error, componentStack?: string): void {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.errors.push(errorReport);
    this.trimErrorsIfNeeded();
    this.logError(errorReport);
    // Here you would send to a backend service
  }

  public captureMessage(message: string): void {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      message,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.errors.push(errorReport);
    this.trimErrorsIfNeeded();
    console.log('[Monitoring] Message captured:', message);
    // Here you would send to a backend service
  }

  public measurePerformance(name: string, callback: () => void): void {
    if (!this.isEnabled) {
      callback();
      return;
    }

    const start = performance.now();
    callback();
    const end = performance.now();
    const duration = end - start;

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    console.log(`[Monitoring] Performance: ${name} took ${duration.toFixed(2)}ms`);
  }

  public async measureAsyncPerformance<T>(
    name: string,
    callback: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) {
      return callback();
    }

    const start = performance.now();
    try {
      const result = await callback();
      const end = performance.now();
      const duration = end - start;

      this.metrics.push({
        name,
        duration,
        timestamp: Date.now(),
      });

      console.log(`[Monitoring] Async Performance: ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`[Monitoring] Async Performance Error: ${name} failed after ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  }

  public getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public clearErrors(): void {
    this.errors = [];
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  private handleWindowError = (event: ErrorEvent): void => {
    if (!this.isEnabled) return;
    
    this.captureError(event.error || new Error(event.message));
  };

  private handlePromiseRejection = (event: PromiseRejectionEvent): void => {
    if (!this.isEnabled) return;
    
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    this.captureError(error);
  };

  private trimErrorsIfNeeded(): void {
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }
  }

  private logError(error: ErrorReport): void {
    console.error('[Monitoring] Error captured:', error.message, error);
  }
}

export const monitoring = MonitoringService.getInstance();

// Helper functions for easier usage
export function captureError(error: Error, componentStack?: string): void {
  monitoring.captureError(error, componentStack);
}

export function captureMessage(message: string): void {
  monitoring.captureMessage(message);
}

export function measurePerformance(name: string, callback: () => void): void {
  monitoring.measurePerformance(name, callback);
}

export async function measureAsyncPerformance<T>(
  name: string,
  callback: () => Promise<T>
): Promise<T> {
  return monitoring.measureAsyncPerformance(name, callback);
}