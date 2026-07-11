import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart3,
  User,
  Settings,
  LogOut,
  Target,
  Clock,
  Shield,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const mainNav = [
  { title: 'Dashboard', url: '/provider', icon: LayoutDashboard },
  { title: 'Bookings', url: '/provider/bookings', icon: CalendarDays },
  { title: 'Team', url: '/provider/team', icon: Shield },
  { title: 'Availability', url: '/provider/availability', icon: Clock },
];

const analyticNav = [
  { title: 'Analytics', url: '/provider/analytics', icon: BarChart3 },
  { title: 'Ad Campaigns', url: '/provider/campaigns', icon: Target },
];

const accountNav = [
  { title: 'Profile', url: '/provider/profile', icon: User },
];

export default function ProviderSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-heading font-bold text-sm">SG</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="font-heading font-bold text-base text-sidebar-foreground truncate">ServisGo</h2>
              <p className="text-xs text-muted-foreground truncate">Provider Panel</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-3">
            {!collapsed && 'Opeations'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/provider'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-3">
            {!collapsed && 'Growth'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-3">
            {!collapsed && 'Account'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarSeparator />
        <div className="pt-3">
          {!collapsed && user && (
            <div className="px-3 mb-3">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.user_metadata?.full_name || 'Provider Account'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
