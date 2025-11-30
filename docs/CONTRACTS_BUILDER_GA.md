# Contracts Builder GA — Week 12 Summary

This document is the **source of truth** for the Contracts Builder GA scope delivered in Week 12.

It ties together:

- Data model: templates, clauses, metadata, renewal_date

- Builder UX: /builder Contracts tab

- Library coverage: ~25 canonical templates across 3 categories

- Glue for future automation: renewal Playbook + Tasks

It is meant to guide:

- QA for the Contracts Builder

- Future work (clause graph UI, diffs, deeper Playbooks integration)

---

## 1. Data Model Overview

Core tables and columns (defined in Week 12 migrations):

### 1.1 `contract_templates`

Defined in:

- `supabase/migrations/202511300910_contracts_library_v1.sql`

- `supabase/migrations/202511300930_contracts_library_v2_additional_templates.sql`

Key fields:

- `id uuid primary key`

- `name text not null`

- `canonical_type text not null` — e.g. `nda_mutual`, `msa_services`, `sow_general`

- `category text not null` — enum-like text:

  - `operational_hr`

  - `corporate_finance`

  - `commercial_dealmaking`

- `is_canonical boolean not null default true`

- `alt_group text null` — variant grouping

- `tags text[] null` — search/filter tags

- `risk risk_level null` — `low | medium | high`

- `jurisdiction text null` — e.g. `US-general`

Usage:

- `/builder` loads **canonical** templates:

  - `select ... from contract_templates where is_canonical = true`

- Templates are grouped in the UI by GA categories:

  - `operational_hr` → **Operational & HR**

  - `corporate_finance` → **Corporate & Finance**

  - `commercial_dealmaking` → **Commercial & Dealmaking**

### 1.2 `contract_clauses`

Defined in:

- `supabase/migrations/202511300920_contracts_clauses_v1.sql`

Key fields:

- `id uuid primary key`

- `name text not null`

- `slug text not null unique`

- `category text not null`:

  - `core_business`

  - `risk_liability`

  - `commercial_operational`

- `body text not null` — clause text (markdown/plain)

- `alt_group text null` — groups conceptual variants

Usage:

- Builder reads `contract_clauses` for optional clause selection during generation.

- Future ClauseGraph/side-panel UI will use `category` and `alt_group` for structured browsing.

### 1.3 `contract_template_clauses`

Defined in:

- `supabase/migrations/202511300920_contracts_clauses_v1.sql`

Key fields:

- `template_id uuid` → `contract_templates.id`

- `clause_id uuid` → `contract_clauses.id`

- `order_idx integer not null` — ordering for default clause set

- `required boolean not null default true`

- `alt_group text null`

Usage:

- Defines default clause sets for hero templates:

  - Mutual NDA

  - One-way NDA

  - Employment Agreement

  - MSA (Services)

- Not yet fully surfaced in the UI (Week 12 keeps clause selection simple), but ready for deeper ClauseGraph work.

### 1.4 `contract_metadata`

Defined/extended in:

- `supabase/migrations/202511300900_contracts_meta_v1.sql`

- `supabase/migrations/202511300920_contracts_clauses_v1.sql`

- `supabase/migrations/202511300940_contracts_metadata_renewal_date_v1.sql`

Key fields (relevant to Week 12):

- `status contract_status not null`

  - `draft | in_review | approved | signed | active | expired`

- `category contract_category not null`

  - `operational_hr | corporate_finance | commercial_dealmaking`

- `clauses jsonb not null default '[]'::jsonb`

  - Latest clause selection set for the contract (placeholder shape for now).

- `renewal_date date null`

  - Renewal/expiry date used by Playbooks/Tasks for reminders.

Usage:

- Week 12 primarily sets up schema and docs; write paths into `contract_metadata` for clauses/renewal will be wired as Builder–Vault flows deepen.

---

## 2. Builder UX — Contracts Tab (/builder)

The **Contracts Builder** lives under:

- Route: `/builder`

- Component: `components/builder/builder-client.tsx`

- Server data loader: `app/(protected)/builder/page.tsx`

### 2.1 Builder Type Switcher

Top bar:

- Tabs:

  - **Contracts** (active)

  - **Decks** (Coming Soon)

  - **Accounts** (Coming Soon)

- For GA, Contracts is the only fully wired path; Decks/Accounts are clearly marked as stubs.

### 2.2 Contracts Sidebar (Templates)

Left sidebar:

- Loads **canonical** templates from `contract_templates`.

- Groups by GA category:

  - Operational & HR

  - Corporate & Finance

  - Commercial & Dealmaking

- Includes:

  - Template search (by name/description)

  - "View Drafts" button (existing drafts route)

When no template is selected:

- Center panel shows:

  - "Start Building" prompt

  - Quick-start buttons (if corresponding templates exist):

    - **Start NDA**

    - **Start MSA**

    - **Start SOW**

  - Each quick-start:

    - Selects the template

    - Pre-fills the instructions textarea with a sensible scenario

