import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { saveRemoteChatHistory } from "../services/chatHistorySyncService";

const SYNC_DEBOUNCE_MS = 1000;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function pushToRemote() {
  const { messages } = useChatStore.getState();

  saveRemoteChatHistory(messages).catch((error) => {
    console.error("Failed to save your chat history to your account:", error);
  });
}

/** Drops any scheduled-but-not-yet-fired save — see the identical concern in sync/datasetSync.ts. */
export function cancelPendingChatSync() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

/** Saves the current chat state right away instead of waiting out the debounce — for decisive,
    low-frequency actions (like clearing the conversation) where a reload/navigation immediately
    afterward would otherwise race the save and pull the stale pre-action state back down. */
export function flushChatSync() {
  if (useAuthStore.getState().status !== "authenticated") return;

  cancelPendingChatSync();
  pushToRemote();
}

/** Debounced push of the chat store to the signed-in user's account whenever it changes. Mirrors
    sync/datasetSync.ts — see its comments for why the load side lives in authStore instead, and
    why that sequencing means this subscriber never echoes a fresh load back as a save. Call once
    at app startup. */
export function initChatSync() {
  if (initialized) return;

  initialized = true;

  useChatStore.subscribe(() => {
    if (useAuthStore.getState().status !== "authenticated") return;

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(pushToRemote, SYNC_DEBOUNCE_MS);
  });
}
