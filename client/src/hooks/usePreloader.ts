import { useState, useEffect } from 'react';

interface PreloaderState {
  isLoading: boolean;
  message: string;
  progress: number;
}

export const usePreloader = () => {
  const [preloaderState, setPreloaderState] = useState<PreloaderState>({
    isLoading: true,
    message: 'Initializing InscribeMate...',
    progress: 0
  });

  const [loadingSteps] = useState([
    { message: 'Loading application...', progress: 20 },
    { message: 'Connecting to services...', progress: 40 },
    { message: 'Initializing AI assistant...', progress: 60 },
    { message: 'Setting up accessibility features...', progress: 80 },
    { message: 'Almost ready...', progress: 100 }
  ]);

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < loadingSteps.length - 1) {
          setPreloaderState({
            isLoading: true,
            message: loadingSteps[prev + 1].message,
            progress: loadingSteps[prev + 1].progress
          });
          return prev + 1;
        } else {
          // Loading complete
          setTimeout(() => {
            setPreloaderState(prev => ({
              ...prev,
              isLoading: false
            }));
          }, 500);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadingSteps]);

  const showPreloader = (message: string) => {
    setPreloaderState({
      isLoading: true,
      message,
      progress: 0
    });
  };

  const hidePreloader = () => {
    setPreloaderState(prev => ({
      ...prev,
      isLoading: false
    }));
  };

  const updateMessage = (message: string) => {
    setPreloaderState(prev => ({
      ...prev,
      message
    }));
  };

  const updateProgress = (progress: number) => {
    setPreloaderState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }));
  };

  return {
    ...preloaderState,
    showPreloader,
    hidePreloader,
    updateMessage,
    updateProgress
  };
};

// Hook for app initialization loading
export const useAppLoading = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading InscribeMate...');

  useEffect(() => {
    // Simulate app initialization
    const initApp = async () => {
      try {
        setLoadingMessage('Initializing authentication...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setLoadingMessage('Loading user preferences...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setLoadingMessage('Setting up accessibility features...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setLoadingMessage('Connecting to services...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setLoadingMessage('Ready!');
        await new Promise(resolve => setTimeout(resolve, 300));

        setIsAppLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsAppLoading(false);
      }
    };

    initApp();
  }, []);

  return {
    isAppLoading,
    loadingMessage
  };
};

// Hook for component loading states
export const useComponentLoading = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const startLoading = (message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const updateLoadingMessage = (message: string) => {
    setLoadingMessage(message);
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    updateLoadingMessage
  };
};
