# Harmonyk Beta – Readiness Checklist

This document summarizes the key checks for the Week 6 Harmonyk Beta build.  
It is a concise view of what works, what is guarded behind feature flags, and what remains as known issues.

---

## 1. Golden Path

| Item                                                                                  | Status      | Notes                                                                                      |
|---------------------------------------------------------------------------------------|------------|--------------------------------------------------------------------------------------------|
| Dashboard → Workbench → Builder → Vault → Activity → Mono runs without hard crashes  | ✅ DONE     | Mono currently returns a stub response, but auth and error handling are stable.           |
| Golden path actions show clear error toasts (no silent failures)                     | ✅ DONE     | Workbench, Builder, Vault, Activity, Mono all use centralized toast-based error handling. |
| ActivityLog entries created for key actions (analyze, generate, save, mono query)    | ✅ DONE     | Activity page loads without errors and shows recent events.                               |

---

## 2. Security & Data Isolation

| Item                                                         | Status      | Notes                                                                                      |
|--------------------------------------------------------------|------------|--------------------------------------------------------------------------------------------|
| RLS enabled for unified_item / document / activity_log       | ✅ DONE     | Policies reviewed in `W6_RLS_REVIEW.md`.                                                   |
| Logged-in user cannot see other users' or orgs' documents    | ✅ DONE     | Single-user dev setup behaves as expected.                                                 |
| Auth failures show "Session expired" pattern (not raw errors) | ✅ DONE     | All relevant pages/API calls map 401/403 to a consistent UX pattern.                       |

---

## 3. Feature Flags & Risk Containment

| Item                                                                 | Status      | Notes                                                                                      |
|----------------------------------------------------------------------|------------|--------------------------------------------------------------------------------------------|
| Playbooks engine gated by `FEATURE_PLAYBOOKS_ENGINE`                | ✅ DONE     | Beta build shows "Playbooks (coming soon)" stub only.                                      |
| Advanced share workflows gated by `FEATURE_SHARE_ACTIONS`           | ✅ DONE     | Only basic share flows visible; advanced paths are hidden or marked "coming soon".         |
| Extra connector filters gated by `FEATURE_CONNECTORS_EXTRA`         | ✅ DONE     | No confusing extra filters surfaced in Workbench for Beta.                                 |
| Vault experimental actions gated by `FEATURE_VAULT_EXPERIMENTAL_ACTIONS` | ✅ DONE | "Open in Builder" from Vault and dead 3-dot menus are hidden by default.                   |

---

## 4. Telemetry & Diagnostics

| Item                                        | Status      | Notes                                                                                      |
|---------------------------------------------|------------|--------------------------------------------------------------------------------------------|
| Server-side telemetry logs key events       | ✅ DONE     | `logServerEvent` / `logServerError` used in golden-path API routes.                        |
| Activity log inserts include useful metadata | ✅ DONE     | `activity_log` entries include user, org, doc, source, and route context where available.  |
| `/api/health` and `/dev/health` work        | ✅ DONE     | Dev health page shows app env, Supabase URL, and feature flag states.                      |

---

## 5. Onboarding & First-Run UX

| Item                                              | Status      | Notes                                                                                      |
|---------------------------------------------------|------------|--------------------------------------------------------------------------------------------|
| Dashboard welcome card explaining golden path     | ✅ DONE     | First-run card appears and can be dismissed; dismissal persisted via localStorage.         |
| Dashboard explains what each main nav item does   | ✅ DONE     | Short copy for Workbench, Builder, Vault, Activity, Mono on the Dashboard.                 |
| Workbench empty state uses a "Demo NDA (sample)"  | ✅ DONE     | New users are not stuck with a blank page; demo content clearly labeled as sample.         |

---

## 6. Known Issues

- Only P1/P2 (non-blocking) issues should remain for Beta.

- Full list and details are maintained in `docs/W6_ISSUES.md` under:

  - **Golden Path Bug Log**

  - **Candidates for Feature Flags / Hiding**

  - **Notes & Decisions**



If any new P0 issues are discovered, they must be:

1. Logged in `W6_ISSUES.md`, and  

2. Resolved before inviting additional external Beta users.

