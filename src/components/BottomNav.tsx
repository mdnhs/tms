'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, PlusCircle, Users, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { BarChart3, Package, Settings, Shield, Tag, UserCog, Hammer } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useData } from '@/context/DataContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { hasMenuPermission, userType } = useData();
  const [showMore, setShowMore] = useState(false);

  const ALL_NAV_ITEMS = [
    { path: '/', icon: LayoutDashboard, label: t('home'), permKey: 'dashboard' },
    { path: '/orders', icon: ClipboardList, label: t('navOrders'), permKey: 'orders' },
    { path: '/create-order', icon: PlusCircle, label: t('navNew'), isPrimary: true, permKey: 'create_order' },
    { path: '/customers', icon: Users, label: t('navCustomers'), permKey: 'customers' },
  ];

  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => hasMenuPermission(item.permKey));

  const MORE_ITEMS = [
    { path: '/products', icon: Package, label: t('products'), permKey: 'products' },
    { path: '/categories', icon: Tag, label: t('categories_menu'), permKey: 'categories' },
    { path: '/reports', icon: BarChart3, label: t('reports'), permKey: 'reports' },
    { path: '/craftsman', icon: Hammer, label: t('craftsmanView'), permKey: 'craftsman_view' },
    ...(userType === 'owner' ? [
      { path: '/staff', icon: UserCog, label: t('staffMenu'), permKey: 'staff' },
      { path: '/roles', icon: Shield, label: t('roles'), permKey: 'roles' },
    ] : []),
    { path: '/settings', icon: Settings, label: t('settings'), permKey: 'settings' },
  ].filter(item => hasMenuPermission(item.permKey));

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] left-2 right-2 bg-card border border-border rounded-2xl p-2 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {MORE_ITEMS.map(item => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setShowMore(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/85 backdrop-blur-xl border-t border-border safe-area-bottom" style={{ boxShadow: '0 -1px 0 hsl(var(--border)), 0 -4px 24px hsl(var(--background) / 0.8)' }}>
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.path;
            if ('isPrimary' in item && item.isPrimary) {
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className="w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/40 ring-4 ring-background">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium text-primary">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 transition-all ${
              showMore || MORE_ITEMS.some(m => pathname === m.path) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${showMore ? 'bg-primary/10' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">{t('navMore')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
