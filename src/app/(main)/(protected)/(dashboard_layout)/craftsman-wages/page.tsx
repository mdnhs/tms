'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const CraftsmanWages = dynamic(() => import('@/features/craftsman/components/wages'), { ssr: false });

export default function CraftsmanWagesPage() {
  return <PermissionRoute permKey="craftsman_wages"><CraftsmanWages /></PermissionRoute>;
}
