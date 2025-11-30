# Week 14 — Accounts Builder v1 & Financial Inbox

Week: 14  
Status: In Progress (v1 Financial Inbox complete, packs to follow in Week 15)  
Date: 2025-11-30

---

## 1. Objectives for Week 14

- Stand up the **Accounts Builder v1** inside the existing Builder shell.

- Create a normalized **Financial Inbox** wired to a single table
  (`financial_documents`).

- Prove we can:

  - Classify financial docs (dev-only).

  - Store normalized rows.

  - Render them in a stable, non-flickering UI.

No automation, no P&L, no investor pack generation yet.

---

## 2. What Was Delivered

### 2.1 Financial Documents Schema (v1)

- Extended `financial_documents` with helper fields:

  - `provider text`

  - `source_kind text`

  - `report_type text`

  - `vendor_name text`

  - `currency text`

  - `total_amount numeric`

  - `period_start date`

  - `period_end date`

- Relaxed hard constraints to enable iterative ingestion:

  - `source` — `NOT NULL` dropped.

  - `doc_type` — `NOT NULL` dropped (enum remains, but nullable).

- Seeded **two** example rows for a real org:

  - `Stripe` — SaaS invoice, `USD 249`, period 2025-11-01 → 2025-11-30.

  - `Chase Business Checking` — bank statement placeholder, `USD 0`, same period.

These rows are used purely for validating the inbox rendering and future pack
logic.

### 2.2 Dev Classifier Endpoint

- Added `POST /api/dev/accounts/classify`:

  - Accepts a simple payload with: `title`, `mimeType`, `fileName`, `provider`.

  - Returns a normalized object that includes:

    - `source` (e.g. `drive`).

    - `fileName`.

    - Basic classification hints for future use.

- Verified locally via `Invoke-RestMethod` from PowerShell with:

  - Stripe invoice style payload.

  - Chase bank statement style payload.

This endpoint is **dev-only** and is not considered production-stable.

### 2.3 Accounts Builder UI (Read-Only Inbox)

Inside `components/builder/builder-client.tsx`:

- Implemented an **Accounts** tab in the Builder type switcher.

- Added a **Financial Inbox** view that:

  - Loads from `financial_documents` when `activeBuilder === "accounts"`.

  - Normalizes rows into a `FinancialInboxItem` shape.

  - Provides:

    - Loading state.

    - Error state.

    - Empty state.

    - Populated list of cards with vendor, type, amount, and period.

- Fixed a **flickering loop** bug:

  - Original implementation oscillated between "Loading..." and "No documents"
    due to eager re-renders.

  - Hook now guards on `accountsLoading` and `accountsInbox.length` to avoid
    repeated fetches.

Header copy was updated to reflect reality:

- Builder header now says:

  - Contracts are live.

  - Decks Builder is live.

  - Accounts shows a read-only financial inbox.

---

## 3. Constraints, Assumptions & Limitations

- **Single-org seed**:

  - Seeded financial docs are tied to a single real org via a `cross join` on
    `document.org_id`. This is just to make the inbox non-empty for the current
    test org.

- **No write actions** in Accounts:

  - No "Generate Pack", "Export", or "Open in Drive" buttons yet.

  - This is a visibility-only shell for now.

- **Partial classification**:

  - `doc_type` and `source` are allowed to be `NULL`.

  - The UI is designed to handle missing metadata safely.

- **No RLS review in this week**:

  - We assume existing org-based RLS patterns; a formal RLS pass should happen
    when ingestion is properly wired.

---

## 4. Next Steps / Hand-off Notes

Proposed focus for Week 15:

1. **Wire connectors → financial_documents**:

   - Take real items coming from Google Drive (and future connectors).

   - Classify via a non-dev path and store normalized rows.

2. **Accounts Packs skeleton**:

   - Monthly SaaS Expenses Pack: roll up Stripe/other SaaS invoices by vendor
     and month.

   - Investor Accounts Snapshot: snapshot of balances / key accounts for use in
     decks and investor updates.

3. **Activity & Insights integration (lightweight)**:

   - Log simple events when financial docs are ingested.

   - Consider a minimal Insights card fed by `financial_documents` to show
     something like "Top 5 SaaS vendors by spend (last 30 days)".

By the end of Week 15, Accounts should move from "just an inbox" to "generates
one or two founder-grade packs from real data".

