'use client';

import dynamic from 'next/dynamic';
import { PermissionRoute } from '@/components/route-guards';

const Settings = dynamic(() => import('@/features/settings/components'), { ssr: false });

export default function SettingsPage() {
  return <PermissionRoute permKey="settings"><Settings /></PermissionRoute>;
}
