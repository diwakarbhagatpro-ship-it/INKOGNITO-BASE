import React from 'react';
import { Logo } from './Logo';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  showLogo?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  showLogo = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const logoSize = {
    sm: 16,
    md: 32,
    lg: 48
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      {showLogo ? (
        <div className="animate-spin">
          <Logo size={logoSize[size]} showText={false} />
        </div>
      ) : (
        <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`}></div>
      )}
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

// Inline loading spinner for buttons
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent ${className}`}></div>
);

// Page loading overlay
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin">
        <Logo size={48} showText={false} />
      </div>
      <p className="text-muted-foreground animate-pulse">{message}</p>
    </div>
  </div>
);

// Skeleton loading components
export const SkeletonCard: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-muted rounded-lg p-6 space-y-4">
      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
      <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
      <div className="h-4 bg-muted-foreground/20 rounded w-5/6"></div>
    </div>
  </div>
);

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-muted-foreground/20 rounded ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      ></div>
    ))}
  </div>
);

export const SkeletonButton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-muted-foreground/20 rounded w-24"></div>
  </div>
);

export default LoadingSpinner;
