let inited = false;
let enabled = false;
type PosthogInitOptions = {
  api_host: string;
  persistence: string;
  disable_session_recording?: boolean;
};

type PosthogClient = {
  init?: (key: string, options: PosthogInitOptions) => void;
  capture?: (event: string, properties?: Record<string, unknown>) => void;
  identify?: (distinctId: string, props?: Record<string, unknown>) => void;
  reset?: () => void;
};
let posthogClient: PosthogClient | null = null;

function isAnalyticsDisabled(): boolean {
  // Client-safe env flags (optional).
  // If set to "1" or "true", PostHog is completely disabled.
  const v =
    process.env.NEXT_PUBLIC_ANALYTICS_DISABLED ||
    process.env.NEXT_PUBLIC_POSTHOG_DISABLED;
  return v === "1" || v === "true";
}

function getPosthogConfig(): { key: string | null; host: string } {
  // Only use NEXT_PUBLIC_ vars on the client
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
  return { key: key.trim() ? key.trim() : null, host };
}

/**
 * Initialize PostHog on the client only.
 * - No-op if key missing
 * - No-op on server
 * - No-op if already initialized
 */
export async function initPosthog() {
  if (typeof window === "undefined") return; // server render
  if (inited) return;
  if (isAnalyticsDisabled()) return;

  const { key, host } = getPosthogConfig();
  if (!key) return; // safe no-op if not configured

  try {
    // Lazy-load so the app can run even if PostHog is removed later.
    const mod = (await import("posthog-js")) as { default?: PosthogClient };
    posthogClient = mod?.default ?? null;

    if (!posthogClient?.init) return;

    posthogClient.init(key, {
      api_host: host,
      persistence: "localStorage",
      disable_session_recording: true,
      // optional tweaks:
      // capture_pageview: true,
      // capture_pageleave: true,
      // autocapture: true,
    });

    enabled = true;
    inited = true;

    // Expose only the initialized instance for devtools.
    (window as unknown as { posthog?: PosthogClient }).posthog = posthogClient;
  } catch {
    // Fail closed: analytics disabled, app continues normally.
    enabled = false;
    inited = true; // prevent retry loops
  }
}

export function getPosthogClient(): PosthogClient | null {
  if (typeof window === "undefined") return null;
  if (!enabled) return null;
  return posthogClient;
}

/** Convenience wrappers (safe no-ops on server) */
export function phCapture(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  if (isAnalyticsDisabled()) return;
  const { key } = getPosthogConfig();
  if (!key) return;
  if (!enabled || !posthogClient?.capture) return;
  try {
    posthogClient.capture(event, properties);
  } catch {
    // no-op
  }
}

export function phIdentify(distinctId: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (isAnalyticsDisabled()) return;
  const { key } = getPosthogConfig();
  if (!key) return;
  if (!enabled || !posthogClient?.identify) return;
  try {
    posthogClient.identify(distinctId, props);
  } catch {
    // no-op
  }
}

export function phReset() {
  if (typeof window === "undefined") return;
  if (isAnalyticsDisabled()) return;
  const { key } = getPosthogConfig();
  if (!key) return;
  if (!enabled || !posthogClient?.reset) return;
  try {
    posthogClient.reset();
  } catch {
    // no-op
  }
}
