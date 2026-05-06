'use client';

import dynamic from 'next/dynamic';

const ResetPassword = dynamic(() => import('@/features/auth/components/reset-password'), { ssr: false });

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
