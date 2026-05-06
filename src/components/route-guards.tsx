'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/features/dashboard/components';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function getFirstAllowedRoute(hasMenuPermission: (key: string) => boolean): string {
  const routeMap = [
    { permKey: 'dashboard', path: '/' },
    { permKey: 'orders', path: '/orders' },
    { permKey: 'create_order', path: '/create-order' },
    { permKey: 'customers', path: '/customers' },
    { permKey: 'products', path: '/products' },
    { permKey: 'categories', path: '/categories' },
    { permKey: 'reports', path: '/reports' },
    { permKey: 'craftsman_view', path: '/craftsman' },
    { permKey: 'craftsman_wages', path: '/craftsman-wages' },
    { permKey: 'settings', path: '/settings' },
  ];
  for (const route of routeMap) {
    if (hasMenuPermission(route.permKey)) return route.path;
  }
  return '/orders';
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authLoading } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) return <LoadingSpinner />;
  if (!isLoggedIn) return <LoadingSpinner />;
  return <Layout>{children}</Layout>;
}

export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authLoading } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) return <LoadingSpinner />;
  if (isLoggedIn) return <LoadingSpinner />;
  return <>{children}</>;
}

export function PermissionRoute({ permKey, children }: { permKey: string; children: React.ReactNode }) {
  const { hasMenuPermission, userType } = useData();
  const router = useRouter();

  const allowed = userType === 'owner' || hasMenuPermission(permKey);

  useEffect(() => {
    if (userType !== null && !allowed) {
      router.replace(getFirstAllowedRoute(hasMenuPermission));
    }
  }, [userType, allowed, router, hasMenuPermission]);

  if (userType !== null && !allowed) return <LoadingSpinner />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function OwnerRoute({ children }: { children: React.ReactNode }) {
  const { userType, hasMenuPermission } = useData();
  const router = useRouter();

  useEffect(() => {
    if (userType === 'staff') {
      router.replace(getFirstAllowedRoute(hasMenuPermission));
    }
  }, [userType, router, hasMenuPermission]);

  if (userType === 'staff') return <LoadingSpinner />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function DefaultRoute() {
  const { hasMenuPermission, userType, authLoading, isLoggedIn } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.replace('/login');
      } else if (userType === 'staff' && !hasMenuPermission('dashboard')) {
        router.replace(getFirstAllowedRoute(hasMenuPermission));
      }
    }
  }, [authLoading, isLoggedIn, userType, hasMenuPermission, router]);

  if (authLoading) return <LoadingSpinner />;
  if (!isLoggedIn) return <LoadingSpinner />;
  if (userType === 'staff' && !hasMenuPermission('dashboard')) return <LoadingSpinner />;
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}
