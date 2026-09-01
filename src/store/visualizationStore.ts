import { create } from "zustand";
import type { VisualizationMode } from "../types/graph";

export type { VisualizationMode };

interface VisualizationState {
  mode: VisualizationMode;
  setMode: (mode: VisualizationMode) => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  mode: "cluster",

  setMode: (mode) =>
    set({
      mode,
    }),
}));
