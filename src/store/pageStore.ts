import { create } from "zustand";

export type Page = "dashboard" | "workspace" | "upload" | "visualizations" | "assistant" | "reports" | "settings";

interface PageState {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

export const usePageStore = create<PageState>((set) => ({
  activePage: "dashboard",

  setActivePage: (page) =>
    set({
      activePage: page,
    }),
}));
