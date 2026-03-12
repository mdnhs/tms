'use client';

import dynamic from 'next/dynamic';
import { OwnerRoute } from '@/components/route-guards';

const StaffManagement = dynamic(() => import('@/views/StaffManagement'), { ssr: false });

export default function StaffPage() {
  return <OwnerRoute><StaffManagement /></OwnerRoute>;
}
