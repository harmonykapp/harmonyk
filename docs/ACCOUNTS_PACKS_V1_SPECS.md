# Accounts Packs v1 — Specs (Week 15)

This document defines the v1 scope and data shapes for:

- **Monthly SaaS Expenses Pack**

- **Investor Accounts Snapshot Pack**

The goal for Week 15 is to:

- Keep the packs **read-only** (no exports yet).

- Power the packs purely from existing data in `financial_documents` and `accounts_expenses`.

- Emit clean, normalized JSON suitable for:

  - `/builder` Accounts tab

  - `/insights` tiles (basic metrics + timestamps)

## 1. Monthly SaaS Expenses Pack

### 1.1 Purpose

Give founders a quick monthly view of recurring SaaS spend:

- How much they are spending on SaaS.

- Which vendors are taking the most.

- How this month compares to the previous period.

### 1.2 Time ranges

- **Primary period**: caller supplies a date range (typically a calendar month).

- **Comparison period**: previous period of matching length, immediately before the primary period.

Example:

- Primary: 2025-11-01 → 2025-11-30

- Comparison: 2025-10-02 → 2025-10-31

### 1.3 Headline metrics

Headline metrics for the pack:

- `totalAmount` — total SaaS spend in the primary period.

- `currency` — ISO currency code for the primary totals (e.g. `"USD"`).

- `vendorCount` — number of unique SaaS vendors.

- `categoryCount` — number of unique SaaS categories represented.

- `averagePerVendor` — arithmetic mean spend per vendor (or `null` if no vendors).

- `period` — `{ start, end }` ISO-8601 dates for primary range.

- `comparisonPeriod` — optional `{ start, end }` for the comparison period.

- `deltaAmount` — `totalAmount(primary) - totalAmount(comparison)` (optional).

- `deltaPercent` — percent change vs comparison (optional, `null` if comparison is zero).

### 1.4 Line items (vendor breakdown)

Each vendor entry in the pack:

- `vendorName` — human-readable vendor or merchant name.

- `category` — SaaS category label (e.g. `"analytics"`, `"dev_tools"`, `"productivity"`).

- `monthlyAmount` — normalized monthly amount for the primary period.

- `currency` — ISO currency code for this vendor's amounts.

- `documentCount` — number of underlying expense records contributing.

- `sourceCount`:

  - `gmail` — count of expenses inferred from Gmail.

  - `drive` — count of expenses inferred from Drive.

  - `manual` — count of manually-entered or corrected expenses.

### 1.5 JSON shape (conceptual)

The pack returned from the server will look like:

- `type: "saas_monthly_expenses"`

- `orgId` — resolved from auth (not trusted from client).

- `generatedAt` — ISO timestamp when the pack was computed.

- `headline` — headline metrics object.

- `vendors` — array of vendor line items.

We will implement the concrete TypeScript types in `lib/accounts/packs.ts`.

## 2. Investor Accounts Snapshot Pack

### 2.1 Purpose

Give an **investor-facing** snapshot of the company's financial posture derived from:

- Classified expenses in `accounts_expenses`.

- Any structured data in `financial_documents` that acts as a proxy for cash / runway.

- Simple counts of key doc types in the Vault (contracts, decks, accounts docs).

### 2.2 Time ranges

- Primary period is **last 90 days** by default (server-side).

- We may later extend to accept an explicit date range; v1 assumes:

  - `period.start` and `period.end` are computed on the server.

### 2.3 Headline metrics

Headline metrics include:

- `cashBalance` — current cash (if we can infer from `financial_documents`), else `null`.

- `cashCurrency` — ISO currency for `cashBalance`.

- `monthlySaaSBurn` — average monthly SaaS spend (from the expenses data).

- `totalMonthlyBurn` — optional estimated total monthly burn if we can derive it.

- `estimatedRunwayMonths` — `cashBalance / totalMonthlyBurn` if both are available.

- `contractsInVault` — count of contract docs.

- `decksInVault` — count of deck docs.

- `accountsDocsInVault` — count of accounts/financial docs.

- `totalDocsInVault` — total docs considered for this snapshot.

- `period` — `{ start, end }` ISO dates for the snapshot window.

### 2.4 Metrics trail

We will also expose a lightweight metrics trail for use in `/insights`:

- `label` — e.g. `"MRR"`, `"Gross Margin"`, `"Net Burn"`.

- `value` — numeric value.

- `unit` — optional string such as `"USD"`, `"months"`, `"contracts"`.

JSON shape:

- `type: "investor_accounts_snapshot"`

- `orgId` — resolved from auth.

- `generatedAt` — ISO timestamp.

- `headline` — headline metrics object.

- `metricsTrail` — ordered list of additional metrics (for charts / tiles).

## 3. Database helpers (non-breaking)

For Week 15, we will:

- Prefer using existing `financial_documents` and `accounts_expenses` columns as-is.

- Add **non-breaking helpers only** if needed:

  - SQL views to normalize SaaS expenses per month.

  - Computed fields for common aggregations (e.g. currency-normalized totals).

We will design any required views after reviewing the current table definitions for:

- `financial_documents`

- `accounts_expenses`

No schema changes (columns, enums) are planned for v1 of the packs.

