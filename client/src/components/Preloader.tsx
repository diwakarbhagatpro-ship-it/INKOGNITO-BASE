import React from 'react';
import { Logo } from './Logo';

interface PreloaderProps {
  isLoading: boolean;
  message?: string;
}

export const Preloader: React.FC<PreloaderProps> = ({ 
  isLoading, 
  message = "Loading InscribeMate..." 
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Animated Logo */}
        <div className="relative">
          <div className="animate-spin">
            <Logo size={80} showText={false} className="opacity-80" />
          </div>
          {/* Pulsing ring around logo */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-20 h-20 border-2 border-primary/30 rounded-full"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground animate-pulse">
            InscribeMate
          </h2>
          <p className="text-muted-foreground animate-pulse">
            {message}
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

// Alternative minimal preloader
export const MinimalPreloader: React.FC<PreloaderProps> = ({ 
  isLoading, 
  message = "Loading..." 
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinning Logo */}
        <div className="animate-spin">
          <Logo size={48} showText={false} />
        </div>
        
        {/* Loading Text */}
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

// Full screen preloader with more details
export const DetailedPreloader: React.FC<PreloaderProps> = ({ 
  isLoading, 
  message = "Initializing InscribeMate..." 
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background to-muted z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg p-8 shadow-lg border">
          <div className="flex flex-col items-center space-y-6">
            {/* Animated Logo with multiple rings */}
            <div className="relative">
              <div className="animate-spin">
                <Logo size={64} showText={false} />
              </div>
              {/* Multiple pulsing rings */}
              <div className="absolute inset-0 animate-ping">
                <div className="w-16 h-16 border border-primary/20 rounded-full"></div>
              </div>
              <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.5s' }}>
                <div className="w-20 h-20 border border-primary/10 rounded-full"></div>
              </div>
            </div>

            {/* App Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                InscribeMate
              </h1>
              <p className="text-muted-foreground">
                Accessibility-First Scribe Platform
              </p>
            </div>

            {/* Loading Message */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground animate-pulse">
                {message}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full space-y-2">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Loading...</span>
                <span>Please wait</span>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Smart Matching</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>AI Assistant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Accessibility</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
