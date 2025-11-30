# Built-in Playbook — Contract Renewal Task

This document describes the **Contract Renewal** built-in Playbook that connects:

- Contract status & metadata (including `renewal_date`)

- Signature completion events

- Internal Tasks (/tasks) for renewal follow-up

This is the logical spec and data glue for Week 12. The execution engine wiring (full Playbooks GA) is scheduled
for Week 15, but this doc ensures the Contracts model is ready and unambiguous.

---

## Trigger

Primary trigger (GA target):

- Event type: `signature_completed` (Documenso → Monolyth)

- Context:

  - `doc_id` — the Vault document ID for the contract

  - `org_id` — workspace/org

  - `envelope_id` — Documenso envelope identifier (for audit)

  - `metadata` — includes contract metadata snapshot, including `renewal_date` if known

Secondary trigger (fallback / manual):

- Status transition:

  - `contract_metadata.status` changes to `signed` or `active`

Either trigger should lead to the same Playbook evaluation: "Should this contract get a renewal task?"

---

## Conditions

The Playbook should run only when:

1. The contract is a **legal contract** under the Contracts Builder:

   - `contract_metadata.type` and/or `contract_metadata.category` mapped to Legal Contracts.

2. The contract has a relevant **status**:

   - `status in ('signed', 'active')`

3. The contract is not already **expired**:

   - `status != 'expired'`

Optional guard (later):

- Avoid duplicate renewal tasks by checking existing open tasks linked to this `doc_id`
  with a renewal-like title or tag.

---

## Renewal Date Logic

Inputs:

- `renewal_date` from `contract_metadata`

- `today` = current date (UTC)

Computation:

- If `renewal_date` is present:

  - `due_at = renewal_date - interval '30 days'`

  - If that date is **in the past**, clamp to `today`:

    - `due_at = greatest(renewal_date - interval '30 days', today)`

- If `renewal_date` is **null**:

  - Fallback:

    - `due_at = today + interval '30 days'`

Result:

- Task should remind the workspace to renew/review the contract **around 30 days before renewal/expiry**,
  or 30 days out if the renewal date is unknown.

---

## Task Shape

Target table (already created in Week 12 prior work):

- `public.tasks` (exact schema defined elsewhere), with key fields:

  - `org_id uuid not null`

  - `user_id uuid null`

  - `source task_source not null` — enum with at least `'activity' | 'mono' | 'manual'`

  - `title text not null`

  - `status task_status not null` — enum with `'open' | 'done'`

  - `due_at timestamptz null`

  - `doc_id uuid null` — link back to Vault document

  - `activity_id uuid null` — optional link back to ActivityLog event

Canonical Task for this Playbook:

- `source`:

  - `'activity'` (triggered by Activity/Signature event)

- `title`:

  - `"Renew contract: <document title>"` (fallback: `"Renew contract"` if title missing)

- `status`:

  - `'open'`

- `due_at`:

  - Computed as described above (renewal_date - 30 days, with clamp/fallback)

- `doc_id`:

  - The Vault document ID of the contract

- `activity_id`:

  - The ActivityLog ID for the triggering `signature_completed` / status-change event (if available)

---

## ActivityLog Expectations

When this Playbook runs, ActivityLog should reflect both:

1. Signature completion:

   - `event_type = 'signature_completed'` (or equivalent existing type)

   - Attributes:

     - `doc_id`, `org_id`, `envelope_id`, `actor` (where possible)

2. Renewal task creation:

   - `event_type = 'task_created'` (or existing `task_created`/`task_opened` variant)

   - Attributes:

     - `task_id`, `doc_id`, `org_id`, `source = 'activity'`

This provides an auditable chain:

`signature_completed` → `task_created (renewal)` → eventual `task_status = 'done'`.

---

## UI Expectations (GA)

Not all of this is wired in Week 12, but the data model and intent are fixed:

- `/tasks`:

  - Renewal tasks appear in the list with:

    - Title: `"Renew contract: <document title>"`

    - Source: `Activity` (or similar label)

    - Due date: as computed above

    - Link to the contract in Vault via `doc_id`

- Workbench:

  - Renewal tasks appear in:

    - Open Tasks

    - Any "What's next?" cards

- Vault (contract detail view, later weeks):

  - Show linked Tasks, including the renewal task and its status.

This doc is the **source of truth** for how the renewal Playbook should behave when the Playbooks engine is wired (Week 15).

