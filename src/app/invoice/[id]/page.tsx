'use client';

import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/route-guards';

const InvoicePage = dynamic(() => import('@/views/InvoicePage'), { ssr: false });

export default function InvoiceDetailPage() {
  return <ProtectedRoute><InvoicePage /></ProtectedRoute>;
}
