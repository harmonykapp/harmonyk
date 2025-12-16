# Week 6 – Issues & Beta Checklist



This file is the single source of truth for Week 6 stability work.  
It tracks:
- Lint/build problems
- Golden-path bugs
- Items to hide or feature-flag for Beta
- Key notes and decisions

---

## 1. Beta Checklist (Summary)

| ID        | Item                                                                                       | Status       | Notes                                                                                      |
|-----------|--------------------------------------------------------------------------------------------|--------------|--------------------------------------------------------------------------------------------|
| BETA-001  | Golden path: Dashboard → Workbench → Builder → Vault → Activity → Maestro runs end-to-end    | DONE         | Golden path runs with Maestro stub response; no auth errors; UI guarded by feature flags.    |
| BETA-002  | Error handling & auth: toasts instead of silent failures on golden-path pages             | DONE         | Workbench, Builder, Vault, Activity, Maestro all use centralized toast-based error handling. |
| BETA-003  | RLS & auth review for unified_item / document / activity_log                              | DONE         | RLS policies documented in W6_RLS_REVIEW; no obvious multi-tenant leaks for Beta.         |
| BETA-004  | Feature flags contain half-built surfaces (Playbooks, Share, connectors, Vault actions)   | DONE         | Feature flags default to OFF; broken/experimental actions hidden or marked "Coming soon". |
| BETA-005  | Telemetry & health: minimal server telemetry + /dev/health diagnostics                    | DONE         | Telemetry helper wired into key API routes; /dev/health and /api/health working.          |
| BETA-006  | Onboarding & first-run UX (Dashboard + Workbench demo NDA)                                | DONE         | Welcome card, nav explanation, and Workbench demo NDA empty state are implemented.        |
| BETA-007  | ActivityLog entries & metadata look sane for golden-path flows                            | DONE         | Activity events created with useful metadata; no crashes on Activity page.                |
| BETA-008  | Known issues limited to P1/P2 only (no open P0s)                                          | IN PROGRESS  | See Golden Path Bug Log and W6_ISSUES details below.                                      |

Update this table over the week as issues are fixed or discovered.

---

## 2. Lint / Build Issues

Use this section to log any `npm run lint` or `npm run build` warnings/errors.

| ID        | Command        | Message (trimmed)                                            | Severity (P0/P1/P2) | Status |
|-----------|----------------|--------------------------------------------------------------|---------------------|--------|
| BUILD-001 | npm run build  | workbench: 'status' is possibly 'null'                      | P0                  | DONE   |
| BUILD-002 | npm run build  | Cannot find module 'next-themes'                            | P0                  | DONE   |
| BUILD-003 | npm run build  | Cannot find module '@/hooks/use-toast'                      | P0                  | DONE   |
| BUILD-004 | npm run build  | TS error(s) in components/navigation/Sidebar.tsx            | P1                  | DONE   |
| BUILD-005 | npm run build  | TS error(s) in components/navigation/TopBar.tsx             | P1                  | DONE   |
| BUILD-006 | npm run build  | TS error(s) in components/theme-toggle.tsx                  | P1                  | DONE   |
| BUILD-007 | npm run build  | TS error(s) in lib/auth/route-auth.ts                       | P0                  | DONE   |

Add new rows here if more lint/build issues appear later in Week 6.

---

## 3. Golden Path Bug Log

Golden path definition:

> Dashboard → Workbench (Analyze doc) → Builder (Generate V1 + edits) → Save to Vault → Vault → Activity → Maestro

Log any bug or nasty UX/jank discovered when walking this flow.

| ID      | Route / Screen | Repro Steps                                      | Expected                                          | Actual                                           | Severity (P0/P1/P2) | Status |
|---------|----------------|--------------------------------------------------|---------------------------------------------------|--------------------------------------------------|---------------------|--------|
| GP-001  | /vault         | From Vault, select a doc card and look for a way to open/read it | Clearly visible "Open"/"View" action that opens the document in a reader or detail view | UX is confusing; "Open in Builder" just jumps to `/builder` with no link to the selected doc, and it's not obvious that "View" is the only way to open/read the document | P2                  | TODO   |
| GP-002  | /mono          | From Vault, select a doc, click "Ask Maestro", then ask "what is this document for?" | Maestro should answer based on the selected document context | Maestro chat replies with `Error: Authentication required` and does not answer | P0                  | DONE   | Verified fixed in Week 6 Day 6 after Beta hardening. |
| GP-003  | /vault         | In Vault, click the 3-dot menu on a document card | Show a menu of actions (open, share, archive, etc.) | 3-dot menu appears but clicking it does nothing; no menu or feedback | P2                  | TODO   |

> Example (commented out):
> <!--
> | GP-001 | /builder       | Click "Generate V1" with valid input             | New draft is created and displayed                | Button throws 500 error in console               | P0                  | TODO   |
> -->

Add rows as bugs are found during manual testing.

> As of Week 6 Day 6, all known P0 issues are resolved for the golden path.

---

## 4. Candidates for Feature Flags / Hiding

Use this section to list non-essential or half-built features that should be hidden or wrapped in flags for Beta.

- [ ] Example: Hide any "Advanced Playbooks" actions that are not wired end-to-end.
- [ ] Example: Hide extra connector filters on Workbench if they are unstable or cosmetic only.
- [ ] Add real items here as you find risky UI or unfinished flows during Week 6.
- [ ] Hide or disable the "Open in Builder" action from Vault until it can open the selected document context correctly.
- [ ] Hide or disable the 3-dot menu on Vault document cards until it has real actions wired up.

---

## 5. Notes & Decisions

Use this section for ad-hoc notes and decisions made during Week 6.

- Week 6 Day 1: TypeScript build is now passing after fixing:
  - workbench status null check
  - next-themes module and theme provider
  - toast hook (`use-toast`) wiring
  - navigation: Sidebar and TopBar TS issues
  - theme-toggle TS issues
  - route-auth TS issues
- Week 6 Day 1: `npm run lint` is clean at the start of Week 6.
- Week 6 Day 1: Golden path smoke test shows: Vault open UX confusion ("Open in Builder" not wired to the selected doc) and dead 3-dot menu (GP-001, GP-003), plus Maestro step blocked by auth error (GP-002). All logged for Week 6 follow-up.
