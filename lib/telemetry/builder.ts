"use client";

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

type BuilderEventName =
  | "builder_generate"
  | "builder_generate_failed"
  | "deck_generated"
  | "deck_saved"
  | "deck_exported";

type BuilderEventPayload = Record<string, unknown>;

export function logBuilderEvent(
  event: BuilderEventName,
  payload: BuilderEventPayload = {},
): void {
  try {
    if (typeof window !== "undefined" && window.posthog?.capture) {
      window.posthog.capture(event, payload);
      return;
    }
  } catch {
    // Fall through to console logging
  }

  // Fallback for local/dev when analytics is not wired
  // eslint-disable-next-line no-console
  console.debug(`[builder_telemetry] ${event}`, payload);
}

