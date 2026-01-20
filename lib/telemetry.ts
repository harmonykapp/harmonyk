import { phCapture } from "@/lib/posthog-client";

export type TelemetryEvent =
  | "ui_sidebar_toggled"
  | "nav_opened"
  | "flow_workbench_view"
  | "flow_workbench_analyze"
  | "flow_workbench_save_to_vault"
  | "flow_workbench_send_for_signature"
  | "flow_playbook_run_started"
  | "rooms_opened"
  | "llm_provider_selected";

export type TelemetryPayload = Record<string, unknown>;

/**
 * Lightweight telemetry wrapper for GA.
 *
 * - No-ops safely if PostHog is not configured.
 * - Swallows runtime errors so product flows never break.
 */
export function trackEvent(event: TelemetryEvent, payload?: TelemetryPayload): void {
  try {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[telemetry]", event, payload ?? {});
    }
    phCapture(event, payload ?? {});
  } catch {
    // Telemetry must never break product flows.
  }
}

