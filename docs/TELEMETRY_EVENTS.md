# Telemetry Events (GA)

## Share flow
- `share_open` { shareId, ts }
- `scroll_33`  { shareId, ts }
- `scroll_66`  { shareId, ts }
- `scroll_95`  { shareId, ts }

## Signatures
- `sign_send`      { docId, provider: "documenso", ts }
- `sign_complete`  { docId, provider: "documenso", ts }

## Workbench (optional if implemented)
- `workbench_view` { ts }
- `triage_view`    { count, ts }
