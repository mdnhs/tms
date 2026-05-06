'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const CreateOrder = dynamic(() => import('@/features/orders/components/create'), { ssr: false });

export default function CreateOrderPage() {
  return <PermissionRoute permKey="create_order"><CreateOrder /></PermissionRoute>;
}
