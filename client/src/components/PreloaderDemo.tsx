import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Preloader, MinimalPreloader, DetailedPreloader } from './Preloader';
import { LoadingSpinner, SkeletonCard, SkeletonText, SkeletonButton } from './LoadingSpinner';
import { usePreloader, useComponentLoading } from '@/hooks/usePreloader';

export const PreloaderDemo: React.FC = () => {
  const [showBasic, setShowBasic] = useState(false);
  const [showMinimal, setShowMinimal] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);
  
  const { showPreloader, hidePreloader } = usePreloader();
  const { isLoading, startLoading, stopLoading } = useComponentLoading();

  const handleBasicPreloader = () => {
    setShowBasic(true);
    setTimeout(() => setShowBasic(false), 3000);
  };

  const handleMinimalPreloader = () => {
    setShowMinimal(true);
    setTimeout(() => setShowMinimal(false), 2000);
  };

  const handleDetailedPreloader = () => {
    setShowDetailed(true);
    setTimeout(() => setShowDetailed(false), 5000);
  };

  const handleCustomPreloader = () => {
    showPreloader('Custom loading message...');
    setTimeout(() => hidePreloader(), 3000);
  };

  const handleComponentLoading = () => {
    startLoading('Loading component data...');
    setTimeout(() => stopLoading(), 2000);
  };

  const handleSkeletonDemo = () => {
    setShowSkeletons(true);
    setTimeout(() => setShowSkeletons(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preloader Components Demo</h1>
        <p className="text-muted-foreground">
          Test different preloader components and loading states
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Preloader */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Preloader</CardTitle>
            <CardDescription>
              Simple preloader with spinning logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleBasicPreloader} className="w-full">
              Show Basic Preloader
            </Button>
            <Preloader isLoading={showBasic} message="Loading..." />
          </CardContent>
        </Card>

        {/* Minimal Preloader */}
        <Card>
          <CardHeader>
            <CardTitle>Minimal Preloader</CardTitle>
            <CardDescription>
              Compact preloader for small areas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleMinimalPreloader} className="w-full">
              Show Minimal Preloader
            </Button>
            <MinimalPreloader isLoading={showMinimal} message="Loading..." />
          </CardContent>
        </Card>

        {/* Detailed Preloader */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Preloader</CardTitle>
            <CardDescription>
              Full-featured preloader with progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleDetailedPreloader} className="w-full">
              Show Detailed Preloader
            </Button>
            <DetailedPreloader isLoading={showDetailed} message="Initializing..." />
          </CardContent>
        </Card>

        {/* Custom Preloader */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Preloader</CardTitle>
            <CardDescription>
              Using the preloader hook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleCustomPreloader} className="w-full">
              Show Custom Preloader
            </Button>
          </CardContent>
        </Card>

        {/* Component Loading */}
        <Card>
          <CardHeader>
            <CardTitle>Component Loading</CardTitle>
            <CardDescription>
              Loading state for components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleComponentLoading} className="w-full">
              Test Component Loading
            </Button>
            {isLoading && (
              <div className="flex justify-center">
                <LoadingSpinner message="Loading component..." />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skeleton Loading */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Loading</CardTitle>
            <CardDescription>
              Skeleton placeholders for content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleSkeletonDemo} className="w-full">
              Show Skeleton Loading
            </Button>
            {showSkeletons && (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonText lines={4} />
                <div className="flex gap-2">
                  <SkeletonButton />
                  <SkeletonButton />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loading Spinner Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinner Variants</CardTitle>
          <CardDescription>
            Different sizes and styles of loading spinners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <h4 className="font-medium">Small</h4>
              <LoadingSpinner size="sm" message="Small spinner" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-medium">Medium</h4>
              <LoadingSpinner size="md" message="Medium spinner" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-medium">Large</h4>
              <LoadingSpinner size="lg" message="Large spinner" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Spinners</CardTitle>
          <CardDescription>
            Loading spinners using the InscribeMate logo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <h4 className="font-medium">Small Logo</h4>
              <LoadingSpinner size="sm" showLogo={true} message="Small logo spinner" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-medium">Medium Logo</h4>
              <LoadingSpinner size="md" showLogo={true} message="Medium logo spinner" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-medium">Large Logo</h4>
              <LoadingSpinner size="lg" showLogo={true} message="Large logo spinner" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreloaderDemo;
