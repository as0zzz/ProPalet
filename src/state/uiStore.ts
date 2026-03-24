import { create } from "zustand";

interface UiState {
  productionUiEnabled: boolean;
  setProductionUiEnabled: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  productionUiEnabled: true,
  setProductionUiEnabled: (value) => set({ productionUiEnabled: value }),
}));
