const ALLOWED_EVENT_TYPES = [
  "doc_generated",
  "doc_saved_to_vault",
  "mono_query",
  "analyze_completed",
  "playbook_run_started",
  "playbook_run_completed",
  "playbook_run_failed",
  "signature_request_sent",
  "signature_completed",
  // Connector events
  "connector_sync_started",
  "connector_sync_completed",
  "connector_sync_failed",
];

export { ALLOWED_EVENT_TYPES };

export async function GET() {
  return new Response(JSON.stringify({ allowedEventTypes: ALLOWED_EVENT_TYPES }), {
    headers: { "Content-Type": "application/json" },
  });
}

