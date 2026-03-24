import { useEffect, useState } from "react";
import type { Observable } from "rxjs";

import type { AutocompleteOption } from "@/src/types/domain";

export function useAutocomplete(
  query: string,
  observeFactory: (query: string) => Observable<AutocompleteOption[]>,
  debounceMs = 220,
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [debounceMs, query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const subscription = observeFactory(debouncedQuery).subscribe({
      next: (result) => {
        setOptions(result);
        setLoading(false);
      },
      error: () => {
        setOptions([]);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [debouncedQuery, observeFactory]);

  return { options, loading };
}
