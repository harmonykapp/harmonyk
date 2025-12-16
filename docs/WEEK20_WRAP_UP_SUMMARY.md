# Week 20 — GA Surfaces Wrap-Up

> Scope: Share Hub, Signatures Center, Contacts, Insights, Task Hub, Task Calendar  
> Status: **Code Complete for GA shell**, with clear post-GA upgrade paths.

---

## 1. Week 20 Objectives

- Ship **founder-facing surfaces** that answer:

  - *"What did Harmonyk do for me?"* (Insights)

  - *"Who did I share this with?"* (Share Hub, Contacts)

  - *"Where are my signatures stuck?"* (Signatures Center)

  - *"What do I need to do next, and when?"* (Tasks + Calendar)

- Keep all new surfaces:

  - **Safe at low usage** (no hard dependency on rich data).

  - **Aligned to GA scope** (no deep admin tools or complex config panels).

  - **Ready for telemetry** (easy to extend with PostHog events, RAG context, etc).

Week 20 is essentially the **"control tower"** sprint: stitching together the work from Weeks 1–19 into dashboards and hubs.

---

## 2. Features Landed in Week 20

### 2.1 Share Hub & Share Links

Routes:

- `app/(protected)/share/page.tsx` — Share Hub overview.

- `app/(protected)/share/links/page.tsx` — Share Links tab.

Key behaviours:

- Demo-friendly cards for:

  - Active links

  - Total views

  - Protected links

  - Guest signups (stub/demo)

- Tabs:

  - Overview

  - Share Links

  - Signatures

  - Contacts

- Share Links table:

  - Document title

  - Permission (View / Comment / Edit)

  - Protection (Password / Watermark)

  - Views / Last viewed / Expiry

  - Actions:

    - **Open link** (demo URL + toast)

    - **Copy link** (clipboard where available, fallback toast)

    - **Revoke** (demo-only removal from local state)

- Feature flag:

  - `FEATURE_SHARE_ACTIONS` gates "real" actions vs "coming soon" toasts.

GA posture:

- Uses **demo data** in non-production environments; can be wired to real share-link rows post-GA.

- No destructive API calls from the table yet; all revokes are UI-only in GA shell.

Related docs:

- `docs/WEEK20_SHARE_SIGN_CONTACTS_SUMMARY.md`

- `docs/SHARE_SIGN_CONTACTS_QA_CHECKLIST.md`

---

### 2.2 Signatures Center

Route:

- `app/(protected)/signatures/page.tsx`

Key behaviours:

- Demo envelopes covering pending, completed, declined, and expired states.

- Summary cards:

  - Pending

  - Completed

  - Attention Needed (declined/expired)

  - Average turnaround time (send → complete)

- Table view:

  - Document

  - Signer (name + email)

  - Status badge (Pending / Completed / Declined / Expired)

  - Sent date

  - Last activity

  - Source (Vault / Workbench / Upload)

  - Actions:

    - Open envelope (demo URL + toast)

    - Copy link (clipboard or toast)

    - Resend (demo reminder + updated last activity)

    - Cancel (marks as expired in local state)

- Feature flag:

  - `FEATURE_SIGNATURE_ACTIONS` gates "real" actions vs read-only GA posture.

GA posture:

- **Read-only** with demo envelopes at GA; all real send flows still originate from:

  - Vault (document-level Send / Sign buttons).

  - Workbench.

---

### 2.3 Contacts Hub

Route:

- `app/(protected)/share/contacts/page.tsx`

Key behaviours:

- Overview:

  - Total contacts

  - Warm contacts

  - Signed contacts

  - Investors (demo metrics)

- Contacts table:

  - Name + email + company

  - Role (founder, investor, counsel, etc.)

  - Last touch and last signed date

  - Tags for share/sign behaviour (e.g. "Signed NDA", "Opened deck")

  - Actions (flagged behind `FEATURE_SHARE_ACTIONS`):

    - Open contact (future detail panel)

    - Copy email

    - Mark as warm / archive (demo behaviour only)

GA posture:

- **Display-only** contact list with demo data.

- Future wiring:

  - Imports from Google Contacts / CRM.

  - Autocreated contacts from share/sign flows.

---

### 2.4 Insights, Tasks, and Calendar

See:

- `docs/WEEK20_INSIGHTS_TASKS_CALENDAR_SUMMARY.md`

- `docs/INSIGHTS_TASKS_CALENDAR_QA_CHECKLIST.md`

Quick recap:

- `/insights` — Founder-facing "what's happening?" view.

- `/tasks` — Org-scoped Task Hub with create / toggle / due date edit, wired to `app/api/tasks/route.ts`.

- `/calendar` — Read-only weekly agenda over open tasks with due dates.

Together with Share / Sign / Contacts, these surfaces complete the **"meta layer"** for GA: activity, commitments, and follow-ups.

---

## 3. GA Readiness & Known Deferrals

Ready for GA:

- Share Hub overview + Share Links table (demo-backed, GA-safe shell).

- Signatures Center summary + table (demo envelopes, GA-safe).

- Contacts Hub overview + table (demo contacts, GA-safe).

- Insights, Tasks, and Calendar surfaces as documented above.

- All new pages:

  - Respect feature flags.

  - Handle missing/low data without crashing.

  - Avoid destructive actions in GA.

Intentionally deferred to post-GA:

- Real-time sync of share links and envelopes from Supabase/Documenso.

- Full contact import (Google, CRM) and auto-enrichment.

- Deep analytics (funnels, cohort charts) on `/insights`.

- Bulk task operations and drag-to-reschedule on `/calendar`.

---

## 4. QA / Manual Test Pointers

- Run the QA docs:

  - `docs/SHARE_SIGN_CONTACTS_QA_CHECKLIST.md`

  - `docs/INSIGHTS_TASKS_CALENDAR_QA_CHECKLIST.md`

- Confirm:

  - No 500s on `/share`, `/share/links`, `/signatures`, `/share/contacts`, `/insights`, `/tasks`, `/calendar`.

  - Feature-flagged actions show **"coming soon"** toasts when disabled.

  - Tasks created in `/tasks` appear in `/calendar` when:

    - `status = open`

    - `due_at` falls within the visible week.

This file is the **Week 20 wrap**: a human-readable map of what was actually shipped so you don't have to reverse-engineer it from the code and previous docs.

