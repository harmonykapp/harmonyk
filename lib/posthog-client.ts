// lib/posthog-client.ts
import posthog from "posthog-js";

export function initPosthog() {
  // Only run in the browser
  if (typeof window === "undefined") return;

  // Accept either NEXT_PUBLIC_POSTHOG_KEY or POSTHOG_KEY
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY;

  // If no key is set, do nothing (safe no-op)
  if (!key) return;

  // Initialize once
  // @ts-expect-error — posthog doesn't type __loaded
  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: "https://app.posthog.com",
      persistence: "localStorage",
    });
  }
}
