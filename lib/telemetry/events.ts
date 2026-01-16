// Minimal telemetry helper (silent in prod if not configured)
type EventName =
  | "ui.sidebar.toggle"
  | "nav.rooms.open";

export function track(event: EventName, props?: Record<string, unknown>) {
  try {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[telemetry]", event, props ?? {});
    }
  } catch {}
}

