import { create } from "zustand";
import { privateApi } from "@/lib/axios";
import { getChatHistory } from "@/services/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface LimitedProduct {
  id: number;
  title: string;
  price: number;
  rating: number;
  thumbnail: string;
}

interface ChatState {
  messages: ChatMessage[];
  lastProducts: LimitedProduct[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    {
      id: "initial",
      role: "assistant",
      content: "Hi there! I'm your SmartCart AI assistant. I can help you find products, filter the catalog, and answer questions. What are you looking for today?",
    }
  ],
  lastProducts: [],
  isOpen: false,
  isLoading: false,
  error: null,

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  clearHistory: () => {
    set({
      messages: [{
        id: Date.now().toString(),
        role: "assistant",
        content: "Hi there! I'm your SmartCart AI assistant. I can help you find products, filter the catalog, and answer questions. What are you looking for today?",
      }],
      lastProducts: [],
      error: null,
    });
    if (typeof window !== 'undefined') {
      new BroadcastChannel('smartcart_chat_sync').postMessage('sync_history');
    }
  },

  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // The frontend needs to send only role and content
      const payloadMessages = get().messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // The backend expects { messages, lastProducts }
      const response = await privateApi.post("/ai/chat", {
        messages: payloadMessages,
        lastProducts: get().lastProducts,
      });

      const data = response.data;

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.reply,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        lastProducts: data.products?.length > 0 ? data.products : state.lastProducts,
        isLoading: false,
      }));
      
      if (typeof window !== 'undefined') {
        new BroadcastChannel('smartcart_chat_sync').postMessage('sync_history');
      }
    } catch (error) {
      console.error("Chat error:", error);
      set({
        isLoading: false,
        error: "Failed to connect to the AI assistant. Please try again.",
      });
    }
  },

  loadHistory: async () => {
    try {
      console.log("[loadHistory] Starting fetch...");
      set({ isLoading: true, error: null });
      const history = await getChatHistory();
      console.log("[loadHistory] Fetched history length:", history?.length);
      
      if (history && history.length > 0) {
        set({
          messages: history.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content
          })),
          isLoading: false
        });
        console.log("[loadHistory] Updated messages in state");
      } else {
        set({ isLoading: false });
        console.log("[loadHistory] No history found, keeping defaults");
      }
    } catch (error) {
      console.error("[loadHistory] Failed to load chat history:", error);
      set({ isLoading: false });
    }
  },
}));

// Setup BroadcastChannel for cross-tab synchronization
const chatSyncChannel = typeof window !== 'undefined' ? new BroadcastChannel('smartcart_chat_sync') : null;

if (chatSyncChannel) {
  chatSyncChannel.onmessage = (event) => {
    if (event.data === 'sync_history') {
      // Avoid calling loadHistory if we're already loading to prevent infinite loops/spam
      if (!useChatStore.getState().isLoading) {
        useChatStore.getState().loadHistory();
      }
    }
  };
}
