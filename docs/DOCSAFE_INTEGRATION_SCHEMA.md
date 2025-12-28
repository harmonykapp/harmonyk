# DocSafe Integration Schema — Harmonyk Future Proofing (v2025-12-22)

This file codifies the **minimal** DB/schema scaffolding required to integrate DocSafe
(**DocSafe Drive** + **DocSafe Sentinel**) into Harmonyk after PGW1, without refactoring
the core data model.

## Design goals
- Add DocSafe-ready fields without breaking existing workflows.
- Keep DocSafe event ingest **generic** so 3rd parties can use it later.
- Avoid premature coupling (no hard foreign keys, no new RLS until integration is live).

## Enums
All enums are namespaced with `docsafe_*`:
- `docsafe_storage_backend`: `harmonyk_standard | gdrive | docsafe_drive | external`
- `docsafe_proof_status`: `none | pending | anchored | failed`
- `docsafe_share_backend`: `harmonyk | docsafe`
- `docsafe_actor_type`: `user | guest | service`

## New tables

### 1) `docsafe_object_links`
Maps a Harmonyk document to a DocSafe object id (once created).

Key fields:
- `harmonyk_document_id` (PK)
- `docsafe_object_id`
- `storage_backend`

### 2) `docsafe_version_links`
Maps a Harmonyk document version to a DocSafe version id and proof state.

Key fields:
- `harmonyk_version_id` (PK)
- `harmonyk_document_id`
- `docsafe_object_id`
- `docsafe_version_id`
- `content_hash_sha256`
- `canonicalization_version`
- `byte_size`
- `proof_status`, `proof_request_id`, `proof_receipt_id`, `proof_root_id`

### 3) `docsafe_share_links`
Allows seamless migration of sharing from Harmonyk to DocSafe, without changing UX.

Key fields:
- `harmonyk_share_id` (PK)
- `harmonyk_document_id`
- `harmonyk_version_id`
- `share_backend`
- `docsafe_share_id`
- `share_policy` (JSONB)
- optional engagement counters

### 4) `docsafe_event_outbox`
The integration spine: Harmonyk writes normalized events here; a worker later ships them to
DocSafe `/v1/events:ingest`.

Key fields:
- `idempotency_key` (unique)
- `event_type` (string)
- `actor_type`, `actor_id`, `org_id`
- `harmonyk_document_id`, `harmonyk_version_id`, `harmonyk_share_id`
- `payload` (JSONB)
- delivery fields: `status`, `attempt_count`, `next_attempt_at`, `last_error`

## Optional column adds (only if the tables exist)
The migration conditionally adds DocSafe fields to common Harmonyk tables.
If your table names differ, the new link/outbox tables still work and can be used
as the integration contract.

### documents
- `storage_backend`
- `external_object_id`
- `classification`
- `retention_policy_id`
- `legal_hold`

### document_versions / versions
- `content_hash_sha256`
- `canonicalization_version`
- `byte_size`
- `proof_status`
- `proof_receipt_id`
- `proof_root_id`

### shares
- `share_backend`
- `external_share_id`
- `share_policy`

### activity_log / activity_logs
- `event_type`
- `actor_type`
- `idempotency_key`
- `schema_version`

## Canonical event types (examples)
This is a recommended naming scheme; keep them stable.

Sharing:
- `share.created`
- `share.viewed`
- `share.downloaded`
- `share.revoked`
- `share.expired`

Workflow:
- `workflow.started`
- `workflow.step_assigned`
- `workflow.step_completed`
- `workflow.step_rejected`

Signatures:
- `signature.envelope_created`
- `signature.sent`
- `signature.signer_viewed`
- `signature.signer_authenticated`
- `signature.signer_signed`
- `signature.completed`

Proof:
- `proof.requested`
- `proof.anchored`
- `proof.failed`
- `proof.verified`

## Next steps when DocSafe build starts
1) Add a background worker/cron to send `docsafe_event_outbox` → DocSafe API.
2) Add webhook endpoints in Harmonyk for:
   - `proof.anchored`
   - `share.viewed` / `share.downloaded`
3) Add RLS policies on the new tables based on Harmonyk's org/workspace membership model.

