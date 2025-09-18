import React from 'react';
import { Logo } from './Logo';
import PreloaderLogo from './preloader/logo.svg';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground"
        >
          <div className="relative flex items-center justify-center w-48 h-48">
            <motion.div
              initial={{ scale: 0.9, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 10,
                ease: 'linear',
              }}
            >
              <img src={PreloaderLogo} alt="Loading..." style={{ width: '128px', height: '128px' }} />
            </motion.div>
          </div>
          
          {message && (
            <div className="mt-8 text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-lg font-medium text-muted-foreground"
              >
                {message}
              </motion.p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
