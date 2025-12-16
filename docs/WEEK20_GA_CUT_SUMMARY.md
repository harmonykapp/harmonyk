# WEEK20_GA_CUT_SUMMARY.md — GA cut & ops (Week 20)

> Status: Skeleton for Week 20 — fill this out as you complete GA tasks.

---

## 1. Overview

**Week 20 focus:**  

Lock in the GA surface, harden telemetry and error handling, and make the repo "deployable on demand" without adding new heavy features.

Use this doc to capture:

- What actually shipped for GA.

- Any compromises or deferrals (post-GA backlog).

- Operational readiness (env, runbooks, telemetry).

---

## 2. What was implemented

Fill this section with **file-level bullets** once tasks are done. Example structure:

### 2.1 GA scope & feature flags

- [ ] Updated **NORTH_STAR.md** to confirm GA scope and remove any outdated modules.

- [ ] Updated **GA_CHECKLIST.md** to match what's truly in GA vs post-GA.

- [ ] Reviewed feature flags and set final GA defaults (e.g. Vault experimental, Mono RAG dev stubs).

### 2.2 Env & config sanity

- [ ] Created / updated **docs/ENV_GA_REFERENCE.md** with all required env categories.

- [ ] Verified `npm run build` with a GA-like `.env.local` (no missing env or crashes).

- [ ] Confirmed Supabase migrations run cleanly on a fresh DB and match the live project schema.

### 2.3 Telemetry & error surfacing

- [ ] Ensured **critical flows** emit telemetry and route errors through `handleApiError` (or equivalent):  

  - Sign-in / auth  

  - Builder: generate, save to Vault  

  - Signatures: send for signature  

  - Vault: open doc, basic actions  

  - Workbench / Mono queries  

  - Accounts packs  

- [ ] Reduced noisy dev logs / stack traces in the browser console for GA flows.

### 2.4 GA walkthrough & UX polish

- [ ] Ran a full GA walkthrough using **OPS_GA_RUNBOOK.md** and fixed P0/P1 issues.  

- [ ] Tidied obvious UX paper cuts (copy, headings, misaligned buttons) without adding new features.  

- [ ] Confirmed empty/"no data yet" states look deliberate rather than broken (Dashboard, Vault, Activity, Insights, Builder).

### 2.5 Docs & handover

- [ ] Updated top-level **README** with GA-focused information: what Harmonyk is, what's in GA, how to run locally.  

- [ ] Updated **OPS_GA_RUNBOOK.md** with current GA steps and gotchas.  

- [ ] Updated this file with a final summary of Week 20 outcomes.  

---

## 3. GA decisions & trade-offs

Describe any **intentional decisions** you made about scope:

- Features explicitly included in GA (core "doc-first" workflows).

- Features kept **behind flags** as experimental (e.g. Mono RAG preview, deep Playbooks flows).

- Features explicitly pushed **post-GA**.

Suggested structure:

- **Included in GA:**  

  - Contracts Builder GA flow (generate → save to Vault → send for signature).  

  - Decks Builder GA flow (fundraising + investor update decks saved to Vault).  

  - Vault + Share + Insights minimal loop.  

  - Workbench + Mono basic operator behaviour.  

- **Behind flags / internal-only:**  

  - Mono RAG dev-only preview and training stubs.  

  - Any experimental Playbooks or Accounts visualizations beyond GA scope.  

- **Post-GA (backlog):**  

  - Richer RAG / Mono memory experience.  

  - Multi-connector expansion (Notion, Slack, etc.).  

  - Deeper Accounts Packs exports and visual dashboards.  

Update this list to reflect reality once you've actually frozen GA.

---

## 4. Telemetry & ops readiness

Summarise how "operable" the GA instance is:

- **Telemetry:**  

  - Which key flows are tracked, and where those events go (PostHog/Sentry/other).  

  - Any known telemetry gaps you're accepting at GA.

- **Error handling:**  

  - Confirm that user-visible errors for critical flows appear as clear toasts or inline messages, not silent failures.  

  - Note any remaining rough spots (e.g. generic "Something went wrong" where you'd like more detail later).

- **Runbooks & procedures:**  

  - Is **OPS_GA_RUNBOOK.md** sufficient for: starting, stopping, and debugging a GA deployment?  

  - Are there any undocumented one-off scripts or steps you'd need to remember manually?

Keep this section short but concrete — think "can future-you understand what state GA launched in?"

---

## 5. Known gaps & post-GA backlog

List the gaps you **know** about and are consciously accepting at GA.

Categories you might use:

- **Product / UX gaps:**  

  - e.g. "Workbench explanations are still a bit terse for first-time users."  

- **Technical debt:**  

  - e.g. "Mono RAG uses dev stubs; no real retrieval layer yet."  

- **Operational risk:**  

  - e.g. "No automatic alerting on failed background jobs; requires manual log checks."  

These should be copied or referenced from a dedicated **`docs/POST_GA_BACKLOG.md`** (or similar) so you don't lose them.

---

## 6. Files & routes touched (Week 20)

As you work through Week 20, keep a simple list of the main assets you touched.  

This makes it easier to review changes and debug regressions later.

Example structure (replace with real paths):

- **Docs:**  

  - `docs/ENV_GA_REFERENCE.md` — GA env configuration reference.  

  - `docs/OPS_GA_RUNBOOK.md` — updated GA walkthrough and ops steps.  

  - `docs/WEEK20_GA_CUT_SUMMARY.md` — this file.  

- **Config / infra:**  

  - `next.config.mjs` / `turbo.json` / etc. (if you touched them).  

  - Any Supabase migration files created in Week 20.  

- **App code:**  

  - Key routes updated for GA (e.g. `/dashboard`, `/builder`, `/vault`, `/workbench`, `/insights`).  

  - Telemetry / error-handling helpers (`lib/handle-api-error.ts`, `lib/telemetry/*`, etc.).  

Update this at the end of the week so it reflects what actually changed, not just the intent.

---

## 7. Final GA status (end of Week 20)

At the **end** of Week 20, fill in a short, blunt summary:

- **Is the GA build in a state you'd be willing to host and show to real users?**  

- **What would you fix first if you had one more week?**  

- **What's the single riskiest assumption still baked into this GA?**  

This section becomes the historical snapshot of "what GA actually meant" when you shipped it.

