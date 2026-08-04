"use client";

import {
  forwardRef,
  Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Bot, X } from "lucide-react";
import AIAssistant, { type AIAssistantHandle } from "@/components/ai/AIAssistant";
import type { LimitedProduct } from "@/types/product";

export interface FloatingAIAssistantHandle {
  open: () => void;
  openWithPrompt: (prompt: string) => void;
}

function FloatingAIAssistant(
  { contextProduct }: { contextProduct?: LimitedProduct },
  ref: Ref<FloatingAIAssistantHandle>
) {
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const assistantRef = useRef<AIAssistantHandle>(null);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    openWithPrompt: (prompt: string) => {
      const value = prompt.trim();
      if (!value) return;
      setPendingPrompt(value);
      setOpen(true);
    },
  }));

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (pendingPrompt) {
        assistantRef.current?.submitPrompt(pendingPrompt);
        setPendingPrompt(null);
        return;
      }
      assistantRef.current?.focusComposer();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open, pendingPrompt]);

  return (
    <>
      <motion.aside
        id="floating-ai-assistant"
        initial={false}
        animate={
          open
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 16, scale: 0.98 }
        }
        aria-hidden={!open}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-4 bottom-24 z-[60] max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[1.35rem] border border-white/70 bg-white/86 shadow-[0_24px_70px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:left-auto sm:right-6 sm:w-[min(36rem,calc(100vw-3rem))] md:bottom-28 ${
          open ? "visible pointer-events-auto" : "invisible pointer-events-none"
        }`}
      >
            <div className="flex items-center justify-between border-b border-slate-100/80 px-3.5 py-2.5">
              <span className="label-caps text-blue-700">AI Assistant</span>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close AI assistant"
              >
                <X size={17} />
              </button>
            </div>
            <div className="p-2.5 sm:p-3">
              <AIAssistant ref={assistantRef} contextProduct={contextProduct} />
            </div>
      </motion.aside>

      <button
        onClick={() => setOpen((current) => !current)}
        className="brand-gradient fixed bottom-6 right-6 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_18px_44px_rgba(0,74,198,0.34)] ring-4 ring-white/70 motion-safe:transition motion-safe:hover:scale-105 md:bottom-10 md:right-10 md:h-16 md:w-16"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        aria-controls="floating-ai-assistant"
        aria-expanded={open}
      >
        {open ? <X size={24} /> : <Bot size={26} />}
      </button>
    </>
  );
}

export default forwardRef(FloatingAIAssistant);
