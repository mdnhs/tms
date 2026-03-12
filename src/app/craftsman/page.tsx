'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const CraftsmanDashboard = dynamic(() => import('@/views/CraftsmanDashboard'), { ssr: false });

export default function CraftsmanPage() {
  return <PermissionRoute permKey="craftsman_view"><CraftsmanDashboard /></PermissionRoute>;
}
