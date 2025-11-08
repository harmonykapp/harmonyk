"use client";

import { useEffect } from "react";
import { initPosthog } from "@/lib/posthog-client";

export default function AnalyticsInit() {
  useEffect(() => {
    initPosthog(); // safe no-op if no NEXT_PUBLIC_POSTHOG_KEY
  }, []);

  return null; // nothing to render
}
