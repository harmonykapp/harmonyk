# GA Checklist — Harmonyk

This checklist is used to validate the GA candidate build (up to Week 18). Each item should be marked ✅ / ⚠️ / ❌ as part of the GA cut.

## GA Modules (v1)

The following modules are considered in-scope and GA-ready (with known caveats documented below):

- **Dashboard** – Org-level overview tiles; quick links into Builder, Vault, Workbench.
- **Builder**
  - **Contracts Builder** – GA flow for core templates, clause wiring, Vault save, send for signature (Documenso integration partial OK).
  - **Decks Builder** – GA for fundraising/update decks, section editor, Vault save, basic export (stub messaging is clear).
  - **Accounts** – Financial Inbox, classifier endpoint, Accounts Packs (SaaS Expenses, Investor Snapshot).
- **Vault** – Vaulted docs list/detail, versioning, filters, document preview.
- **Share Hub** – Share links list, status, basic share management.
- **Insights** – Core tiles (opens, shares, signatures, pack runs, stuck deals) driven by Activity / telemetry.
- **Workbench / Maestro** – GA queries over Vaulted docs with metadata-first ingestion and Vault-only semantics.
- **Playbooks** – Playbooks engine v1, run UI, dry-run/safety in place for GA workflows.
- **Connectors (Google)** – Google Drive + Gmail connectors, metadata-first ingestion per GA scope.
- **Activity Log** – Centralized audit of key actions across modules.

### Not GA (post-GA / flagged)

- **Maestro RAG v1 (Training Library + RAG context endpoints)**  
  Implemented as dev-only scaffolding and **behind feature flags**.  
  - Off by default for all GA tenants.  
  - Can be enabled for internal/dev orgs only.  
  - Not required for GA happy path; considered post-GA functionality.

## Feature Flags & Experimental Surfaces

- All experimental features (RAG, Labs/experimental navigation, Playbooks dev mode, dev-only Insights tiles) are:
  - Documented in `docs/FEATURE_FLAGS.md`.
  - **Off by default** for GA v1 tenants.
  - Only enabled for internal/dev orgs when explicitly configured via env.

- Maestro RAG v1 is treated as **post-GA**:
  - GA happy paths must not depend on RAG being available.
  - Any RAG-related UI/endpoints are fully guard-railed behind flags.

## Env & Config Sanity (GA)

- GA environments must define all **Required (GA)** variables listed in `docs/ENV_GA_REFERENCE.md`.

- Experimental flags (e.g. `MONO_RAG_ENABLED`, `NEXT_PUBLIC_MONO_RAG_ENABLED`, `NEXT_PUBLIC_SHOW_LABS`) must be `false` by default.

- A GA-like `.env.local` must:

  - Pass `npm run lint` and `npm run build` without missing-variable errors.

  - Allow `npm run dev` to boot without env-related crashes on core routes.

- A fresh database with all migrations applied must:

  - Allow the app to boot without 500s on Dashboard, Vault, Builder, Workbench, or Insights when data is empty.

  - Respect org-scoped RLS across Vault, Activity, Insights, Playbooks, Packs, and Workbench tables.

---

## Routes

### Dashboard

- [ ] Loads successfully for an authenticated org user with no console errors.

- [ ] Shows the expected high-level cards (recent activity, key work) and nothing obviously broken or placeholder.

### Workbench

- [ ] Loads for an authenticated org user and reflects their current workspace/org.

- [ ] Cards (Recent Activity, Open Tasks, Active Deals & Rounds) render without crashing; any missing data shows a clean empty state.

### Builder (Contracts / Decks / Accounts)

- [ ] Builder shell renders with tabs for **Contracts**, **Decks**, and **Accounts** and the correct tab is highlighted.

- [ ] Switching tabs does not cause hard errors or obvious double-fetch flicker.

#### Contracts

- [ ] Template library renders; user can start from a canonical template and save to Vault.

- [ ] ClauseGraph v1 or equivalent clause-picker experience works without errors for GA-supported flows.

- [ ] "Send for signature" via Documenso works for at least one happy-path contract.

#### Decks

- [ ] Fundraising and Investor Update deck flows load and allow outline → draft → save to Vault.

- [ ] Export/HTML flow works as currently implemented without crashing the page.

#### Accounts

- [ ] Accounts inbox or packs view loads; if there is no data, a clear empty state appears.

- [ ] Running a GA-supported Accounts pack (e.g. SaaS Expenses, Investor Snapshot) completes and writes expected outputs (e.g. Vault docs, pack runs).

