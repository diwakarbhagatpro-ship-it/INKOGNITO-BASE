import { useState, useEffect, lazy, Suspense } from 'react';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { tts } from '@/lib/tts';
import { DetailedPreloader } from '@/components/Preloader';
import { useAppLoading } from '@/hooks/usePreloader';
import { Logo } from '@/components/Logo';
import { Route, Switch } from 'wouter';
import { UserDashboard } from '@/components/UserDashboard';
import { RequestScribeCard } from '@/components/RequestScribeCard';
import { TTSTest } from '@/components/TTSTest';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { InseeAssistant } from '@/components/InseeAssistant';
import { PreloaderDemo } from '@/components/PreloaderDemo';
import NotFound from '@/pages/not-found';

// Lazily loaded components
const SignInForm = lazy(() => import('@/components/auth/SignInForm').then(module => ({ default: module.SignInForm })));
const SignUpForm = lazy(() => import('@/components/auth/SignUpForm').then(module => ({ default: module.SignUpForm })));
const AppSidebar = lazy(() => import('@/components/AppSidebar').then(module => ({ default: module.AppSidebar })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      <Logo className="mx-auto h-16 w-16 animate-pulse" />
      <p className="text-lg">Loading...</p>
    </div>
  </div>
);

// Authentication wrapper component
const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const { isAppLoading, loadingMessage } = useAppLoading();

  // Initialize TTS on app load
  useEffect(() => {
    if (!isAppLoading) {
      tts.speak('Welcome to InscribeMate, your accessibility-first scribe platform');
    }
  }, [isAppLoading]);

  // Show app preloader
  if (isAppLoading) {
    return <DetailedPreloader isLoading={true} message={loadingMessage} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const toggleForm = () => setShowSignUp(!showSignUp);

    return showSignUp ? (
      <SignUpForm onSignInClick={toggleForm} />
    ) : (
      <SignInForm onSignUpClick={toggleForm} />
    );
  }

  return <MainApp user={user} />;
};

// Main app component for authenticated users
const MainApp: React.FC<{ user: any }> = ({ user }) => {
  const userRole = user.user_metadata?.role || 'blind_user';
  const userName = user.user_metadata?.name || user.email;

  function DashboardPage() {
    return (
      <div className="p-6">
        <UserDashboard userRole={userRole} userName={userName} />
      </div>
    );
  }

  function RequestPage() {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Request a Scribe</h1>
          <p className="text-muted-foreground">
            Schedule assistance or request immediate help for your exams and academic needs.
          </p>
        </div>
        <RequestScribeCard />
      </div>
    );
  }

  function SettingsPage() {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize your experience and preferences.
          </p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Text-to-Speech Settings</h2>
          <TTSTest />
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Accessibility Settings</h1>
          <p className="text-muted-foreground">
            Customize your experience with accessibility and preference options.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display & Contrast</h3>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Adjust theme and contrast settings in the top navigation bar.
              </p>
              <div className="flex gap-2">
                <ThemeToggle />
              </div>
            </div>
            
            <h3 className="text-lg font-medium">Language & Localization</h3>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Choose your preferred language from major Indian languages.
              </p>
              <LanguageSelector />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Accessibility Features</h3>
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Screen Reader Support</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Keyboard Navigation</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">High Contrast Mode</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Text-to-Speech</span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function AppRouter() {
    return (
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/request" component={RequestPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/preloader-demo" component={PreloaderDemo} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={{ '--sidebar-width': '20rem', '--sidebar-width-icon': '4rem' } as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <Suspense fallback={<LoadingFallback />}>
              <AppSidebar userRole={userRole} />
            </Suspense>
            <div className="flex flex-col flex-1">
              {/* Header */}
              <header 
                className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                data-testid="app-header"
              >
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <Logo size={32} showText={true} className="hidden sm:flex" />
                  <Logo size={28} showText={false} className="sm:hidden" />
                </div>
                
                <div className="flex items-center gap-3">
                  <Suspense fallback={<span>Loading...</span>}>
                    <LanguageSelector />
                  </Suspense>
                  <Suspense fallback={<span>Loading...</span>}>
                    <ThemeToggle />
                  </Suspense>
                  
                  {/* User Profile */}
                  <div className="flex items-center gap-2 ml-2">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {userRole.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {userName.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                </div>
              </header>
              
              {/* Main Content */}
              <main className="flex-1 overflow-auto" data-testid="main-content">
                <Suspense fallback={<LoadingFallback />}>
                  <AppRouter />
                </Suspense>
              </main>
            </div>
          </div>
          
          {/* INSEE AI Assistant */}
          <InseeAssistant />
          
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AuthenticatedApp />
      </Suspense>
    </AuthProvider>
  );
}

export default App;
