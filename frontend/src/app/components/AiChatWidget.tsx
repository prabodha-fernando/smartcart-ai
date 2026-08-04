"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronDown } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";

export default function AiChatWidget() {
  const { messages, isOpen, isLoading, error, toggleChat, sendMessage, loadHistory } = useChatStore();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const hasFetchedHistory = useRef(false);

  useEffect(() => {
    // We MUST wait for authStore to hydrate AND ensure the user is logged in
    // otherwise the API request fails with 401 and causes a redirect loop to /login!
    console.log("[AiChatWidget] Effect triggered", { hasHydrated, isAuthenticated, hasFetched: hasFetchedHistory.current });
    if (hasHydrated && isAuthenticated && !hasFetchedHistory.current) {
      console.log("[AiChatWidget] Fetching history now...");
      hasFetchedHistory.current = true;
      loadHistory();
    }
  }, [hasHydrated, isAuthenticated, loadHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl rounded-2xl w-[380px] sm:w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] flex flex-col mb-4 overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Sparkles size={20} className="text-blue-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">SmartCart AI</h3>
                  <p className="text-blue-200 text-xs font-medium">Your personal shopping assistant</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
              >
                <ChevronDown size={24} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((message) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${message.role === "assistant"
                    ? "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600"
                    : "bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-600 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-300"
                    }`}>
                    {message.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
                  </div>

                  <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${message.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 text-zinc-800 dark:text-zinc-200 rounded-tl-sm"
                    }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center shadow-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center p-3"
                >
                  <div className="inline-block bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/30">
                    {error}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 dark:text-white placeholder:text-zinc-400 transition-all shadow-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-lg transition-colors active:scale-95 flex items-center justify-center shadow-sm"
                >
                  <Send size={16} className={input.trim() && !isLoading ? "translate-x-0.5" : ""} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-white transition-all overflow-hidden relative ${isOpen
          ? "bg-zinc-800 hover:bg-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={28} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
