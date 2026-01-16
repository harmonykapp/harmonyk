import { trackEvent } from "@/lib/telemetry";

// Back-compat shim: map early PGW4 event names to canonical TelemetryEvent names.
type LegacyEventName = "ui.sidebar.toggle" | "nav.rooms.open";

function mapLegacyEvent(event: LegacyEventName): "ui_sidebar_toggled" | "rooms_opened" {
  if (event === "ui.sidebar.toggle") return "ui_sidebar_toggled";
  return "rooms_opened";
}

export function track(event: LegacyEventName, props?: Record<string, unknown>) {
  trackEvent(mapLegacyEvent(event), props);
}

