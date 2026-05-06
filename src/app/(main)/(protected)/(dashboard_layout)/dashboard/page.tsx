'use client';

import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/route-guards';

const Dashboard = dynamic(() => import('@/features/dashboard/components'), { ssr: false });

export default function DashboardPage() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}
