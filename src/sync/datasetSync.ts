import { useAuthStore } from "../store/authStore";
import { useDatasetStore } from "../store/datasetStore";
import { saveRemoteDataset } from "../services/datasetSyncService";

const SYNC_DEBOUNCE_MS = 1000;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function pushToRemote() {
  const { data, fileName, analysis, aiAnalysis, history } = useDatasetStore.getState();

  saveRemoteDataset({ data, fileName, analysis, aiAnalysis, history }).catch((error) => {
    console.error("Failed to save your data to your account:", error);
  });
}

/** Drops any scheduled-but-not-yet-fired save — call on logout so a debounced push from just
    before signing out doesn't fire after the session cookie is already gone (401). */
export function cancelPendingSync() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

/**
 * Debounced push of the dataset store to the signed-in user's account whenever it changes —
 * covers every dataset-store action (upload, manual edits, AI generation, etc.) from one place
 * instead of adding a save call to each of them individually. Call once at app startup.
 *
 * The load side (account → local store on login) lives in authStore instead, sequenced so status
 * only becomes "authenticated" after that load finishes — by the time this subscriber's guard
 * below can pass, the load has already happened, so it never echoes a fresh load back as a save.
 */
export function initDatasetSync() {
  if (initialized) return;

  initialized = true;

  useDatasetStore.subscribe(() => {
    if (useAuthStore.getState().status !== "authenticated") return;

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(pushToRemote, SYNC_DEBOUNCE_MS);
  });
}
