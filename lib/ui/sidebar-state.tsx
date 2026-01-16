"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarState | undefined>(undefined);
const STORAGE_KEY = "ui:sidebarCollapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Deterministic SSR default to avoid hydration mismatch:
  // Server renders expanded; client reads storage after mount.
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw != null) {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === "boolean") {
          setCollapsed(parsed);
        }
      }
    } catch {
      // ignore storage/parse issues
    } finally {
      hasHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // noop: storage might be unavailable in some environments
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  const value = useMemo(() => ({ collapsed, setCollapsed, toggle }), [collapsed, toggle]);

  return React.createElement(SidebarContext.Provider, { value }, children);
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}

