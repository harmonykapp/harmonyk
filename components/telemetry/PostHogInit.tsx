"use client";

import { useEffect } from "react";
import { initPosthog } from "@/lib/posthog-client";

export default function PostHogInit() {
  useEffect(() => {
    initPosthog(); // safe no-op if no NEXT_PUBLIC_POSTHOG_KEY
  }, []);

  return null;
}


