'use client';

import dynamic from 'next/dynamic';
import { OwnerRoute } from '@/components/route-guards';

const StaffManagement = dynamic(() => import('@/features/staff/components'), { ssr: false });

export default function StaffPage() {
  return <OwnerRoute><StaffManagement /></OwnerRoute>;
}
