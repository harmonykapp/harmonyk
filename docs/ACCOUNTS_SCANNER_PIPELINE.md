# Accounts Scanner Pipeline — v1 (Week 14)

This doc describes the v1 Accounts Scanner pipeline that feeds the Accounts Builder.

The goal of v1 is **classification + normalization**, not full accounting:

- Identify financial documents from existing connectors (Gmail / Drive).
- Normalize them into `financial_documents` and `accounts_expenses`.
- Provide a clean surface for the Accounts Builder to assemble:

  - Monthly Expenses Pack

  - Investor Accounts Snapshot

## Core tables

Already created in Week 14 Day 1:

- `financial_documents`

  - One row per normalized financial document.

  - Key fields:

    - `org_id` — workspace id (UUID, no FK for now).

    - `source` — `"gmail" | "drive" | "manual" | "quickbooks" | "xero" | "other"`.

    - `source_message_id`, `source_thread_id` — connector-specific ids.

    - `doc_type` — `financial_doc_type` enum (invoice, receipt, subscription, bank_statement, etc.).

    - `report_type` — `accounts_report_type` enum where applicable.

    - `file_name`, `mime_type`, `currency`, `total_amount`, `issued_at`, `due_at`, `vendor_name`.

    - `raw_text`, `raw_metadata` — for rescans / future AI passes.

- `accounts_expenses`

  - Normalized expense facts extracted from financial documents.

  - Key fields:

    - `org_id`

    - `financial_document_id` (FK to `financial_documents.id`).

    - `category`, `subcategory`, `description`.

    - `amount`, `currency`, `incurred_at`, `vendor_name`.

## v1 classification helper (pure logic)

The v1 classifier lives in `lib/accounts-scanner.ts`.

It provides:

- `RawConnectorFileMeta` — generic metadata shape for connector items:

  - `source`, `fileName`, `mimeType`, `subject`, `fromEmail`, `toEmail`, `snippet`, `labels`.

- `FinancialDocType` and `AccountsReportType` — TypeScript mirrors of the enums.

- `InferredFinancialClassification`:

  - `docType` — mapped to `financial_doc_type`.

  - `confidence` — `0–1` score for how confident the classifier is.

  - `vendorName` — inferred vendor name, if any.

  - `notes` — free-form debugging context.

- `classifyFinancialDocument(meta)`:

  - Uses keywords and simple heuristics on `fileName`, `subject`, `snippet`, and `fromEmail`.

  - Returns a stable `docType` + `confidence` + `vendorName`.

This helper is **pure** (no database calls) so it can be used:

- On ingestion from connectors.

- In batch rescans of existing raw connector data.

- In unit tests.

## Intended integration points (later days / weeks)

Not implemented yet, but this is what later work will wire up:

1. **Connectors ingestion → financial_documents**

   - For Gmail:

     - Use the existing connector plumbing to fetch message metadata.

     - Map into `RawConnectorFileMeta`.

     - Call `classifyFinancialDocument(meta)`.

     - Insert into `financial_documents` with `doc_type`, `vendor_name`, and raw metadata.

   - For Drive:

     - Similar pattern using file name + mimeType + Drive labels.

2. **Expense extraction → accounts_expenses**

   - For v1, we can:

     - Start with simple mappings (e.g. single `amount` / `category` per document).

     - Later add AI-based parsing from `raw_text`.

3. **Accounts Builder**

   - Monthly Expenses Pack:

     - Query `accounts_expenses` for a given month and `org_id`.

   - Investor Accounts Snapshot:

     - Query `financial_documents` for high-level metrics (spend by category, key vendors).

## Non-goals for v1

- Full double-entry accounting.

- Direct integration with QuickBooks/Xero APIs.

- Tax-grade accuracy for all fields.

Those belong to a post-GA Accounts roadmap once the Scanner + Builder loop is stable.

