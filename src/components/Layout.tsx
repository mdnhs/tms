import { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon, Globe, Bell, Clock, CreditCard, PackageCheck, AlertTriangle } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

const PAGE_TITLES: Record<string, { bn: string; en: string }> = {
  '/':              { bn: 'ড্যাশবোর্ড',      en: 'Dashboard' },
  '/customers':     { bn: 'গ্রাহক',           en: 'Customers' },
  '/products':      { bn: 'পণ্য',             en: 'Products' },
  '/categories':    { bn: 'ক্যাটাগরি',        en: 'Categories' },
  '/create-order':  { bn: 'নতুন অর্ডার',      en: 'New Order' },
  '/orders':        { bn: 'অর্ডার',           en: 'Orders' },
  '/reports':       { bn: 'রিপোর্ট',          en: 'Reports' },
  '/settings':      { bn: 'সেটিংস',           en: 'Settings' },
  '/staff':         { bn: 'স্টাফ',            en: 'Staff' },
  '/roles':         { bn: 'ভূমিকা',           en: 'Roles' },
  '/craftsman':     { bn: 'কারিগর',           en: 'Craftsman' },
};

interface NotificationItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  route: string;
}

function getRelativeTime(timestamp: string, lang: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
  if (mins < 60) return lang === 'bn' ? `${mins} মিনিট আগে` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'bn' ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === 'bn' ? `${days} দিন আগে` : `${days}d ago`;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, density } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { orders, settings, dataLoading, readNotifications, markNotificationRead, markAllNotificationsRead, unmarkNotificationRead } = useData();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const shopName = settings.shopNameBn || settings.shopName || 'টেইলার শপ';
    const pageEntry = Object.entries(PAGE_TITLES).find(([path]) =>
      path === '/' ? pathname === '/' : pathname.startsWith(path)
    );
    const pageName = pageEntry ? pageEntry[1][language as 'bn' | 'en'] ?? pageEntry[1].bn : null;
    document.title = pageName ? `${pageName} — ${shopName}` : shopName;
  }, [pathname, settings.shopName, settings.shopNameBn, language]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [notifTimestamps, setNotifTimestamps] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const d = localStorage.getItem('pos_notif_timestamps');
      return d ? JSON.parse(d) : {};
    } catch { return {}; }
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const dueCount = orders.filter(o => o.dueAmount > 0 && o.status !== 'delivered').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  const currentCounts = useRef<Record<string, number>>({ pending: pendingCount, due: dueCount, ready: readyCount });

  useEffect(() => {
    const prev = currentCounts.current;
    const changed: Record<string, string> = {};
    const now = new Date().toISOString();
    if (pendingCount !== prev.pending) { changed.pending = now; unmarkNotificationRead('pending'); }
    if (dueCount !== prev.due) { changed.due = now; unmarkNotificationRead('due'); }
    if (readyCount !== prev.ready) { changed.ready = now; unmarkNotificationRead('ready'); }
    currentCounts.current = { pending: pendingCount, due: dueCount, ready: readyCount };
    if (Object.keys(changed).length > 0) {
      setNotifTimestamps(prev => {
        const updated = { ...prev, ...changed };
        localStorage.setItem('pos_notif_timestamps', JSON.stringify(updated));
        return updated;
      });
    }
  }, [pendingCount, dueCount, readyCount, unmarkNotificationRead]);

  const notifications: NotificationItem[] = [
    {
      key: 'pending',
      icon: <Clock className="h-4 w-4 text-warning" />,
      label: t('pendingOrders'),
      count: pendingCount,
      route: '/orders',
    },
    {
      key: 'due',
      icon: <CreditCard className="h-4 w-4 text-destructive" />,
      label: t('duePayments'),
      count: dueCount,
      route: '/orders',
    },
    {
      key: 'ready',
      icon: <PackageCheck className="h-4 w-4 text-success" />,
      label: t('readyForDelivery'),
      count: readyCount,
      route: '/orders',
    },
  ].filter(n => n.count > 0);

  const unreadCount = notifications.filter(n => !readNotifications.has(n.key)).length;
  const prevUnreadCountRef = useRef(unreadCount);

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(830, ctx.currentTime);
      osc.frequency.setValueAtTime(1050, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      playNotificationSound();
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, playNotificationSound]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-12 md:h-14 flex items-center justify-between bg-card/80 backdrop-blur-xl px-3 md:px-4 shrink-0 sticky top-0 z-30 shadow-sm" style={{ borderBottom: '1px solid hsl(var(--border))', boxShadow: '0 1px 0 hsl(var(--primary) / 0.08), 0 2px 8px hsl(var(--background) / 0.6)' }}>
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <SidebarTrigger />
              </div>
              <div className="flex items-center gap-2 md:hidden">
                {settings.shopLogo ? (
                  <img src={settings.shopLogo} alt={settings.shopName} className="w-7 h-7 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {(settings.shopNameBn || settings.shopName).charAt(0)}
                  </div>
                )}
                <p className="text-sm font-bold text-foreground truncate max-w-[140px]">
                  {settings.shopNameBn || settings.shopName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dataLoading && (
                <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground">
                  <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span>Syncing data</span>
                </div>
              )}
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative hover:bg-primary/10">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white text-[10px] font-bold shadow-sm shadow-red-400/50">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-semibold">{t('notifications')}</p>
                    {unreadCount > 0 && (
                      <button onClick={() => markAllNotificationsRead()} className="text-[11px] text-primary hover:underline">
                        {t('markAllRead')}
                      </button>
                    )}
                  </div>
                  {(() => {
                    const unreadNotifications = notifications.filter(n => !readNotifications.has(n.key));
                    return unreadNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {t('noNewNotifications')}
                      </div>
                    ) : (
                      <div className="py-1">
                        {unreadNotifications.map((n) => (
                          <button
                            key={n.key}
                            onClick={() => { markNotificationRead(n.key); setPopoverOpen(false); router.push(n.route); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left bg-accent/20"
                          >
                            <div className="relative shrink-0">
                              {n.icon}
                              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm block font-semibold">{n.label}</span>
                              {notifTimestamps[n.key] && (
                                <span className="text-[10px] text-muted-foreground">{getRelativeTime(notifTimestamps[n.key], language)}</span>
                              )}
                            </div>
                            <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full shrink-0">{n.count}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('bn')} className={language === 'bn' ? 'bg-accent/20' : ''}>
                    🇧🇩 {t('bangla')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent/20' : ''}>
                    🇬🇧 {t('english')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          {dataLoading && (
            <div className="sticky top-12 md:top-14 z-20 h-0.5 overflow-hidden bg-transparent">
              <div className="h-full w-full origin-left animate-pulse bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
            </div>
          )}

          <main className={`flex-1 overflow-y-auto pb-20 md:pb-8 ${
            density === 'compact'     ? 'p-2 md:p-3 lg:p-4' :
            density === 'comfortable' ? 'p-4 md:p-6 lg:p-9' :
                                        'p-3 md:p-5 lg:p-7'
          }`}>
            {children}
          </main>
        </div>

        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
