# Week 4 Smoke Test – Mono / Harmonyk

This document captures the **end of Week 4** reality check. It is meant to be run
locally and on Vercel using the real Supabase project and OpenAI key.

The goal is not perfection – just verifying that the main flows basically work
and that known gaps are documented for Week 5.

---

## Preconditions

- `.env.local` configured with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - Google OAuth + Drive / Storage keys (for existing integrations)

- Supabase has:
  - Core Week 4 tables (`user`, `org`, `member`, `source_account`, `unified_item`,
    `document`, `version`, `share_link`, `envelope`, `activity_log`, `template`,
    `clause`).
  - Template + Clause seed data from `supabase/schema/week4_templates_seed.sql`.

- App is running at:
  - Local: `http://localhost:3000` (or `3001`)
  - Vercel environment connected to the same Supabase project.

---

## 1. Workbench → Analyze (AI)

**Objective:** From Workbench, open the Analyze drawer and get an AI summary.

Steps:

1. Sign in (magic link or Google) and navigate to **Workbench**.
2. Confirm there are one or more rows (from Drive / Vault / other sources).
3. For a given row, click **Analyze**.
4. In the Analyze drawer:
   - Confirm the snippet loads.
   - Click the **Analyze** button.
5. Verify:
   - Summary, Entities, Dates and Next Action fields are populated.
   - Errors are surfaced as inline messages and do **not** crash the page.

**Expected Week 4 behaviour:**

- ✅ OpenAI is called and returns structured output for the item.
- ✅ The Analyze drawer is usable end-to-end from the user's point of view.
- ❌ `activity_log` is **not yet reliably populated** for `analyze_completed`
  events – this is explicitly a **Week 5 TODO**.

---

## 2. Builder → Version 1 (Contracts Builder V1)

**Objective:** Use the Contracts Builder to produce a Version 1 draft using
Templates + Clauses.

Steps:

1. Go to **/builder**.
2. In **Step 1 (Template)**:
   - Confirm a list of templates appears (Mutual NDA, MSA, SaaS, etc.).
   - Select one template.
3. In **Step 2 (Clauses)**:
   - Tick several relevant clauses (Confidentiality, IP, Payment Terms, etc.).
4. In **Step 3 (Instructions)**:
   - Enter a realistic scenario (parties, business context, key terms).
5. In **Step 4 (Version 1 draft)**:
   - Click **Generate Version 1**.

**Expected Week 4 behaviour:**

- ✅ The Version 1 textarea is populated with a **stub draft** that clearly
  reflects:
  - Template name
  - User instructions
  - Selected clauses
  - A TODO marker indicating this is a temporary stub.
- ✅ **Save Version 1** button exists and is disabled until there is content.
- ✅ Clicking **Save Version 1** shows a clear alert explaining that:
  - Save to Vault and Versions is not wired yet.
  - This is scheduled for **Week 5**.
- ❌ No Document / Version rows are guaranteed yet – **DB wiring is a follow-up**.

---

## 3. Vault → Share

**Objective:** Confirm the original Save→Vault→Share flow still works for
documents that are already wired to Supabase.

> Note: This may still be using the pre–Week 4 save path. The key requirement
> is that there is at least one happy-path flow for saving a doc and sharing it.

Steps:

1. Use any existing path that creates a document into Vault (if available).
2. Go to **Vault** and confirm the new/updated document appears.
3. Use the **Share** action for that document.
4. Verify:
   - A Share link is created.
   - Visiting the Share URL renders a basic read-only view.

**Expected Week 4 behaviour:**

- ✅ At least one Save → Vault → Share flow works end-to-end.
- ✅ Share links are backed by real Supabase rows.
- ❌ Not all new "Version 1" drafts are wired into Vault yet – this is a
  Week 5 task.

---

## 4. ActivityLog & Telemetry – Week 4 Snapshot

**Objective:** Capture the status of ActivityLog and telemetry at end of Week 4.

Current state (Week 4 EOW):

- `activity_log` table exists with the agreed schema.
- Analyze and Builder code contains **telemetry stubs** (console-based) that can
  later be wired into PostHog.
- Attempted wiring of:
  - `analyze_completed` → `activity_log`
  - `builder_generate` / `version_saved` events
  has been deferred due to debugging overhead and will be revisited in Week 5.

**Week 5 TODO:**

- Implement a clean, unified path for:
  - Workbench Analyze → `activity_log(type = 'analyze_completed')`.
  - Contracts Builder Version 1 Save → `document` + `version` + `activity_log(type = 'version_saved')`.
- Verify via:
  - Dedicated `/api/*` debug routes, or
  - Server actions with clear logging.

---

## 5. Summary – Week 4 Exit Criteria (Actual)

At the **end of Week 4**, the realistic status is:

- ✅ OpenAI is wired and callable for Analyze.
- ✅ Workbench has a working Analyze drawer with structured AI output.
- ✅ Supabase core schema and helpers are in place.
- ✅ Templates and Clauses are stored in Supabase and used by the Builder.
- ✅ Contracts Builder V1 presents a full, guided flow and generates a usable draft
  (stubbed text for now).
- ⚠️ Save-to-Vault for Version 1 and `activity_log` signals for Analyze/Builder are
    **known gaps**, explicitly deferred to Week 5.

