'use client';

import { Wallet, BadgeDollarSign } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function CraftsmanWages() {
  const { t } = useLanguage();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            {t('craftsmanWages')}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {t('craftsmanWagesDesc')}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BadgeDollarSign className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t('comingSoon')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('wagesSetupPending')}</p>

          <div className="mt-6 w-full">
            <div className="rounded-2xl border border-border bg-background/60 p-4 text-left">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                {t('craftsmanWages')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('craftsmanWagesDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
