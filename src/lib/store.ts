import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatStats } from "@/app/page";

export interface AIInsights {
  connectionAnalysis: string;
  personalityInsights: string[];
  funFacts: string[];
  otherPatterns: string[];
}

export interface FullHistoryItem {
  fileName: string;
  stats: ChatStats;
  aiInsights?: AIInsights | null;
  date: string;
}

interface ChatStore {
  current: FullHistoryItem | null;
  history: Record<string, FullHistoryItem>; // ✅ key-value store
  setStats: (stats: ChatStats, fileName: string) => void;
  setAIInsights: (aiInsights: AIInsights) => void;
  addHistoryItem: (item: FullHistoryItem) => void;
  loadHistoryItem: (fileName: string) => void;
  deleteHistoryItem: (fileName: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      current: null,
      history: {},

      setStats: (stats, fileName) => {
        const newItem: FullHistoryItem = {
          fileName,
          stats,
          aiInsights: null,
          date: new Date().toISOString(),
        };
        set({ current: newItem });
      },

      setAIInsights: (aiInsights) => {
        const current = get().current;
        if (!current) return;

        const updated: FullHistoryItem = { ...current, aiInsights };

        set({
          current: updated,
          history: {
            ...get().history,
            [current.fileName]: updated,
          },
        });
      },

      addHistoryItem: (item) => {
        set((state) => ({
          current: item,
          history: { ...state.history, [item.fileName]: item },
        }));
      },

      loadHistoryItem: (fileName) => {
        const item = get().history[fileName];
        if (item) set({ current: item });
      },

      deleteHistoryItem: (fileName) => {
        const newHistory = { ...get().history };
        delete newHistory[fileName];
        set({
          history: newHistory,
          current: get().current?.fileName === fileName ? null : get().current,
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        current: state.current,
        history: state.history, // ✅ persist both current and history
      }),
    },
  ),
);
