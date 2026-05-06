'use client';

import dynamic from 'next/dynamic';
import { AuthRoute } from '@/components/route-guards';

const Login = dynamic(() => import('@/features/auth/components/login'), { ssr: false });

export default function LoginPage() {
  return <AuthRoute><Login /></AuthRoute>;
}
