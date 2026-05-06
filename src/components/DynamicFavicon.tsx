'use client';

import { useEffect } from 'react';
import { useData } from '@/contexts/DataContext';

export function DynamicFavicon() {
  const { settings } = useData();

  useEffect(() => {
    const shopName = settings.shopNameBn || settings.shopName;
    if (shopName) {
      document.title = shopName;
    }
  }, [settings.shopName, settings.shopNameBn]);

  useEffect(() => {
    const logo = settings.shopLogo;
    if (!logo) return;

    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logo;

    // Also update apple-touch-icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = logo;
  }, [settings.shopLogo]);

  return null;
}
