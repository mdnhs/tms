'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const Products = dynamic(() => import('@/views/Products'), { ssr: false });

export default function ProductsPage() {
  return <PermissionRoute permKey="products"><Products /></PermissionRoute>;
}
