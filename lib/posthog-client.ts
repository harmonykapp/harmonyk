// lib/posthog-client.ts
import posthog from "posthog-js";

let inited = false;

/**
 * Initialize PostHog on the client only.
 * - No-op if key missing
 * - No-op on server
 * - No-op if already initialized
 */
export function initPosthog() {
  if (typeof window === "undefined") return; // server render
  if (inited) return;

  // Only use NEXT_PUBLIC_ vars on the client
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (!key) return; // safe no-op if not configured

  posthog.init(key, {
    api_host: host,
    persistence: "localStorage",
    // optional tweaks:
    // capture_pageview: true,
    // capture_pageleave: true,
    // autocapture: true,
  });

  inited = true;
}

/** Convenience wrappers (safe no-ops on server) */
export function phCapture(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function phIdentify(distinctId: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(distinctId, props);
}

export function phReset() {
  if (typeof window === "undefined") return;
  posthog.reset();
}
