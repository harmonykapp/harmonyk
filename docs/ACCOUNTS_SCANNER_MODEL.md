# Accounts Scanner Data Model (Week 14 — v1)

This document describes the **data model for the Accounts Builder scanner layer**:

- How Harmonyk tracks _financial documents_ detected from connectors.

- How it stores _normalized expense facts_ for reporting.

- How this fits into Vault and future Accounts reports.

The goal for Week 14 is **not** to build a full accounting system. Instead, we add:

> A lightweight financial lens on top of Gmail and Drive that can detect financial docs, normalize basic expense data, and power two hero reports (Monthly Expenses Pack and Investor Accounts Snapshot).

---

## Enums

### `financial_doc_type`

Enum in `public` schema:

- `receipt`

- `invoice`

- `bank_statement`

- `pl_export`

- `tax_notice`

- `other`

This type captures how a Gmail/Drive item has been classified by the connector ingest + AI layer.

### `accounts_report_type`

Enum in `public` schema:

- `monthly_expenses`

- `investor_accounts_snapshot`

This is primarily used for metadata on Accounts documents saved to Vault and for future Playbooks/Insights wiring.

---

## Table: `public.financial_documents`

> One row per Gmail/Drive item that has been classified as a financial document.

**Columns**

- `id uuid primary key`  

- `org_id uuid not null`  

  - FK → `public.organizations(id)` (on delete cascade).

- `source_connector text not null`  

  - Enum-checked to `'gmail'` or `'drive'` for GA.

- `external_id text not null`  

  - Connector-specific identifier (e.g. Gmail message ID, Drive file ID).

- `vault_document_id uuid`  

  - Optional FK → `public.document(id)` if/when the item is vaulted.

- `financial_doc_type financial_doc_type not null default 'other'`  

  - Classification result.

- `vendor text`  

  - Parsed or inferred vendor/sender (e.g. "Google Cloud", "AWS").

- `doc_date date`  

  - Parsed or inferred document date (e.g. invoice date, statement date).

- `currency text`  

  - ISO-ish currency code where available (e.g. `USD`, `EUR`).

- `amount_total numeric`  

  - Parsed total amount for the document (invoice total, statement period total, etc.).

- `confidence_score numeric`  

  - Optional scalar 0–1 indicating how confident we are in the classification / primary extraction.

- `raw_metadata jsonb not null default '{}'::jsonb`  

  - Connector metadata and/or AI classification details.

- `created_at timestamptz not null`  

  - Defaults to `timezone('utc', now())`.

- `updated_at timestamptz not null`  

  - Defaults to `timezone('utc', now())`.

**Indexes**

- `financial_documents_org_date_idx`  

  - `(org_id, doc_date desc nulls last)`  

  - Supports the financial inbox view sorted by date.

- `financial_documents_org_type_confidence_idx`  

  - `(org_id, financial_doc_type, confidence_score)`  

  - Supports filtering by type and ranking by confidence.

- `financial_documents_org_vendor_idx`  

  - `(org_id, vendor)`  

  - Supports vendor-based filters and aggregations.

**Uniqueness**

- `(org_id, source_connector, external_id)` is unique.  

  - Prevents duplicate rows when re-syncing from connectors.

---

## Table: `public.accounts_expenses`

> Normalized expense facts derived from `financial_documents`.

For v1, Harmonyk keeps a **single "main" expense row per financial document** (e.g. total from an invoice or receipt). Post-GA we can extend this to per-line-item splits.

**Columns**

- `id uuid primary key`

- `org_id uuid not null`  

  - FK → `public.organizations(id)` (on delete cascade).

- `financial_document_id uuid not null`  

  - FK → `public.financial_documents(id)` (on delete cascade).

- `expense_date date not null`  

  - Typically matches `doc_date` but can be adjusted by the extraction logic.

- `vendor text`  

  - Copied from `financial_documents.vendor` or refined by extraction.

- `category text not null`  

  - Coarse category for v1, e.g. `SaaS`, `Rent`, `Payroll`, `Marketing`, `Other`.

- `amount numeric not null`  

  - Main expense amount for the document. Non-negative.

- `currency text`  

  - Copied from `financial_documents.currency` where available.

- `is_estimated boolean not null default false`  

  - Indicates whether the amount/category is approximate vs. confidently parsed.

- `confidence_score numeric`  

  - Optional scalar 0–1 for the extraction step.

- `created_at timestamptz not null`  

  - Defaults to `timezone('utc', now())`.

- `updated_at timestamptz not null`  

  - Defaults to `timezone('utc', now())`.

**Indexes**

- `accounts_expenses_org_date_idx`  

  - `(org_id, expense_date desc)`  

  - Supports date-ranged reporting (e.g. per month).

- `accounts_expenses_org_category_idx`  

  - `(org_id, category)`  

  - Supports category aggregations.

- `accounts_expenses_org_vendor_idx`  

  - `(org_id, vendor)`  

  - Supports vendor-based reporting.

---

## How this feeds Accounts Builder v1

For Week 14, the scanner model is used to power two hero reports:

1. **Monthly Expenses Pack**

   - Aggregates `accounts_expenses` over a chosen month and compares against the previous month.

   - Summaries by category and top vendors.

2. **Investor Accounts Snapshot**

   - Uses aggregated expenses plus a small set of manual headline inputs (e.g. MRR, cash, runway) to build an investor-facing snapshot.

Both reports will be materialized as `kind: "accounts"` documents in Vault with `accounts_report_type` metadata and an embedded JSON block describing the period and key metrics.

