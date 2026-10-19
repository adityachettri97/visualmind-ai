import { create } from "zustand";
import type { VisualizationMode } from "../types/graph";

export type { VisualizationMode };

export type VisualizationDimension = "2d" | "3d";
export type TwoDVisualizationMode = "bar" | "line" | "donut" | "scatter" | "horizontalBar" | "heatmap" | "treemap";

interface VisualizationState {
  mode: VisualizationMode;
  dimension: VisualizationDimension;
  twoDMode: TwoDVisualizationMode;
  setMode: (mode: VisualizationMode) => void;
  setDimension: (dimension: VisualizationDimension) => void;
  setTwoDMode: (mode: TwoDVisualizationMode) => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  mode: "bar",
  dimension: "3d",
  twoDMode: "bar",

  setMode: (mode) =>
    set({
      mode,
    }),
  setDimension: (dimension) => set({ dimension }),
  setTwoDMode: (twoDMode) => set({ twoDMode }),
}));
