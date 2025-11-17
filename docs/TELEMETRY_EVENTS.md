# Telemetry Events (GA)

## Share flow
- `share_open` { shareId, ts }
- `scroll_33`  { shareId, ts }
- `scroll_66`  { shareId, ts }
- `scroll_95`  { shareId, ts }

## Signatures
- `sign_send`      { docId, provider: "documenso", ts }
- `sign_complete`  { docId, provider: "documenso", ts }

## Builder & Vault
- `builder_generate` { templateId, triage, ts }
- `builder_save` { docId, templateId, version, ts }
- `vault_view_doc` { docId, ts }
- `vault_download_doc` { docId, ts }
- `vault_share_created` { docId, shareId, access, ts }
- `vault_open_builder` { docId, ts }

## Workbench (optional if implemented)
- `workbench_view` { ts }
- `triage_view`    { count, ts }
