"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { LEGACY_THEME_STORAGE_KEY } from "@/lib/legacy-keys";

// Re-export hook so existing imports like:
//   import { useTheme } from "@/components/theme-provider";
// keep working.
export { useTheme } from "next-themes";

const THEME_STORAGE_KEY = "harmonyk-theme";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    try {
      const existing = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (existing != null) return;
      const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
      if (legacy != null) window.localStorage.setItem(THEME_STORAGE_KEY, legacy);
    } catch {
      // ignore
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
