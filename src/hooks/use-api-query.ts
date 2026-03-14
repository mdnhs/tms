import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useCallback } from 'react';
import { invalidationMap } from '@/lib/query-keys';

async function apiFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/**
 * Cached API query — data is served from cache instantly on repeat visits.
 * Only refetches when staleTime expires or when explicitly invalidated after a mutation.
 */
export function useApiQuery<T = unknown>(key: QueryKey, url: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => apiFetcher<T>(url),
    enabled,
  });
}

export type InvalidationScope = keyof typeof invalidationMap;

/**
 * Returns a function that invalidates all query keys affected by a mutation type.
 * Usage: const invalidate = useInvalidate(); invalidate('customer');
 */
export function useInvalidate() {
  const qc = useQueryClient();
  return useCallback(
    (...scopes: InvalidationScope[]) => {
      const seen = new Set<string>();
      for (const scope of scopes) {
        const keys = invalidationMap[scope];
        for (const key of keys) {
          const k = JSON.stringify(key);
          if (!seen.has(k)) {
            seen.add(k);
            qc.invalidateQueries({ queryKey: key as unknown as QueryKey });
          }
        }
      }
    },
    [qc],
  );
}
