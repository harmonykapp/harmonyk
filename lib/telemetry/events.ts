/**
 * Back-compat wrapper (PGW4).
 *
 * Some pages were wired to import `track()` from here during scaffolding.
 * To avoid duplicate telemetry implementations, this now forwards into
 * the canonical PostHog-safe wrapper in `lib/telemetry.ts`.
 */
import { trackEvent } from "@/lib/telemetry";
import type { TelemetryEvent, TelemetryPayload } from "@/lib/telemetry";

export type EventName = TelemetryEvent;

export function track(event: EventName, props?: TelemetryPayload): void {
  trackEvent(event, props);
}

