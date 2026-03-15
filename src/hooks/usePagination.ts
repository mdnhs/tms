import { useEffect, useMemo } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';

export function usePagination<T>(items: T[], pageSize: number) {
  // Use nuqs to sync page state with the 'page' query param
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );

  // Reset to page 1 whenever the source list changes (search/filter applied)
  useEffect(() => {
    // Only reset if we're not already on page 1
    if (page !== 1) {
      void setPage(1);
    }
  }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  
  // Ensure page is within valid range
  const safePage = Math.max(1, Math.min(page, totalPages));

  const pageData = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const from = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, items.length);

  return { 
    page: safePage, 
    setPage: (newPage: number) => void setPage(newPage), 
    pageData, 
    totalPages, 
    totalItems: items.length, 
    from, 
    to 
  };
}
