import { Home, Users, Settings, UserCheck, Shield, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// Define user roles for navigation
type UserRole = 'blind_user' | 'volunteer' | 'admin';

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
};

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    roles: ['blind_user', 'volunteer', 'admin'],
  },
  {
    title: 'Request Scribe',
    url: '/request',
    icon: UserCheck,
    roles: ['blind_user'],
  },
  {
    title: 'Available Requests',
    url: '/requests',
    icon: Calendar,
    roles: ['volunteer'],
  },
  {
    title: 'My Sessions',
    url: '/sessions',
    icon: MessageSquare,
    roles: ['blind_user', 'volunteer'],
  },
  {
    title: 'Manage Users',
    url: '/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'System Monitoring',
    url: '/monitoring',
    icon: Shield,
    roles: ['admin'],
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    roles: ['blind_user', 'volunteer', 'admin'],
  },
  {
    title: 'Preloader Demo',
    url: '/preloader-demo',
    icon: Loader2,
    roles: ['blind_user', 'volunteer', 'admin'],
  },
];

type AppSidebarProps = {
  userRole?: UserRole;
};

export function AppSidebar({ userRole = 'blind_user' }: AppSidebarProps) {
  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole));

  const handleNavigation = (url: string, title: string) => {
    console.log('Navigate to:', url, title);
    // TODO: Implement actual navigation with wouter
  };

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>InscribeMate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url, item.title)}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Accessibility</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="p-4 text-xs text-muted-foreground space-y-1">
              <p>Keyboard Navigation:</p>
              <p>• Tab to move between elements</p>
              <p>• Enter/Space to activate</p>
              <p>• ESC to close dialogs</p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}