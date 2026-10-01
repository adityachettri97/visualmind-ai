import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "dark" | "light";

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "visualmind-theme" },
  ),
);
