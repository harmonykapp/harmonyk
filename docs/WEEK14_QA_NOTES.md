# Week 14 – Accounts Builder / Financial Inbox QA Notes

## Scope

Week 14 focused on wiring the **Accounts Builder v1** (Financial Inbox) into the existing Builder shell and ensuring the Supabase CLI + migrations pipeline is stable:

- Fix Supabase CLI auth against the remote project (`supabase migration list --linked`).

- Add a dev-only classifier endpoint at `/api/dev/accounts/classify`.

- Normalize and seed `financial_documents` with Stripe + bank statement examples.

- Implement a read-only Accounts tab that surfaces financial documents by org.

## Routes / Flows Checked

- `/builder`

  - Contracts tab:

    - Templates load and can generate a stub V1 draft.

    - Save to Vault still works and surfaces the "Saved to Vault" banner.

  - Decks tab:

    - Deck templates visible.

    - Outline editing, deck generation, and save-to-Vault flow behave as before.

  - Accounts tab:

    - No infinite reload / flicker.

    - Three states behave correctly:

      - Loading state (spinner text) while Supabase query is in flight.

      - Empty state when `financial_documents` is empty.

      - List state when seeded financial rows are present.

- Supabase CLI:

  - `supabase migration list --linked` succeeds and shows local/remote migrations in sync.

## Known Limitations (Week 14)

- Accounts Builder is **read-only**:

  - No exports, no aggregation, and no pack generation yet.

- `financial_documents` is currently populated via dev seeding + classifiers:

  - No automated background ingestion jobs for production accounts.

These limitations are deliberate for Week 14; Week 15+ wires this inbox into real Accounts packs (Monthly SaaS Expenses, Investor Snapshot) and adds richer QA around those flows.