### 2.3 Clause Selection (Current v1)

Inside the AI-Assisted Generation card:

- "Clauses (optional)" section:

  - Simple checkbox list over `contract_clauses`.

  - Selected clauses are included in the generation prompt as numbered items, with `name`, `category`, and `body`.

- This is a **v1, flat** clause selector:

  - It does **not yet** fully leverage `contract_template_clauses` or complex ClauseGraph logic.

  - It is sufficient to:

    - Let users highlight key clauses they care about.

    - Feed clause bodies to Mono for more tailored drafts.

---

## 3. Library Coverage (~25 Templates)

By end of Week 12, the canonical library includes roughly 25 templates across:

- **Operational & HR**

  - Mutual NDA (short)

  - One-way NDA

  - Employment Agreement

  - Offer Letter

  - Termination & Severance

  - Consulting Agreement (Contractor)

  - Employee Confidentiality & IP Agreement

  - (Plus other HR/operational agreements seeded in v1)

- **Corporate & Finance**

  - Board Resolution (General)

  - Convertible Note (Simple)

  - SAFE (Post-Money)

  - (Plus other corporate/finance agreements seeded in v1)

- **Commercial & Dealmaking**

  - MSA (Services)

  - SOW (General)

  - Referral Agreement

  - Distribution Agreement

  - Licensing Agreement (IP License)

  - Joint Venture Agreement

Exact IDs, tags, and categories are defined in the migration files referenced above.

---

## 4. Renewal Playbook & Tasks Glue (Preview)

Week 12 introduces **data support** for contract renewal automation:

- `contract_metadata.renewal_date`:

  - Used to determine when renewal tasks should be due.

- `docs/PLAYBOOK_CONTRACT_RENEWAL_TASK.md`:

  - Specifies:

    - Trigger events (`signature_completed`, status transitions to `signed`/`active`)

    - Logic for computing `due_at` based on `renewal_date`

    - Shape of the Task created in `public.tasks`

Execution:

- The actual Playbook + Tasks engine wiring for this renewal flow is scheduled for Week 15.

- Week 12 ensures that:

  - The data model is in place.

  - The intent is clear and documented for future implementation.

---

## 5. Manual QA Checklist — Week 12

This is the **minimum QA** to run after Week 12 changes.

### 5.1 Basic Health

1. Run:

   - `npm run lint`

   - `npm run build`

   - `npm run dev`

2. Visit:

   - `/builder`

   - `/vault`

   - `/tasks`

   - `/workbench`

3. Confirm no runtime errors in browser console or server logs for these routes.

### 5.2 Templates & Categories

1. Go to `/builder`.

2. Confirm the top switcher shows **Contracts / Decks / Accounts**.

3. Ensure:

   - Contracts tab is active by default.

   - Sidebar groups templates into:

     - Operational & HR

     - Corporate & Finance

     - Commercial & Dealmaking

4. Use the search box to filter templates; verify it filters as expected.

### 5.3 Quick Start Flows

If corresponding templates exist (they should after migrations):

1. On `/builder`, with no template selected:

   - Click **Start NDA**:

     - Confirm an NDA template is selected.

     - Confirm instructions are pre-filled with NDA-specific guidance.

   - Repeat for **Start MSA** and **Start SOW** if present.

2. For each:

   - Click **Generate Document**.

   - Confirm stub content is generated (current v1 behavior).

   - Save to Vault.

   - Confirm:

     - Toast shows "Saved to Vault".

     - Document appears in Vault/Workbench.

### 5.4 Clauses

1. On `/builder`, select an MSA or SOW template.

2. In the **Clauses (optional)** section:

   - Select several clauses across different categories.

3. Generate a document.

4. Confirm:

   - Generated text includes a "Clauses to reflect:" section listing selected clauses.

5. Save to Vault and confirm no errors.

### 5.5 Renewal Metadata Sanity

1. Inspect `public.contract_metadata` via Supabase UI:

   - Confirm the `renewal_date` column exists.

   - Confirm the `status` and `category` enums match the docs.

2. Create or update a contract record manually (for now):

   - Set `status = 'active'` and `renewal_date` to a future date.

3. Confirm:

   - No DB constraint violations for reasonable dates.

---

## 6. Next Steps / Known Gaps

The following are **deliberately deferred** to later weeks (not GA blockers for Week 12, but important):

- ClauseGraph UI:

  - Structured clause tree/side-panel using `contract_template_clauses` and `contract_clauses.category/alt_group`.

- Clause-aware diffs:

  - Builder/Vault diff views that understand clause IDs rather than only raw text.

- Automated renewal task creation:

  - Wiring the logical spec in `PLAYBOOK_CONTRACT_RENEWAL_TASK.md` into the Playbooks engine (Week 15).

Week 12 locks in the **Contracts data model + Builder shell + canonical library**, so later work can build on a stable foundation.

