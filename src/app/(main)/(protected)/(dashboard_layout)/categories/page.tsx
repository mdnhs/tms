'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const Categories = dynamic(() => import('@/features/categories/components'), { ssr: false });

export default function CategoriesPage() {
  return <PermissionRoute permKey="categories"><Categories /></PermissionRoute>;
}
