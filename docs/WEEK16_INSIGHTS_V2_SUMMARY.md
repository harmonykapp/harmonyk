# Week 16 — Insights v2 & Accounts Packs Surfaces

Theme: turn raw telemetry and Accounts packs into visible, trustworthy signals for founders.

---

## Objectives

- Persist Accounts pack runs in a first-class table with metrics in `jsonb`.

- Surface Accounts, Contracts, and Decks KPIs directly on `/insights`.

- Add a small, high-signal "Highlights" card grid with a range selector.

- Tighten resilience and telemetry around Insights.

---

## What was delivered

### 1. Accounts pack runs schema

**Files**

- `supabase/migrations/202512020900_accounts_pack_runs_v1.sql`

- `lib/activity-events.ts`

**Details**

- New enums: `accounts_pack_type`, `accounts_pack_status`.

- New table: `accounts_pack_runs` with org-scoped RLS and index on `(org_id, type, created_at desc)`.

- Activity event types:

  - `accounts_pack_success`

  - `accounts_pack_failure`

These events are available to telemetry and Activity Log consumers.

---

### 2. Packs → runs wiring

**Files**

- `lib/accounts/packs.ts`

- `app/api/accounts/packs/route.ts`

- `tests/lib.accounts.packs-runs.test.ts`

**Details**

- After a pack is generated, a best-effort `accounts_pack_runs` row is inserted with:

  - `org_id`, `type`, `period_start`, `period_end`, `status`, `metrics`.

- On error, a failure run is recorded with `status = 'failure'` and a minimal `{ error }` payload in `metrics`.

- Helper:

  - `getLatestPackRunForOrg({ supabase, orgId, type })` to fetch the latest successful run.

- Tests cover the success and failure paths.

---

### 3. Accounts Insights row on `/insights`

**Files**

- `lib/insights/accounts.ts`

- `lib/activity-insights.ts`

- `app/(protected)/insights/_components/insights-client-v1.tsx`

**Details**

- `getAccountsInsightsForOrg({ supabase })` produces:

  - `monthly_saas`: `total`, `top_vendors_count`, `last_run_at`

  - `investor_snapshot`: `runway_months`, `cash`, `burn`, `last_run_at`

- `/insights` now displays an **Accounts** section with:

  - Monthly SaaS card (total spend, top vendors, last run date).

  - Investor Snapshot card (runway months, burn, last run date).

  - CTA → `/accounts`.

- Clean empty states when no pack runs exist.

---

### 4. Contracts & Decks KPIs

**Files**

- `lib/insights/contracts.ts`

- `lib/insights/decks.ts`

- `lib/activity-insights.ts`

- `app/(protected)/insights/_components/insights-client-v1.tsx`

**Details**

- Contracts (last N days, default 30):

  - Drafts created (`contract_draft_created%`)

  - Sent for signature (`contract_sent_for_signature%`)

  - Signed (`contract_signed%`)

- Decks (last N days, default 30):

  - Generated (`deck_generated%`)

  - Saved to Vault (`deck_saved_to_vault%`)

  - Exported (`deck_exported%`)

  - Recent decks table (last 5 `documents` with `kind = 'deck'`).

- Both helpers accept a `days` parameter for the Highlights range selector.

---

### 5. Highlights cards + range selector

**Files**

- `lib/insights/cards.ts`

- `app/api/insights/cards/route.ts`

- `app/(protected)/insights/_components/insights-client-v1.tsx`

**Details**

- Defined a unified `InsightsCard` model:

  - `id`, `kind`, `title`, `value`, `period`, `source`, optional `cta`.

- `/api/insights/cards?range=7d|30d|90d`:

  - Auth-aware, org-scoped via `getRouteAuthContext`.

  - Aggregates Accounts, Contracts, Decks into a small card set.

- Client behaviour:

  - Range selector with values `7d`, `30d`, `90d`.

  - 250ms debounce on range changes.

  - 60s in-memory cache per range.

  - Inline error only for the Highlights block.

  - 401 from the endpoint degrades gracefully (cards hidden, no red banner).

- Telemetry events:

  - `insights_viewed` (initial view + cards state).

  - `insights_range_changed` (from/to).

  - `insights_card_clicked` (card id + kind).

---

## QA notes (Week 16)

Smoke-tested scenarios (using seeded data where needed):

1. **No data**

   - `/insights` renders with base tiles and friendly "not enough activity" copy.

   - Highlights shows a soft empty message; Accounts / Contracts / Decks rows handle `null` metrics.

2. **Contracts-only org**

   - Contracts row shows non-zero drafts/sent/signed counts.

   - Accounts row shows empty states; Decks row shows empty KPIs and no recent decks.

3. **Decks-only org**

   - Decks KPIs increment after generating/saving/exporting a deck.

   - "Open in Vault" links navigate to `/vault?docId=...`.

4. **Accounts packs present**

   - Running Monthly SaaS and Investor Snapshot packs writes `accounts_pack_runs`.

   - Accounts row and Highlights cards update after a refresh.

5. **API failure / auth edge**

   - For `/api/insights/cards` 401, Highlights hides cards quietly (no hard error).

   - For 5xx / network issues, only the Highlights block shows a small inline error; the rest of `/insights` stays functional.

---

## Next steps / hand-off

- If we standardise contract/deck activity event names, tighten the `ilike` patterns in `contracts.ts` and `decks.ts`.

- Consider adding currency display to Accounts tiles and cards once multi-currency handling is defined.

- When RAG (Weeks 19–20) lands, consider additional Insights cards for Maestro Q&A usage over Vaulted docs.

Tag for this week: `v0.16.0-insights-v2`.

