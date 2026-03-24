import { create } from "zustand";

interface WorkflowState {
  selectedWagonId?: string;
  selectedPackageTypeId?: string;
  selectedSchemeGroupKey?: string;
  currentStepIndex: number;
  completedTierIds: string[];
  operatorName?: string;
  operatorComment?: string;
  selectWagon: (wagonId?: string) => void;
  selectPackageType: (packageTypeId?: string) => void;
  openScheme: (groupKey: string) => void;
  setCurrentStepIndex: (index: number) => void;
  toggleTierCompleted: (tierId: string) => void;
  setReportMeta: (values: { operatorName?: string; operatorComment?: string }) => void;
  resetWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  currentStepIndex: 0,
  completedTierIds: [],
  selectWagon: (wagonId) =>
    set({
      selectedWagonId: wagonId,
      selectedSchemeGroupKey: undefined,
      currentStepIndex: 0,
      completedTierIds: [],
    }),
  selectPackageType: (packageTypeId) =>
    set({
      selectedPackageTypeId: packageTypeId,
      selectedSchemeGroupKey: undefined,
      currentStepIndex: 0,
      completedTierIds: [],
    }),
  openScheme: (groupKey) =>
    set({
      selectedSchemeGroupKey: groupKey,
      currentStepIndex: 0,
      completedTierIds: [],
    }),
  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
  toggleTierCompleted: (tierId) =>
    set((state) => ({
      completedTierIds: state.completedTierIds.includes(tierId)
        ? state.completedTierIds.filter((item) => item !== tierId)
        : [...state.completedTierIds, tierId],
    })),
  setReportMeta: ({ operatorName, operatorComment }) => set({ operatorName, operatorComment }),
  resetWorkflow: () =>
    set({
      selectedSchemeGroupKey: undefined,
      currentStepIndex: 0,
      completedTierIds: [],
      operatorName: undefined,
      operatorComment: undefined,
    }),
}));
