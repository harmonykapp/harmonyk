# Contracts Status & Category Model — Week 12 Day 1

This document summarizes the **data model for Contracts GA** introduced in Week 12 Day 1.
It also introduces the `renewal_date` field used by Playbooks/Tasks for renewal reminders.

It is the source of truth for:

- Contract categories

- Contract status lifecycle

- The `contract_metadata` table

---

## Contract Categories

All contracts in the **Contracts Builder** live under **Legal Contracts**, with three subfolders / categories:

1. **Operational & HR** (`operational_hr`)

   - NDAs (mutual / one-way)

   - Employment / HR docs (employment agreements, offer letters, confidentiality, termination/severance, warnings, reviews, promotion, transfer, reference letters)

   - Contractor / consulting agreements

   - MSAs / SOWs

   - Website / SaaS operational docs (SaaS agreements, DPA basics, Online Privacy Policy)

2. **Corporate & Finance** (`corporate_finance`)

   - Founders / shareholders agreements

   - Share Purchase / Asset Purchase agreements

   - Loan / lease / investor-related contracts

   - JV, partnership, corporate structure documents

3. **Commercial & Dealmaking** (`commercial_dealmaking`)

   - MOUs, LOIs

   - Reseller, distribution, franchise

   - Licensing, supply, manufacturing

   - Referral, commercial MSAs, NCND, other revenue/deal-focused instruments

Notes:

- A single contract may be **searchable under multiple categories** via tags (e.g. NDA appears under both Operational & HR and Commercial & Dealmaking).

- The **primary category** is stored in `contract_metadata.category` and drives navigation in the Builder tree.

---

## Contract Status Lifecycle

GA contract lifecycle is:

```text
draft → in_review → approved → signed → active → expired
```

- `draft` — Newly created contract from the Builder; not yet sent out.

- `in_review` — Shared for review (internal or external) but not yet approved.

- `approved` — Internally approved version ready for signing.

- `signed` — Signature process completed.

- `active` — Operational, in-force contract (often same as `signed`, but allows workflow flexibility).

- `expired` — End date reached or manually marked as no longer active.

The current status is stored in `contract_metadata.status`.

### `renewal_date`

The `contract_metadata` table includes:

- `renewal_date date null`

Purpose:

- Represents the key date used to determine when a contract should be renewed, extended, or renegotiated.

- May be:

  - A true renewal date (for recurring/auto-renewing agreements).

  - An expiry date (for fixed-term agreements).

- Playbooks and Tasks use this field to compute renewal reminders (e.g. 30 days before `renewal_date`).

All status changes should emit Activity events (e.g. `contract_status_changed`) for use in **Insights** and **Playbooks**.

---

## `contract_metadata` Table

The `public.contract_metadata` table is the **org-scoped metadata layer** for contract documents stored in Vault.

Key fields:

- `org_id` — Org/workspace that owns the contract.

- `doc_id` — The underlying Vault document ID for this contract.

- `primary_template_id` — The canonical template used to create this contract (if applicable).

- `canonical_type` — Logical type identifier (e.g. `nda_mutual`, `employment_agreement`, `contractor_individual`).

- `category` — One of `operational_hr`, `corporate_finance`, `commercial_dealmaking`.

- `status` — One of `draft`, `in_review`, `approved`, `signed`, `active`, `expired`.

- `tags` — Array of text tags used for search/filtering (e.g. `nda`, `msa`, `hr`, `equity`, `reseller`).

Indexes:

- `contract_metadata_org_id_idx` — For org-scoped queries.

- `contract_metadata_doc_id_idx` — For quick lookups by document.

- `contract_metadata_status_idx` — For status-based dashboards and filters.

- `contract_metadata_category_idx` — For category pivots (e.g. Operational & HR vs Commercial deals).

- `contract_metadata_renewal_date_idx` — For renewal date queries and Playbook triggers.

This table is intentionally separate from the core Vault documents table so that:

- Contract-specific metadata can evolve without disrupting other document types.

- Future builders (Decks, Accounts) can have their own specialized metadata if required.

---

## Renewal Playbook & Tasks (Data Glue)

Renewal automation depends on:

- `contract_metadata.status`

- `contract_metadata.renewal_date`

- Tasks table (`public.tasks`), which stores:

  - `title`, `status`, `due_at`, `doc_id`, `source`

The intended GA behavior:

- When a contract reaches `signed` / `active` and has a `renewal_date`, a built-in Playbook will:

  - Create a renewal Task with `due_at = renewal_date - 30 days` (fallback: 30 days from today if `renewal_date` is null).

  - Link that Task to the contract via `doc_id` so it appears in `/tasks` and on Workbench.

