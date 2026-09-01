import type { AIAnalysis } from "./aiService";
import type { DatasetAnalysis, DatasetHistoryEntry } from "../store/datasetStore";
import { API_BASE_URL } from "../config";

const API_BASE = `${API_BASE_URL}/api/dataset`;

export interface RemoteDatasetState {
  data: Record<string, string>[];
  fileName: string | null;
  analysis: DatasetAnalysis | null;
  aiAnalysis: AIAnalysis | null;
  history: DatasetHistoryEntry[];
}

async function datasetFetch<T>(options: RequestInit = {}): Promise<T> {
  const response = await fetch(API_BASE, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const errorBody: { error?: string } | null = await response.json().catch(() => null);

    throw new Error(errorBody?.error ?? `Request failed (HTTP ${response.status}).`);
  }

  return response.json();
}

/** Loads the signed-in user's saved dataset state from their account. */
export async function loadRemoteDataset(): Promise<RemoteDatasetState> {
  return datasetFetch<RemoteDatasetState>();
}

/** Overwrites the signed-in user's saved dataset state — the whole persisted slice at once. */
export async function saveRemoteDataset(state: RemoteDatasetState): Promise<void> {
  await datasetFetch<{ ok: true }>({ method: "PUT", body: JSON.stringify(state) });
}
