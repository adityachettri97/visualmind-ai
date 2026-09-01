import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "../services/aiService";

interface ChatState {
  messages: ChatMessage[];

  addMessages: (messages: ChatMessage[]) => void;
  /** Replaces the whole conversation — used to hydrate from the account on login. */
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],

      addMessages: (messages) => set((state) => ({ messages: [...state.messages, ...messages] })),

      setMessages: (messages) => set({ messages }),

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "visualmind-chat",
    },
  ),
);
