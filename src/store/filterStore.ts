import { create } from "zustand";

interface FilterState {
  searchQuery: string;
  selectedGroups: string[];
  minValue: number | null;
  maxValue: number | null;
  setSearchQuery: (query: string) => void;
  toggleGroup: (group: string) => void;
  setValueRange: (min: number | null, max: number | null) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: "",
  selectedGroups: [],
  minValue: null,
  maxValue: null,
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleGroup: (group) =>
    set((state) => ({
      selectedGroups: state.selectedGroups.includes(group)
        ? state.selectedGroups.filter((g) => g !== group)
        : [...state.selectedGroups, group],
    })),
  setValueRange: (min, max) => set({ minValue: min, maxValue: max }),
  clearFilters: () => set({ searchQuery: "", selectedGroups: [], minValue: null, maxValue: null }),
}));

export interface FilterCriteria {
  searchQuery: string;
  selectedGroups: string[];
  minValue: number | null;
  maxValue: number | null;
}

export function isFilterActive(filters: FilterCriteria): boolean {
  return filters.searchQuery.trim() !== "" || filters.selectedGroups.length > 0 || filters.minValue !== null || filters.maxValue !== null;
}

/** Shared match rule so the canvas (which dims nodes) and the filter bar (which shows a count) can't drift apart. */
export function matchesFilters(label: string, group: string, rawValue: number, filters: FilterCriteria): boolean {
  const query = filters.searchQuery.trim().toLowerCase();

  if (query && !label.toLowerCase().includes(query)) return false;
  if (filters.selectedGroups.length > 0 && !filters.selectedGroups.includes(group)) return false;
  if (filters.minValue !== null && rawValue < filters.minValue) return false;
  if (filters.maxValue !== null && rawValue > filters.maxValue) return false;

  return true;
}
