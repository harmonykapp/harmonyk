# WEEK 15 — Accounts Packs v1 (SaaS + Investor Snapshot)

## Objectives

- Ship a first, read-only **Accounts Packs** experience at GA:

  - Monthly **SaaS Expenses Pack** backed by `financial_documents`

  - **Investor Accounts Snapshot** pack backed by Vault docs + accounts data

- Make packs callable from both:

  - `/api/accounts/packs` (for dev/tools)

  - Accounts tab inside the **Builder** UI

- Ensure pack runs write **ActivityLog** events for Insights / telemetry.

---

## What Was Delivered

### 1. Accounts data model + inbox wiring

- `financial_documents` table in Supabase:

  - Normalized fields for SaaS bills / statements / accountant packs

  - Includes: `provider`, `source_kind`, `doc_type`, `report_type`, `vendor_name`,

    `currency`, `total_amount`, `period_start`, `period_end`, `created_at`, etc.

- Builder UI:

  - New **Accounts** builder tab with an **Inbox** view.

  - Inbox pulls rows live from `financial_documents` via Supabase browser client.

  - Read-only; no mutations yet (safe to expose to early users).

### 2. `/api/accounts/packs` endpoint (v1)

- POST `/api/accounts/packs` now supports:

  - `type: "saas_monthly_expenses"`

  - `type: "investor_accounts_snapshot"`

- Common behaviour:

  - Uses route auth + `x-user-id` override for local testing.

  - Resolves the caller's `org_id`, then queries org-scoped data.

  - Emits telemetry + `activity_log_write` entries with:

    - `source: "accounts"`

    - `route: "/api/accounts/packs"`

    - `properties.action: "accounts_pack_success" | "accounts_pack_failure"`

  - Returns JSON in the shape:

    - `{ ok: true, pack, requestId }` on success

    - `{ ok: false, error, requestId }` on failure

#### SaaS Expenses Pack

- Reads SaaS-classified rows from `financial_documents` for a given period.

- Aggregates by vendor:

  - Total SaaS spend

  - Top vendors with amounts / % share

  - Simple month-over-month comparison (if prior period data exists).

- Returned `pack` payload includes:

  - High-level summary suitable for an Insights card or investor email.

  - Vendor breakdown table.

  - MoM deltas and basic commentary string.

#### Investor Accounts Snapshot Pack

- Reads org-scoped document + accounts data to compute:

  - Cash, burn, runway style metrics (where available).

  - Key movements / anomalies during the chosen period.

- Returned `pack` payload includes:

  - Headline metrics (cash / burn / runway where possible).

  - 3–5 bullet highlights for investor updates / board packs.

  - Optional appendix-style details keyed by underlying documents.

### 3. Builder UI — Accounts Packs wiring

**File:** `components/builder/builder-client.tsx`

- **Accounts → Packs** view now:

  - Calls `/api/accounts/packs` with `type: "saas_monthly_expenses"` or

    `"investor_accounts_snapshot"` when user clicks **Run pack**.

  - Passes `x-user-id` from the Supabase browser client for local testing.

  - Handles auth and server errors via `handleApiError(...)`.

- SaaS + Investor dialogs:

  - Show live `pack` JSON payload from the last run (sanity check v1).

  - Expose loading and error states.

  - Keep UX explicitly read-only ("no exports yet") as per GA scope.

### 4. Telemetry and ActivityLog wiring

- API route emits telemetry lines like:

  - `event: "activity_log_write"`

  - `source: "accounts"`

  - `properties.action: "accounts_pack_success" | "accounts_pack_failure"`

- This keeps Activity and Insights infrastructure aware of pack runs without

  adding new write surfaces.

---

## Constraints, Assumptions & Limitations (Week 15)

- Read-only:

  - No pack exports yet (no PDF, CSV, or email actions).

  - Packs are for **on-screen insights**, not file generation.

- Data coverage:

  - Accuracy depends on the quality / coverage of `financial_documents` and

    related accounts data.

  - No attempt yet to "fix" gaps in source data (stubbed or partial metrics are

    acceptable at v1 as long as we don't over-promise).

- Period selection:

  - v1 uses default periods (e.g. "current month") or simple params; there is no

    full date-picker UX or saved pack configurations yet.

- Insights UI:

  - ActivityLog events for packs are being written; richer Insights cards

    specific to Accounts Packs are post-Week-15 polish.

---

## How to Exercise Packs (Local)

1. **Run the dev server**

   - `npm run dev`

   - Open `http://localhost:3000/builder` and sign in.

2. **From the Builder UI**

   - Switch to **Accounts → Packs**.

   - Click **Run pack** on:

     - **Monthly SaaS Expenses Pack**

     - **Investor Accounts Snapshot**

   - Check the dialogs:

     - Expect `pack` JSON to appear when data exists.

     - Errors should show a toast + inline message (e.g. auth or missing data).

3. **Via browser console (dev-only)**

   - From `/builder`, run:

     - `await fetch("/api/accounts/packs", { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "<your-uuid>" }, body: JSON.stringify({ type: "saas_monthly_expenses" }) }).then(r => r.json())`

   - Repeat with `type: "investor_accounts_snapshot"`.

4. **Verify ActivityLog**

   - Watch terminal logs for `[telemetry:event] activity_log_write` with

     `source: "accounts"` and the correct `properties.action`.

---

## Next Steps / Hand-off Notes

- Add a thin presentation layer over the `pack` payloads:

  - Cards / tables for SaaS vendors, totals, and MoM deltas.

  - A small "Investor snapshot" card in Insights summarising runway + bullets.

- Add basic period selection (month / quarter) and remember last selection per org.

- Decide when to expose **export** flows (PDF / CSV / "Copy to deck slide") and

  which plan tiers they belong to.

- Continue seeding / normalising `financial_documents` for realistic test data.