### Vault

- [ ] Vault list view loads with pagination or scrolling as implemented.

- [ ] Detail view opens documents created from Contracts/Decks/Accounts and shows version history where available.

- [ ] Diff/compare UI works for at least one contract with multiple versions.

### Activity

- [ ] Activity timeline loads without errors for the current org.

- [ ] Key GA events are visible (document creates/updates, shares, signatures, playbook runs, accounts pack runs).

### Insights

- [ ] Insights page loads without console errors.

- [ ] Contracts/Decks/Accounts KPIs render or show a clean empty state where no data exists.

- [ ] Accounts pack runs row/surfaces show up as designed in Week 16.

### Playbooks

- [ ] `/playbooks` list view renders with built-in GA playbooks.

- [ ] Detail view opens and shows playbook definition and recent runs (where present).

- [ ] Dry-run/simulate flow works for at least one built-in playbook without hard errors.

### Share & Signatures

- [ ] Share link creation page works: user can generate a share link for a Vault doc.

- [ ] Signature-related views (Documenso-linked) load cleanly; error states are handled gracefully if Documenso is misconfigured.

### Integrations

- [ ] Integrations page lists Google Drive and Gmail as live connectors; others are clearly labeled "Coming Soon".

- [ ] Connector status UI correctly reflects connected/disconnected states for the current org.

### Settings

- [ ] Settings page loads with org-level information and any GA-configurable options (where implemented).

- [ ] No obviously broken or placeholder settings appear in the GA build.

---

## System Areas

### Auth & RLS

- [ ] Magic link / email login works for a new and existing user in the dev GA candidate environment.

- [ ] Accessing protected routes while unauthenticated cleanly redirects to login/onboarding (no half-rendered UIs).

- [ ] RLS policies prevent cross-org access to documents, activity, playbooks, and accounts_pack_runs (basic manual checks performed).

### Connectors (Google Drive & Gmail)

- [ ] Google Drive connector can be connected for an org and ingests metadata as expected.

- [ ] Gmail connector can be connected and ingests email/attachment metadata as designed.

- [ ] Connector failures/errors surface into ActivityLog and/or telemetry, not raw stack traces.

### Telemetry & Observability

- [ ] Telemetry wrapper is used on critical paths (Builder, Vault, Share, Playbooks, Accounts Packs).

- [ ] No excessive console logging or dev-only tracing remains in the GA build.

### Supabase & Migrations

- [ ] All migrations applied cleanly to the target database for GA.

- [ ] Newer tables (playbooks, playbook_runs, accounts_pack_runs, financial_documents, etc.) exist and match expected schema.

### Vercel / Deployment

- [ ] Environment variables required for GA are documented and present (OpenAI, Supabase, Documenso, Google APIs, etc.).

- [ ] The app builds cleanly on Vercel with the same configuration as local.

### Docs

- [ ] Core docs updated: NORTH_STAR.md, PLAYBOOKS_GA docs, Week summaries up to Week 18.

- [ ] GA checklist and ops runbook exist and are discoverable for future operators.

---

## Empty / Loading / Error States

- [ ] Each main route has a clear empty state when there is no data.

- [ ] Each main route shows a reasonable loading indicator while primary data is being fetched.

- [ ] API 4xx/5xx errors are surfaced via inline errors or banners, not raw JSON/stack traces.

---

## Stubs & Dev Flags

Use a code search for markers like `"STUB"`, `"stub"`, `"TODO"`, `"DEV ONLY"`, `"TEMP"`, and list any items that must be removed or converted before GA.

- [ ] \dev\harmonyk\harmonyk\app\api\ai\analyze\route.ts - stub
- [ ] \dev\harmonyk\harmonyk\app\api\connectors\drive\disconnect\route.ts - stub
- [ ] \dev\harmonyk\harmonyk\app\api\drive\recent\route.ts - stub
- [ ] \dev\harmonyk\harmonyk\app\api\mono\route.ts - stub
- [ ] \dev\harmonyk\harmonyk\app\api\playbooks\run\route.ts - stub
- [ ] \dev\harmonyk\harmonyk\app\api\sign\documenso\route.ts - stub
- [ ] \dev\harmonyk\harmonyk\components\builder\builder-client.tsx - stub
- [ ] \dev\harmonyk\harmonyk\components\builder\contracts-builder-v1.tsx - stub
- [ ] \dev\harmonyk\harmonyk\docs\AI_MONO_MEMORY_AND_RAG_V1.md - stub
- [ ] \dev\harmonyk\harmonyk\lib\insights\contracts.ts - stub 
- [ ] \dev\harmonyk\harmonyk\lib\mono\memory.ts - stub
- [ ] \dev\harmonyk\harmonyk\lib\playbooks\engine.ts - stub
- [ ] \dev\harmonyk\harmonyk\lib\rag\index.ts - stub
- [ ] \dev\harmonyk\harmonyk\lib\telemetry\builder.ts - stub
- [x] docs/legacy/supabase_schema_week1.sql
  - Archived historical snapshot (Week 1). Do NOT execute.
  - `/supabase/migrations/*` is the source of truth.
