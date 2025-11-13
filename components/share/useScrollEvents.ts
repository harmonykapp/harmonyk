"use client";

import { phCapture } from "@/lib/posthog-client";
import { useEffect, useMemo, useRef } from "react";

type Options = {
  /** Scroll thresholds to emit events at (0–1) */
  thresholds?: number[];
  /** Optional share id when using object form */
  shareId?: string;
};

const DEFAULT_THRESHOLDS: number[] = [0.33, 0.66, 0.95];

function toScrollPercent(value: number): 33 | 66 | 95 | null {
  const rounded = Math.round(value * 100);
  switch (rounded) {
    case 33:
      return 33;
    case 66:
      return 66;
    case 95:
      return 95;
    default:
      return null;
  }
}

/**
 * Logs "share_open" once on mount, then threshold-specific scroll events.
 * Call as:
 *   useScrollEvents("share_123")              // string form
 *   useScrollEvents({ shareId: "share_123" }) // object form
 */
export default function useScrollEvents(arg?: string | Options) {
  const shareId = typeof arg === "string" ? arg : arg?.shareId;
  const thresholds = useMemo(
    () => (typeof arg === "object" && arg?.thresholds ? [...arg.thresholds] : [...DEFAULT_THRESHOLDS]),
    [arg]
  );

  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

  const sent = useRef<Record<number, boolean>>({});

  // Without id, do nothing
  useEffect(() => {
    if (!shareId || !isBrowser) return;

    void fetch("/api/events/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "share_open", shareId }),
    });
    phCapture("share_open", { shareId });
  }, [isBrowser, shareId]);

  useEffect(() => {
    if (!shareId || !isBrowser) return;

    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      const ratio = total <= 0 ? 1 : el.scrollTop / total;

      thresholds.forEach((t) => {
        if (ratio >= t && !sent.current[t]) {
          const percent = toScrollPercent(t);
          if (!percent) return;

          sent.current[t] = true;
          void fetch("/api/events/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "share_scroll", shareId, at: percent }),
          });

          phCapture("share_scroll", { shareId, percent });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isBrowser, shareId, thresholds]);
}
