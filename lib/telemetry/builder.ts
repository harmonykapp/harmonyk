"use client";

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
  // Stub for now; hook PostHog or other analytics here later.
  // Keeping it simple so we can see something in the console.
  // eslint-disable-next-line no-console
  console.log(`[telemetry] ${event}`, payload);
}