- [ ] \dev\harmonyk\harmonyk\app\(protected)\share\page.tsx - todo
- [ ] \dev\harmonyk\harmonyk\app\api\connectors\drive\callback\route.ts - todo
- [ ] \dev\harmonyk\harmonyk\app\api\mono\route.ts - todo
- [ ] \dev\harmonyk\harmonyk\app\api\playbooks\route.ts - todo
- [ ] \dev\harmonyk\harmonyk\app\api\playbooks\run\route.ts - todo
- [ ] \dev\harmonyk\harmonyk\bolt_ui\app\tasks\page.tsx - todo
- [ ] \dev\harmonyk\harmonyk\components\builder\builder-client.tsx - todo
- [ ] \dev\harmonyk\harmonyk\components\builder\contracts-builder-v1.tsx - todo
- [ ] \dev\harmonyk\harmonyk\lib\activity-log.ts - todo
- [ ] \dev\harmonyk\harmonyk\lib\mono\memory.ts - todo
- [ ] \dev\harmonyk\harmonyk\lib\playbooks\events.ts - todo
- [ ] \dev\harmonyk\harmonyk\lib\playbooks\types.ts - todo
- [ ] \dev\harmonyk\harmonyk\lib\playbooks\templates\accounts.ts - todo
- [ ] \dev\harmonyk\harmonyk\lib\playbooks\templates\contracts.ts - todo
- [ ] \dev\harmonyk\harmonyk\lib\playbooks\templates\decks.ts - todo
- [ ] \dev\harmonyk\harmonyk\lib\rag\index.ts - todo
- [ ] \dev\harmonyk\harmonyk\supabase\migrations\2025-11-24_playbooks.sql - todo
- [ ] \dev\harmonyk\harmonyk\supabase\migrations\202512010900_playbooks_v1.sql - todo
- [ ] \dev\harmonyk\harmonyk\app\(protected)\dev\activity-log\page.tsx - dev only
- [ ] \dev\harmonyk\harmonyk\app\api\dev\envelopes\route.ts - dev only
- [ ] \dev\harmonyk\harmonyk\app\api\dev\seed-vault-document\route.ts - dev only 
- [ ] \dev\harmonyk\harmonyk\app\api\dev\vault-save-selftest\route.ts - dev only
- [ ] \dev\harmonyk\harmonyk\.gitignore - temp 

---

## Ops Runbook

For a concrete, step-by-step GA verification flow (what to click, what to expect),
see:

- `docs/OPS_GA_RUNBOOK.md`

## Onboarding & In-App Guidance

- [ ] `docs/WEEK19_ONBOARDING_V1.md` created and reflects current first-run flows.
- [ ] Dashboard shows a “Getting started” card for new orgs with these steps:
  - Connect Google Drive
  - Generate first contract
  - Generate first deck
  - Save first document to Vault
  - (Optional) Run an Accounts pack
- [ ] Dashboard “Getting started” card collapses or visually softens once required steps are complete.
- [ ] Workbench has a clear empty state (“No active work yet”) with 2–3 suggested actions.
- [ ] Builder tabs (Contracts, Decks, Accounts) each:
  - Explain what the tab is for in 1–2 sentences.
  - Offer one primary CTA for a first-time user.
  - Do not show dev/stub/placeholder copy.
- [ ] Vault empty state:
  - Shows “No documents in your Vault yet” copy.
  - Provides a single CTA to save or upload the first document.
- [ ] Activity empty state explains what Activity is and suggests actions that will create activity.
- [ ] Insights empty state:
  - Shows “No data yet” per major metric group.
  - Includes short hints on how to populate each metric (contracts, decks, accounts).
- [ ] No raw JSON, stack traces, or dev TODO text visible in any empty/error state at GA.
- [ ] A basic Help/Docs entry point exists (e.g. header menu → /help) where we can hang docs and links in Week 19.

