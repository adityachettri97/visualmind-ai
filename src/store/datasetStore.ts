import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIAnalysis } from "../services/aiService";
import { analyzeDataset, type DatasetAnalysis } from "../utils/analyzeDataset";
import { compileCalculatedFormula, formulaReferencesColumn, recalculateCalculatedColumns, type CalculatedColumns } from "../utils/calculatedColumns";

export type { DatasetAnalysis };

export type AIStatus = "idle" | "loading" | "error";

export interface DatasetHistoryEntry {
  id: string;
  fileName: string;
  data: Record<string, string>[];
  analysis: DatasetAnalysis;
  aiAnalysis: AIAnalysis | null;
  calculatedColumns: CalculatedColumns;
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
  calculatedColumns: CalculatedColumns;
  history: DatasetHistoryEntry[];

  setDataset: (data: Record<string, string>[], fileName: string, analysis: DatasetAnalysis, calculatedColumns?: CalculatedColumns) => void;
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
  addCalculatedColumn: (columnName: string, formula: string) => void;
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
    calculatedColumns?: CalculatedColumns;
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
    calculatedColumns: state.calculatedColumns,
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
      calculatedColumns: {},
      history: [],

      setDataset: (data, fileName, _analysis, calculatedColumns = {}) =>
        set((state) => {
          const snapshot = snapshotCurrent(state);
          const calculatedData = recalculateCalculatedColumns(data, calculatedColumns);

          return {
            data: calculatedData,
            fileName,
            analysis: analyzeDataset(calculatedData),
            aiAnalysis: null,
            aiStatus: "idle",
            aiError: null,
            calculatedColumns,
            history: (snapshot ? [snapshot, ...state.history] : state.history).slice(0, MAX_HISTORY),
          };
        }),

      appendRows: (rows) =>
        set((state) => {
          const data = recalculateCalculatedColumns([...state.data, ...rows], state.calculatedColumns);

          return { data, analysis: analyzeDataset(data) };
        }),

      updateCell: (rowIndex, column, value) =>
        set((state) => {
          if (state.calculatedColumns[column]) return state;

          const data = recalculateCalculatedColumns(
            state.data.map((row, index) => (index === rowIndex ? { ...row, [column]: value } : row)),
            state.calculatedColumns,
          );

          return { data, analysis: analyzeDataset(data) };
        }),

      deleteRow: (rowIndex) =>
        set((state) => {
          const data = recalculateCalculatedColumns(
            state.data.filter((_, index) => index !== rowIndex),
            state.calculatedColumns,
          );

          return { data, analysis: analyzeDataset(data) };
        }),

      addColumn: (columnName) =>
        set((state) => {
          const trimmed = columnName.trim();

          if (!trimmed || state.analysis?.columns.includes(trimmed)) return state;

          const data = recalculateCalculatedColumns(
            state.data.map((row) => ({ ...row, [trimmed]: "" })),
            state.calculatedColumns,
          );

          return { data, analysis: analyzeDataset(data) };
        }),

      addCalculatedColumn: (columnName, formula) =>
        set((state) => {
          const trimmedName = columnName.trim();
          const trimmedFormula = formula.trim();

          if (!trimmedName || !trimmedFormula || state.analysis?.columns.includes(trimmedName)) return state;

          compileCalculatedFormula(trimmedFormula, state.analysis?.columns ?? []);
          const calculatedColumns = { ...state.calculatedColumns, [trimmedName]: trimmedFormula };
          const data = recalculateCalculatedColumns(state.data, calculatedColumns);

          return { data, analysis: analyzeDataset(data), calculatedColumns };
        }),

      deleteColumn: (columnName) =>
        set((state) => {
          if ((state.analysis?.columns.length ?? 0) <= 1) return state;

          const calculatedColumns = { ...state.calculatedColumns };
          delete calculatedColumns[columnName];

          const removedColumns = new Set([columnName]);
          let removedDependency = true;

          while (removedDependency) {
            removedDependency = false;

            Object.entries(calculatedColumns).forEach(([name, formula]) => {
              if (!removedColumns.has(name) && Array.from(removedColumns).some((removed) => formulaReferencesColumn(formula, removed))) {
                delete calculatedColumns[name];
                removedColumns.add(name);
                removedDependency = true;
              }
            });
          }

          const baseData = state.data.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => !removedColumns.has(key))));
          const data = recalculateCalculatedColumns(baseData, calculatedColumns);

          return { data, analysis: analyzeDataset(data), calculatedColumns };
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
            calculatedColumns: {},
            history: (snapshot ? [snapshot, ...state.history] : state.history).slice(0, MAX_HISTORY),
          };
        }),

      loadFromHistory: (id) => {
        const state = get();
        const entry = state.history.find((item) => item.id === id);

        if (!entry) return;

        const snapshot = snapshotCurrent(state);
        const remaining = state.history.filter((item) => item.id !== id);
        const calculatedColumns = entry.calculatedColumns ?? {};
        const data = recalculateCalculatedColumns(entry.data, calculatedColumns);

        set({
          data,
          fileName: entry.fileName,
          analysis: analyzeDataset(data),
          aiAnalysis: entry.aiAnalysis,
          calculatedColumns,
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
        set((state) => {
          const remoteFormulas = remote.calculatedColumns ?? {};
          const remoteColumnNames = new Set(Object.keys(remote.data[0] ?? {}));
          const canReuseLocalFormulas =
            state.fileName === remote.fileName &&
            Object.keys(state.calculatedColumns).length > 0 &&
            Object.keys(state.calculatedColumns).every((column) => remoteColumnNames.has(column));
          const calculatedColumns = Object.keys(remoteFormulas).length > 0 ? remoteFormulas : canReuseLocalFormulas ? state.calculatedColumns : {};
          const data = recalculateCalculatedColumns(remote.data, calculatedColumns);
          const localHistory = new Map(state.history.map((entry) => [entry.id, entry]));
          const history = remote.history.map((entry) => {
            const savedFormulas = entry.calculatedColumns ?? {};
            const localFormulas = localHistory.get(entry.id)?.calculatedColumns ?? {};
            const entryColumns = new Set(Object.keys(entry.data[0] ?? {}));
            const entryCanReuseLocalFormulas =
              Object.keys(savedFormulas).length === 0 &&
              Object.keys(localFormulas).length > 0 &&
              Object.keys(localFormulas).every((column) => entryColumns.has(column));
            const entryFormulas = Object.keys(savedFormulas).length > 0 ? savedFormulas : entryCanReuseLocalFormulas ? localFormulas : {};
            const entryData = recalculateCalculatedColumns(entry.data, entryFormulas);

            return { ...entry, data: entryData, analysis: analyzeDataset(entryData), calculatedColumns: entryFormulas };
          });

          return {
            data,
            fileName: remote.fileName,
            analysis: analyzeDataset(data),
            aiAnalysis: remote.aiAnalysis,
            calculatedColumns,
            history,
            aiStatus: "idle",
            aiError: null,
          };
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
        calculatedColumns: state.calculatedColumns,
        history: state.history,
      }),
    },
  ),
);
