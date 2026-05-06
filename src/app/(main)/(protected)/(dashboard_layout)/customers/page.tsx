'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const Customers = dynamic(() => import('@/features/customers/components'), { ssr: false });

export default function CustomersPage() {
  return <PermissionRoute permKey="customers"><Customers /></PermissionRoute>;
}
