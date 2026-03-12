import { LayoutDashboard, Users, Package, ShoppingCart, ClipboardList, LogOut, Scissors, Settings, Tag, BarChart3, Shield, UserCog, Hammer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NavLink } from '@/components/NavLink';
import { useData } from '@/context/DataContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { path: '/', labelKey: 'dashboard', icon: LayoutDashboard, permKey: 'dashboard', color: 'text-sky-400' },
  { path: '/create-order', labelKey: 'createOrder', icon: ShoppingCart, permKey: 'create_order', color: 'text-blue-400' },
  { path: '/orders', labelKey: 'orders', icon: ClipboardList, permKey: 'orders', color: 'text-orange-400' },
  { path: '/customers', labelKey: 'customers', icon: Users, permKey: 'customers', color: 'text-violet-400' },
  { path: '/products', labelKey: 'products', icon: Package, permKey: 'products', color: 'text-emerald-400' },
  { path: '/categories', labelKey: 'categories_menu', icon: Tag, permKey: 'categories', color: 'text-amber-400' },
  { path: '/reports', labelKey: 'reports', icon: BarChart3, permKey: 'reports', color: 'text-cyan-400' },
  { path: '/craftsman', labelKey: 'craftsmanView', icon: Hammer, permKey: 'craftsman_view', color: 'text-yellow-400' },
  { path: '/staff', labelKey: 'staffMenu', icon: UserCog, permKey: 'staff', ownerOnly: true, color: 'text-pink-400' },
  { path: '/roles', labelKey: 'roles', icon: Shield, permKey: 'roles', ownerOnly: true, color: 'text-rose-400' },
  { path: '/settings', labelKey: 'settings', icon: Settings, permKey: 'settings', color: 'text-slate-400' },
] as const;

export function AppSidebar() {
  const { logout, settings, hasMenuPermission, userType } = useData();
  const { t } = useLanguage();
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const visibleItems = NAV_ITEMS.filter(item => {
    if ('ownerOnly' in item && item.ownerOnly && userType === 'staff') return false;
    return hasMenuPermission(item.permKey);
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center ${collapsed ? 'justify-center py-3 px-2' : 'gap-3 px-3 py-4'} bg-gradient-to-br from-sidebar-accent to-sidebar-background`}>
                {settings.shopLogo ? (
                  <img src={settings.shopLogo} alt={settings.shopName} className="w-9 h-9 min-w-[2.25rem] min-h-[2.25rem] rounded-xl object-cover ring-2 ring-sidebar-primary/30" />
                ) : (
                  <div className="w-9 h-9 min-w-[2.25rem] min-h-[2.25rem] rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shadow-lg shadow-sidebar-primary/30">
                    <Scissors className="w-4 h-4 text-sidebar-primary-foreground" />
                  </div>
                )}
                {!collapsed && (
                  <div className="min-w-0 overflow-hidden">
                    <h1 className="text-sm font-bold text-sidebar-foreground truncate leading-tight">{settings.shopNameBn || settings.shopName}</h1>
                    <p className="text-[11px] text-sidebar-foreground/50 truncate mt-0.5">{settings.shopName}</p>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-semibold">
                {settings.shopNameBn || settings.shopName}
              </TooltipContent>
            )}
          </Tooltip>
        </SidebarHeader>

        <SidebarContent className="pt-1">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest px-3">
              {!collapsed ? t('dashboard') : ''}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.path}
                            end={item.path === '/'}
                            className="hover:bg-sidebar-accent/60 rounded-lg mx-1 transition-all"
                            activeClassName="bg-gradient-to-r from-sidebar-primary/20 to-sidebar-accent text-sidebar-primary font-semibold"
                          >
                            <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
                            {!collapsed && <span>{t(item.labelKey)}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          {t(item.labelKey)}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="text-sidebar-foreground/60 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg mx-1 transition-all"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{t('logout')}</span>}
                  </SidebarMenuButton>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {t('logout')}
                  </TooltipContent>
                )}
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
