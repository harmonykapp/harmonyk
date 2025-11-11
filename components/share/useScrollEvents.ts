"use client";

import { useEffect } from "react";

type Options = {
  onTop?: () => void;
  onBottom?: () => void;
  onScroll?: (y: number) => void;
  offset?: number; // px tolerance from top/bottom
};

/**
 * Simple scroll observer for share pages.
 * Fires onTop/onBottom with a small offset tolerance and always calls onScroll with scrollY.
 */
export default function useScrollEvents(opts: Options = {}) {
  const { onTop, onBottom, onScroll, offset = 0 } = opts;

  useEffect(() => {
    function handler() {
      const y = window.scrollY || 0;
      const doc = document.documentElement;
      const max = Math.max(0, doc.scrollHeight - window.innerHeight);

      if (onScroll) onScroll(y);
      if (onTop && y <= offset) onTop();
      if (onBottom && y >= Math.max(0, max - offset)) onBottom();
    }

    window.addEventListener("scroll", handler, { passive: true });
    // fire once on mount
    handler();

    return () => window.removeEventListener("scroll", handler);
  }, [onTop, onBottom, onScroll, offset]);
}
