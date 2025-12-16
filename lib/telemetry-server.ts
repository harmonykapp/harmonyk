// lib/telemetry-server.ts
// Minimal structured server-side logging for Harmonyk.
// No external deps; safe for local dev and Beta.

export type TelemetryEventBase = {
  event: string;
  userId?: string | null;
  orgId?: string | null;
  docId?: string | null;
  source?: string | null; // e.g. "workbench", "builder", "vault", "mono", "activity"
  route?: string | null;
  durationMs?: number | null;
  properties?: Record<string, unknown>;
};

export function logServerEvent(event: TelemetryEventBase) {
  // Use a consistent label for easy grepping in logs.
  // eslint-disable-next-line no-console
  console.info("[telemetry:event]", {
    ...event,
    timestamp: new Date().toISOString(),
  });
}

export function logServerError(
  event: TelemetryEventBase & {
    error: unknown;
  },
) {
  // eslint-disable-next-line no-console
  console.error("[telemetry:error]", {
    ...event,
    error:
      event.error instanceof Error
        ? {
            name: event.error.name,
            message: event.error.message,
            stack: event.error.stack,
          }
        : event.error,
    timestamp: new Date().toISOString(),
  });
}

