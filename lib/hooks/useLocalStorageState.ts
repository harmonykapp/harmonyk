"use client";

import { useEffect, useState } from "react";

/**
 * Hydration-safe hook for localStorage-backed state.
 * 
 * IMPORTANT: The initial state is ALWAYS the provided default value on both
 * server and first client render. localStorage is only read in useEffect
 * after mount, preventing hydration mismatches.
 * 
 * @param key - localStorage key
 * @param defaultValue - Initial value (used on server and first client render)
 * @returns [state, setState] tuple
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // CRITICAL: Always use defaultValue for initial render (server + first client render)
  const [state, setState] = useState<T>(defaultValue);

  // Load from localStorage AFTER mount (prevents hydration mismatch)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        try {
          const parsed = JSON.parse(stored) as T;
          setState(parsed);
        } catch {
          // If JSON parse fails, try as string
          const stringValue = stored as unknown as T;
          setState(stringValue);
        }
      }
    } catch {
      // Ignore localStorage errors (private mode, blocked, etc.)
    }
  }, [key]);

  // Persist to localStorage when state changes
  useEffect(() => {
    try {
      if (typeof state === "string") {
        window.localStorage.setItem(key, state);
      } else {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [key, state]);

  return [state, setState];
}

