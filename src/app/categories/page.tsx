'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const Categories = dynamic(() => import('@/views/Categories'), { ssr: false });

export default function CategoriesPage() {
  return <PermissionRoute permKey="categories"><Categories /></PermissionRoute>;
}
