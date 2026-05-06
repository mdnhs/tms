'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DataProvider } from '@/contexts/DataContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { DynamicFavicon } from '@/components/DynamicFavicon';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min — serve from cache, no refetch
      gcTime: 10 * 60 * 1000,         // 10 min — keep unused cache before GC
      refetchOnWindowFocus: false,     // don't refetch on tab switch
      retry: 1,                        // single retry on failure
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <DataProvider>
                <DynamicFavicon />
                {children}
              </DataProvider>
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
