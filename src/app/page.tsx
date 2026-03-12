'use client';

import dynamic from 'next/dynamic';

const DefaultRoute = dynamic(
  () => import('@/components/route-guards').then(m => ({ default: m.DefaultRoute })),
  { ssr: false }
);

export default function HomePage() {
  return <DefaultRoute />;
}
