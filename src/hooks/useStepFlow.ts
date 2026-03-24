import { useEffect, useMemo, useState } from "react";

import { useSchemesRepo } from "@/src/repositories/schemesRepo";
import { useWorkflowStore } from "@/src/state/workflowStore";
import type { SchemeTierViewModel } from "@/src/types/domain";

export function useStepFlow(groupKey?: string) {
  const schemesRepo = useSchemesRepo();
  const currentStepIndex = useWorkflowStore((state) => state.currentStepIndex);
  const completedTierIds = useWorkflowStore((state) => state.completedTierIds);
  const setCurrentStepIndex = useWorkflowStore((state) => state.setCurrentStepIndex);
  const toggleTierCompleted = useWorkflowStore((state) => state.toggleTierCompleted);
  const [tiers, setTiers] = useState<SchemeTierViewModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!groupKey) {
        setTiers([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await schemesRepo.getTiersWithInventory(groupKey);
      if (!active) {
        return;
      }
      setTiers(result);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [groupKey, schemesRepo]);

  const currentTier = tiers[currentStepIndex];
  const currentTierCompleted = currentTier ? completedTierIds.includes(currentTier.id) : false;

  const canMoveNext = Boolean(currentTier && currentTierCompleted && currentStepIndex < tiers.length - 1);
  const canFinish = Boolean(currentTier && currentTierCompleted && currentStepIndex === tiers.length - 1);

  return useMemo(
    () => ({
      tiers,
      loading,
      currentStepIndex,
      currentTier,
      completedTierIds,
      currentTierCompleted,
      canMoveNext,
      canFinish,
      goBack() {
        if (currentStepIndex > 0) {
          setCurrentStepIndex(currentStepIndex - 1);
        }
      },
      goNext() {
        if (canMoveNext) {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      },
      toggleCurrentTier() {
        if (currentTier) {
          toggleTierCompleted(currentTier.id);
        }
      },
    }),
    [
      canFinish,
      canMoveNext,
      completedTierIds,
      currentStepIndex,
      currentTier,
      currentTierCompleted,
      loading,
      setCurrentStepIndex,
      tiers,
      toggleTierCompleted,
    ],
  );
}
