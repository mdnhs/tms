'use client';

import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/route-guards';

const InvoicePage = dynamic(() => import('@/features/invoice/components/InvoicePage'), { ssr: false });

export default function InvoiceDetailPage() {
  return <ProtectedRoute><InvoicePage /></ProtectedRoute>;
}
