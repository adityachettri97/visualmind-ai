import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIAnalysis } from "../services/aiService";
import { analyzeDataset, type DatasetAnalysis } from "../utils/analyzeDataset";

export type { DatasetAnalysis };

export type AIStatus = "idle" | "loading" | "error";

export interface DatasetHistoryEntry {
  id: string;
  fileName: string;
  data: Record<string, string>[];
  analysis: DatasetAnalysis;
  aiAnalysis: AIAnalysis | null;
  uploadedAt: number;
}

const MAX_HISTORY = 5;

interface DatasetState {
  data: Record<string, string>[];
  fileName: string | null;
  analysis: DatasetAnalysis | null;
  aiAnalysis: AIAnalysis | null;
  aiStatus: AIStatus;
  aiError: string | null;
  history: DatasetHistoryEntry[];

  setDataset: (data: Record<string, string>[], fileName: string, analysis: DatasetAnalysis) => void;
  /** Appends rows to the currently active dataset in place — for logging new data over time,
      as opposed to `setDataset`, which switches to a different dataset entirely. */
  appendRows: (rows: Record<string, string>[]) => void;
  /** Edits a single cell of the currently active dataset in place. */
  updateCell: (rowIndex: number, column: string, value: string) => void;
  /** Removes one row from the currently active dataset. */
  deleteRow: (rowIndex: number) => void;
  /** Adds a new (initially blank) column to every row of the currently active dataset. No-op if
      the name is blank or already used. */
  addColumn: (columnName: string) => void;
  /** Removes a column from every row of the currently active dataset. No-op if it's the only
      column left, since a dataset with rows but no columns can't render meaningfully. */
  deleteColumn: (columnName: string) => void;

  setAIAnalysis: (aiAnalysis: AIAnalysis) => void;
  setAILoading: () => void;
  setAIError: (message: string) => void;

  clearDataset: () => void;
  loadFromHistory: (id: string) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  /** Replaces the whole persisted slice with what's saved in the signed-in user's account —
      used right after login, distinct from `setDataset` since it doesn't snapshot anything
      (there's nothing local worth keeping at that point) or touch AI-analysis loading state. */
  hydrateFromRemote: (remote: {
    data: Record<string, string>[];
    fileName: string | null;
    analysis: DatasetAnalysis | null;
    aiAnalysis: AIAnalysis | null;
    history: DatasetHistoryEntry[];
  }) => void;
}

/** A snapshot of the currently active dataset, ready to prepend to history — or null if nothing is active. */
function snapshotCurrent(state: DatasetState): DatasetHistoryEntry | null {
  if (!state.fileName || !state.analysis) return null;

  return {
    id: crypto.randomUUID(),
    fileName: state.fileName,
    data: state.data,
    analysis: state.analysis,
    aiAnalysis: state.aiAnalysis,
    uploadedAt: Date.now(),
  };
}

export const useDatasetStore = create<DatasetState>()(
  persist(
    (set, get) => ({
      data: [],
      fileName: null,
      analysis: null,
      aiAnalysis: null,
      aiStatus: "idle",
      aiError: null,
      history: [],

      setDataset: (data, fileName, analysis) =>
        set((state) => {
          const snapshot = snapshotCurrent(state);

          return {
            data,
            fileName,
            analysis,
            aiAnalysis: null,
            aiStatus: "idle",
            aiError: null,
            history: (snapshot ? [snapshot, ...state.history] : state.history).slice(0, MAX_HISTORY),
          };
        }),

      appendRows: (rows) =>
        set((state) => {
          const data = [...state.data, ...rows];

          return { data, analysis: analyzeDataset(data) };
        }),

      updateCell: (rowIndex, column, value) =>
        set((state) => {
          const data = state.data.map((row, index) => (index === rowIndex ? { ...row, [column]: value } : row));

          return { data, analysis: analyzeDataset(data) };
        }),

      deleteRow: (rowIndex) =>
        set((state) => {
          const data = state.data.filter((_, index) => index !== rowIndex);

          return { data, analysis: analyzeDataset(data) };
        }),

      addColumn: (columnName) =>
        set((state) => {
          const trimmed = columnName.trim();

          if (!trimmed || state.analysis?.columns.includes(trimmed)) return state;

          const data = state.data.map((row) => ({ ...row, [trimmed]: "" }));

          return { data, analysis: analyzeDataset(data) };
        }),

      deleteColumn: (columnName) =>
        set((state) => {
          if ((state.analysis?.columns.length ?? 0) <= 1) return state;

          const data = state.data.map((row) =>
            Object.fromEntries(Object.entries(row).filter(([key]) => key !== columnName)),
          );

          return { data, analysis: analyzeDataset(data) };
        }),

      setAIAnalysis: (aiAnalysis) =>
        set({
          aiAnalysis,
          aiStatus: "idle",
          aiError: null,
        }),

      setAILoading: () =>
        set({
          aiStatus: "loading",
          aiError: null,
        }),

      setAIError: (message) =>
        set({
          aiStatus: "error",
          aiError: message,
        }),

      clearDataset: () =>
        set((state) => {
          const snapshot = snapshotCurrent(state);

          return {
            data: [],
            fileName: null,
            analysis: null,
            aiAnalysis: null,
            aiStatus: "idle",
            aiError: null,
            history: (snapshot ? [snapshot, ...state.history] : state.history).slice(0, MAX_HISTORY),
          };
        }),

      loadFromHistory: (id) => {
        const state = get();
        const entry = state.history.find((item) => item.id === id);

        if (!entry) return;

        const snapshot = snapshotCurrent(state);
        const remaining = state.history.filter((item) => item.id !== id);

        set({
          data: entry.data,
          fileName: entry.fileName,
          analysis: entry.analysis,
          aiAnalysis: entry.aiAnalysis,
          aiStatus: "idle",
          aiError: null,
          history: (snapshot ? [snapshot, ...remaining] : remaining).slice(0, MAX_HISTORY),
        });
      },

      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      clearHistory: () =>
        set({
          history: [],
        }),

      hydrateFromRemote: (remote) =>
        set({
          data: remote.data,
          fileName: remote.fileName,
          analysis: remote.analysis,
          aiAnalysis: remote.aiAnalysis,
          history: remote.history,
          aiStatus: "idle",
          aiError: null,
        }),
    }),
    {
      name: "visualmind-dataset",
      // aiStatus/aiError describe an in-flight request, not durable data — never resume as "loading" after a reload.
      partialize: (state) => ({
        data: state.data,
        fileName: state.fileName,
        analysis: state.analysis,
        aiAnalysis: state.aiAnalysis,
        history: state.history,
      }),
    },
  ),
);
