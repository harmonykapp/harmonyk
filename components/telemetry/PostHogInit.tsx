"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { initPosthog } from "@/lib/posthog-client";

export default function PostHogInit() {
  useEffect(() => {
    initPosthog(); // safe no-op if no NEXT_PUBLIC_POSTHOG_KEY

    // DevTools convenience (harmless if PostHog isn't configured)
    (window as unknown as { posthog?: unknown }).posthog = posthog;
  }, []);

  return null;
}


