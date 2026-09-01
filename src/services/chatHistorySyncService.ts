import type { ChatMessage } from "./aiService";
import { API_BASE_URL } from "../config";

const API_BASE = `${API_BASE_URL}/api/chat-history`;

async function chatHistoryFetch<T>(options: RequestInit = {}): Promise<T> {
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

/** Loads the signed-in user's saved chat history from their account. */
export async function loadRemoteChatHistory(): Promise<ChatMessage[]> {
  const result = await chatHistoryFetch<{ messages: ChatMessage[] }>();

  return result.messages;
}

/** Overwrites the signed-in user's saved chat history — the whole conversation at once. */
export async function saveRemoteChatHistory(messages: ChatMessage[]): Promise<void> {
  await chatHistoryFetch<{ ok: true }>({ method: "PUT", body: JSON.stringify({ messages }) });
}
