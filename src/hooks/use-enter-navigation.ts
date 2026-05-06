import { useEffect, RefObject } from 'react';

export function useEnterNavigation(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement;
      if (target instanceof HTMLTextAreaElement) return;
      if (target instanceof HTMLButtonElement) return;

      const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
          'input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled])'
        )
      );

      const currentIndex = inputs.indexOf(target as HTMLInputElement | HTMLSelectElement);
      if (currentIndex === -1) return;

      e.preventDefault();

      if (currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else {
        const btn = container.querySelector<HTMLButtonElement>(
          'button[type="submit"], button[data-enter-submit]'
        ) || Array.from(container.querySelectorAll<HTMLButtonElement>('button:not([type="button"])')).pop();
        btn?.click();
      }
    };

    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  }, [containerRef]);
}
