import { useCallback } from 'react';

export interface MeasurementHistoryEntry {
  fieldName: string;
  value: string;
  useCount: number;
}

/** Returns a helper to get suggestions from pre-loaded measurement history data */
export function useMeasurementSuggestions(history: MeasurementHistoryEntry[]) {
  const getSuggestions = useCallback(
    (fieldName: string): string[] => {
      return history
        .filter((s) => s.fieldName === fieldName)
        .sort((a, b) => b.useCount - a.useCount)
        .map((s) => s.value);
    },
    [history],
  );

  return { getSuggestions };
}
