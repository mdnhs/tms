'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const Reports = dynamic(() => import('@/views/Reports'), { ssr: false });

export default function ReportsPage() {
  return <PermissionRoute permKey="reports"><Reports /></PermissionRoute>;
}
