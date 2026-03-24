import { useEffect, useState } from "react";

import { useSchemesRepo } from "@/src/repositories/schemesRepo";
import type { SchemeCardViewModel } from "@/src/types/domain";

export function useSchemes(wagonId?: string, packageTypeId?: string) {
  const schemesRepo = useSchemesRepo();
  const [schemes, setSchemes] = useState<SchemeCardViewModel[]>([]);

  useEffect(() => {
    const subscription = schemesRepo.observeSchemeCards(wagonId, packageTypeId).subscribe({
      next: setSchemes,
      error: () => setSchemes([]),
    });

    return () => subscription.unsubscribe();
  }, [packageTypeId, schemesRepo, wagonId]);

  return { schemes };
}
