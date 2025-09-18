import { lazy, Suspense } from 'react';
import { Switch, Route } from 'wouter';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      <div className="h-16 w-16 mx-auto animate-pulse bg-primary/20 rounded-full" />
      <p className="text-lg">Loading...</p>
    </div>
  </div>
);

// Lazy load route components
const UserDashboard = lazy(() => import('@/components/UserDashboard').then(module => ({ default: module.UserDashboard })));
const RequestScribeCard = lazy(() => import('@/components/RequestScribeCard').then(module => ({ default: module.RequestScribeCard })));
const InseeAssistant = lazy(() => import('@/components/InseeAssistant').then(module => ({ default: module.InseeAssistant })));
const PreloaderDemo = lazy(() => import('@/components/PreloaderDemo').then(module => ({ default: module.PreloaderDemo })));
const TTSTest = lazy(() => import('@/components/TTSTest').then(module => ({ default: module.TTSTest })));
const NotFound = lazy(() => import('@/pages/not-found'));

// Create route components with Suspense
const SuspenseRoute = ({ component: Component, ...rest }: { component: React.ComponentType, path?: string }) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component {...rest} />
  </Suspense>
);

export const Router = () => {
  return (
    <Switch>
      <Route path="/" component={() => <SuspenseRoute component={UserDashboard} />} />
      <Route path="/request" component={() => <SuspenseRoute component={RequestScribeCard} />} />
      <Route path="/assistant" component={() => <SuspenseRoute component={InseeAssistant} />} />
      <Route path="/preloader" component={() => <SuspenseRoute component={PreloaderDemo} />} />
      <Route path="/tts" component={() => <SuspenseRoute component={TTSTest} />} />
      <Route component={() => <SuspenseRoute component={NotFound} />} />
    </Switch>
  );
};

export default Router;