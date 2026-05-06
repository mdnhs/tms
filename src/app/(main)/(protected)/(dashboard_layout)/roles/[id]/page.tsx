'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { OwnerRoute } from '@/components/route-guards';

const RoleForm = dynamic(() => import('@/features/roles/components/role-form'), { ssr: false });

export default function EditRolePage() {
  const params = useParams();
  const id = params?.id as string;
  return <OwnerRoute><RoleForm roleId={id} /></OwnerRoute>;
}
