import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import '@/index.css';

export const metadata: Metadata = {
  title: 'টেইলারিং শপ ম্যানেজমেন্ট',
  description: 'Local Tailoring Shop POS Management System',
  openGraph: {
    title: 'টেইলারিং শপ ম্যানেজমেন্ট',
    description: 'Local Tailoring Shop POS Management System',
    type: 'website',
    images: [
      'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dd3ff297-e480-48af-8019-99da77611d49/id-preview-7c04f19b--e4658764-1f23-402e-ad74-cafe744d430d.lovable.app-1773067350190.png',
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'টেইলারিং শপ ম্যানেজমেন্ট',
    description: 'Local Tailoring Shop POS Management System',
    images: [
      'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dd3ff297-e480-48af-8019-99da77611d49/id-preview-7c04f19b--e4658764-1f23-402e-ad74-cafe744d430d.lovable.app-1773067350190.png',
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
