'use client';

import dynamic from 'next/dynamic';
import { OwnerRoute } from '@/components/route-guards';

const RoleForm = dynamic(() => import('@/features/roles/components/role-form'), { ssr: false });

export default function NewRolePage() {
  return <OwnerRoute><RoleForm /></OwnerRoute>;
}
