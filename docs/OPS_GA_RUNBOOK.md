# OPS_GA_RUNBOOK — Monolyth GA v1

This runbook describes the **operational steps** for running a GA-like Monolyth instance.

It is intended for:

- You (founder) running a local or small cloud instance.

- Any future ops/dev who needs to bring up or debug GA.

---

## 1. Env & Config Sanity (Pre-GA)

Use this checklist before treating any environment as "GA-like".

- [ ] All **Required (GA)** env vars from `docs/ENV_GA_REFERENCE.md` are defined.

- [ ] Experimental flags are **off by default**:

  - [ ] `MONO_RAG_ENABLED=false`

  - [ ] `NEXT_PUBLIC_MONO_RAG_ENABLED=false`

  - [ ] `NEXT_PUBLIC_SHOW_LABS=false`

- [ ] `npm run lint` passes with no blocking errors.

- [ ] `npm run build` passes using the GA-like `.env.local`.

- [ ] `npm run dev` boots without missing-env crashes on:

  - `/` (or the main dashboard route).

  - Builder (Contracts, Decks, Accounts tabs).

  - Vault.

  - Workbench.

  - Insights.

---

## 2. Fresh DB + Migrations

Steps for validating the schema and first-run behaviour:

1. Provision a **fresh database** (new Supabase project or new schema).

2. Apply all migrations in the repo (via Supabase CLI or your migration tooling).

3. With the GA-like `.env.local`:

   - [ ] `npm run dev` starts without migration errors.

   - [ ] Visiting Dashboard, Vault, Builder, Workbench, and Insights does **not** produce 500s when the DB is empty.

4. Record any required **seed data** (if truly necessary) and add it to the migrations or a clear seed step.

---

## 3. RLS & Cross-Org Sanity

To prove org-scoped isolation is correct:

1. Create **two test users** in different orgs (Org A and Org B).

2. As Org A:

   - Create at least one contract and save it to Vault.

   - Run at least one Playbook.

   - Run at least one Accounts Pack.

3. As Org B:

   - [ ] Vault list shows only Org B items (no visibility of Org A docs).

   - [ ] Workbench queries do not surface Org A content.

   - [ ] Insights tiles reflect only Org B activity.

   - [ ] Activity log shows only Org B events.

4. If any cross-org leakage is observed, **do not** treat the environment as GA-safe until RLS is fixed.

---

## 4. GA Walkthrough (High-Level)

See the Week 20 plan and `docs/WEEK20_GA_CUT_SUMMARY.md` for the full GA walkthrough sequence.

This file is focused on **ops and safety** (env, migrations, RLS).
