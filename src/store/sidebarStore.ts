import { create } from "zustand";

interface SidebarState {
  /** Desktop: whether the sidebar is the narrow icon-rail (true) or the full labeled rail (false). */
  isCollapsed: boolean;
  toggleSidebar: () => void;

  /** Mobile/tablet: whether the overlay drawer is open. */
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,

  toggleSidebar: () =>
    set((state) => ({
      isCollapsed: !state.isCollapsed,
    })),

  isMobileOpen: false,

  toggleMobileSidebar: () =>
    set((state) => ({
      isMobileOpen: !state.isMobileOpen,
    })),

  closeMobileSidebar: () =>
    set({
      isMobileOpen: false,
    }),
}));
