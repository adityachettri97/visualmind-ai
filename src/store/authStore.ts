import { create } from "zustand";
import {
  fetchCurrentUser,
  forgotPassword as forgotPasswordRequest,
  login as loginRequest,
  logout as logoutRequest,
  resetPassword as resetPasswordRequest,
  signup as signupRequest,
  type AuthUser,
} from "../services/authService";
import { loadRemoteDataset } from "../services/datasetSyncService";
import { loadRemoteChatHistory } from "../services/chatHistorySyncService";
import { useDatasetStore } from "./datasetStore";
import { useChatStore } from "./chatStore";
import { cancelPendingSync } from "../sync/datasetSync";
import { cancelPendingChatSync } from "../sync/chatSync";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;

  /** Checks the httpOnly session cookie on app load — resolves the initial "checking" state. */
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, region: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Dev-mode only: resolves with the reset token directly (no email service wired up yet) —
      see services/authService.ts. */
  forgotPassword: (email: string) => Promise<{ resetToken?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  clearError: () => void;
}

// Loads the account's saved dataset and chat history and hydrates the local stores *before*
// status flips to "authenticated" — the UI only renders the account-data-consuming pages once
// authenticated, so this ordering keeps a previous session's (or a stale localStorage copy's)
// data from flashing on screen before the real account data replaces it, and keeps the sync
// modules (which only push while status is "authenticated") from immediately echoing this load
// back as a save. Run in parallel since the two loads are independent of each other.
async function hydrateAccountData() {
  await Promise.all([
    loadRemoteDataset()
      .then((remote) => useDatasetStore.getState().hydrateFromRemote(remote))
      .catch((error) => console.error("Failed to load your saved data:", error)),
    loadRemoteChatHistory()
      .then((messages) => useChatStore.getState().setMessages(messages))
      .catch((error) => console.error("Failed to load your chat history:", error)),
  ]);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "checking",
  error: null,

  checkSession: async () => {
    const user = await fetchCurrentUser();

    if (user) await hydrateAccountData();

    set({ user, status: user ? "authenticated" : "unauthenticated" });
  },

  login: async (email, password) => {
    set({ error: null });

    try {
      const user = await loginRequest(email, password);

      await hydrateAccountData();
      set({ user, status: "authenticated" });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to sign in." });
      throw error;
    }
  },

  signup: async (email, password, region, name) => {
    set({ error: null });

    try {
      const user = await signupRequest(email, password, region, name);

      // A brand-new account has nothing to hydrate, but keeping this call here (rather than
      // skipping it) keeps the sequencing identical to login — one less special case to reason about.
      await hydrateAccountData();
      set({ user, status: "authenticated" });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create your account." });
      throw error;
    }
  },

  logout: async () => {
    await logoutRequest().catch(() => {});

    // Status flips first so the sync subscribers (both guarded on "authenticated") won't
    // schedule a fresh save in response to the clears below — the session cookie is already gone
    // server-side by this point, so any such save would just fail with 401 a moment later.
    set({ user: null, status: "unauthenticated" });
    cancelPendingSync();
    cancelPendingChatSync();
    useDatasetStore.getState().clearDataset();
    useDatasetStore.getState().clearHistory();
    useChatStore.getState().clearMessages();
  },

  forgotPassword: async (email) => {
    set({ error: null });

    try {
      return await forgotPasswordRequest(email);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to process that request." });
      throw error;
    }
  },

  resetPassword: async (token, password) => {
    set({ error: null });

    try {
      const user = await resetPasswordRequest(token, password);

      await hydrateAccountData();
      set({ user, status: "authenticated" });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to reset your password." });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
