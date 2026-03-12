'use client';

import dynamic from 'next/dynamic';
import { OwnerRoute } from '@/components/route-guards';

const RoleForm = dynamic(() => import('@/views/RoleForm'), { ssr: false });

export default function NewRolePage() {
  return <OwnerRoute><RoleForm /></OwnerRoute>;
}
