'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const OrdersList = dynamic(() => import('@/features/orders/components'), { ssr: false });

export default function OrdersPage() {
  return <PermissionRoute permKey="orders"><OrdersList /></PermissionRoute>;
}
