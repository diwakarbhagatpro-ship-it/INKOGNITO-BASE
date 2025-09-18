import { useEffect, useCallback } from 'react';
import { captureError, captureMessage, measurePerformance, measureAsyncPerformance } from '../lib/monitoring';

/**
 * Hook to provide monitoring capabilities to React components
 */
export function useMonitoring(componentName: string) {
  useEffect(() => {
    // Log component mount
    captureMessage(`Component mounted: ${componentName}`);
    
    return () => {
      // Log component unmount
      captureMessage(`Component unmounted: ${componentName}`);
    };
  }, [componentName]);

  const logError = useCallback((error: Error) => {
    captureError(error);
  }, []);

  const logMessage = useCallback((message: string) => {
    captureMessage(`[${componentName}] ${message}`);
  }, [componentName]);

  const trackPerformance = useCallback(
    (operationName: string, callback: () => void) => {
      measurePerformance(`${componentName}.${operationName}`, callback);
    },
    [componentName]
  );

  const trackAsyncPerformance = useCallback(
    async <T>(operationName: string, callback: () => Promise<T>): Promise<T> => {
      return measureAsyncPerformance(`${componentName}.${operationName}`, callback);
    },
    [componentName]
  );

  return {
    logError,
    logMessage,
    trackPerformance,
    trackAsyncPerformance,
  };
}