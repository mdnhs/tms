'use client';

import dynamic from 'next/dynamic';
import { OwnerRoute } from '@/components/route-guards';

const RoleManagement = dynamic(() => import('@/views/RoleManagement'), { ssr: false });

export default function RolesPage() {
  return <OwnerRoute><RoleManagement /></OwnerRoute>;
}
