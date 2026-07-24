"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Global cache for the current session ID in memory
let globalSid: string | null = null;

function getSid(searchParamsSid: string | null): string | null {
  if (typeof window === "undefined") return null;
  if (globalSid) return globalSid;
  if (searchParamsSid) {
    globalSid = searchParamsSid;
    sessionStorage.setItem("current_sid", searchParamsSid);
    return globalSid;
  }
  const sessionSid = sessionStorage.getItem("current_sid");
  if (sessionSid) {
    globalSid = sessionSid;
    return globalSid;
  }
  return null;
}

function ensureSid(): string {
  if (!globalSid) {
    globalSid = crypto.randomUUID().split("-")[0];
    sessionStorage.setItem("current_sid", globalSid);
  }
  
  const url = new URL(window.location.href);
  if (url.searchParams.get("sid") !== globalSid) {
    url.searchParams.set("sid", globalSid);
    window.history.replaceState(window.history.state, "", url.toString());
  }
  
  return globalSid;
}

/**
 * A hook that synchronizes state with localStorage under a unique Session ID (`sid`).
 * It injects the `sid` into the URL query parameters silently, allowing the exact
 * state to be restored if a user copies and pastes the URL into a new tab.
 * 
 * @param key The unique identifier for this piece of state in localStorage
 * @param initialState The default state
 * @param isActive A function determining if the state has been modified and should trigger a sync
 */
export function useTabState<T>(
  key: string,
  initialState: T,
  isActive: (state: T) => boolean,
  enabled: boolean = true
) {
  const searchParams = useSearchParams();
  const searchSid = searchParams.get("sid");

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined" || !enabled) return initialState;
    const sid = getSid(searchSid);
    
    if (sid) {
      const persisted = localStorage.getItem(`tabstate_${key}_${sid}`);
      if (persisted) {
        try {
          return JSON.parse(persisted);
        } catch (e) {
          console.error("Failed to parse tabstate:", e);
        }
      }
    }
    return initialState;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    // Do not generate an SID or write to localStorage if there's no active state
    // and an SID hasn't been established yet
    if (!isActive(state) && !getSid(searchSid)) return;

    const sid = ensureSid();
    const storageKey = `tabstate_${key}_${sid}`;
    const newValue = JSON.stringify(state);
    
    // Only write if the value is actually different to prevent cross-tab infinite loops
    if (localStorage.getItem(storageKey) !== newValue) {
      localStorage.setItem(storageKey, newValue);
    }
  }, [state, key, isActive, searchSid, enabled]);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    const handleStorage = (e: StorageEvent) => {
      const sid = getSid(searchSid);
      if (!sid) return;
      
      const storageKey = `tabstate_${key}_${sid}`;
      if (e.key === storageKey && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse cross-tab state:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, searchSid, enabled]);

  return [state, setState] as const;
}
