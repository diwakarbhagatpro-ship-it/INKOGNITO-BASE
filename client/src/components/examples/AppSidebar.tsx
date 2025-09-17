import { AppSidebar } from '../AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppSidebarExample() {
  const style = {
    '--sidebar-width': '20rem',
    '--sidebar-width-icon': '4rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole="blind_user" />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Dashboard Content</h1>
          <p className="text-muted-foreground">This sidebar shows navigation for a blind user role.</p>
        </div>
      </div>
    </SidebarProvider>
  );
}