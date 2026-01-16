# Harmonyk North Star (Post-GA) — SSOT

## Post-GA UI + Maestro Direction Update
Updated: 2025-12-20  
Scope: Post-GA definition + PGW1–PGW26 alignment + UI/AI philosophy shift

Canonical implementation artifacts:
- `docs/USER_PROGRESS_NARRATOR.md`
- `lib/user-progress.ts`
- `lib/__tests__/user-progress.test.ts`

---

## 1) New Core UX Doctrine (Post-GA)

### 2026 AI UX Doctrine (Harmonyk + Maestro)
- AI platforms will not be prompt-first. Prompts become a *secondary* input portal.
- The primary UX is **predictive insights + optimized choices + execution + reminders**.
- Maestro operates mainly through **UI actions embedded in pages** (buttons/chips), not chat.
- The UI is personalised to each user's **state**, **workload**, and **priorities**.

### 3-Layer Model (official)
1) **Predictive Signals** (widgets surface what changed / what's blocked / what's due / what's risky)
2) **Optimized Choices** (one primary action + 2–3 alternative chips + "Why?")
3) **Execute + Remind** (Maestro prepares → user approves if needed → executes → follows up with reminders until completed)

Rule: **Prompt window stays available, but is never required** for the main workflow.

---

## 2) Mandatory UI surface separation (no drift)

Harmonyk stays document-first by enforcing page intent:

### Integrations (user connectors only)
- Integrations is for **user-owned, user-authorized external data sources** (Drive/Gmail/etc.) used to import/classify/organize into Vault.
- **Documenso is platform-managed (built-in)** and must **not** appear as a user connector.
- If we show signature status/health, it belongs under a platform/system/admin surface (or internal ops), not end-user Integrations.

### Dashboard (state of business)
- High-level summary of doc/deal state, risk, signatures, activity, ingestion.
- Always includes a state-aware **Dashboard Hero** (User Progress Narrator) to avoid a blank dashboard.
- Click-throughs route to Workbench/Insights/Vault with filters applied.

### Workbench (what do I do now)
- Actionable only. Every element must lead to a next step (review, share, sign, follow-up, reminder).
- No heavy analytics on this page.

### Insights (analytics)
- All heavy analytics live here: histograms, heatmaps, geo, cohort/segment funnels.
- Organized by functional tabs (Overview, Activity, Connectors, Engagement, Timing/SLA, Automation, AI Impact, Usage/Ownership).

### Operational pages (Vault, Share Hub, Playbooks, Tasks, Integrations)
- Explorer/control first.
- Light health/status tiles allowed.
- Deep analytics belong in Insights.

### Integrations page (end-user connectors)
- `/integrations` is for **end-users** to connect their external accounts (Drive, Gmail, etc.) so Harmonyk can:
  - ingest **metadata-first** references,
  - import/copy selected files into **Vault** when the user chooses,
  - classify and organize into Vault folders.
- Third-party connectors beyond Google are added post-GA as "Coming Soon" until implemented.
- **Documenso is built-in** (platform-managed). It must not appear as a user-auth connector.

Operational-page intent guardrails:
- **Integrations** = end-user connectors to external systems (Drive/Gmail/Notion/Outlook/Dropbox/etc)
  for import → classify → organize into Vault. It supports multiple connected accounts per user/org
  within plan limits.
- **Platform-managed vendors are not "Integrations."**
  - Documenso (signatures) and OpenAI (LLM) are **built-in** platform services.
  - Users should never be asked to "connect" or configure these as if they are external accounts.

#### Integrations (end-user connector hub)
- `/integrations` is an end-user page for connecting and managing external accounts (Drive/Gmail at GA; more post-GA).
- Purpose: scan/import metadata and optional content, classify, and **organize into Vault** with a user-designed folder structure.
- It supports multiple connected accounts per provider over time (e.g., multiple Gmail/Drive accounts), within plan limits.

#### Signatures (built-in)
- Documenso is a built-in vendor integration used by Harmonyk for all users.
- Users do not "connect Documenso"; they only manage envelopes/status/history in-app.

---

## 3) Concrete product feature additions (v1)
### A) User Progress Narrator (Dashboard + Maestro Quick Starts)
Per-user `UserProgressState` drives:
- Dashboard hero ("Welcome {firstName}… next best step")
- Maestro quick-start chips (state-aware)

Canonical states:
- `ONBOARD_CONNECTORS`, `ONBOARD_IMPORT`, `ORGANISE_METADATA`,
  `START_DEAL`, `ENABLE_AUTOMATION`, `MATURE_TODAY_FOCUS`

Minimum rule-set (first matching rule wins):
1) no connectors → `ONBOARD_CONNECTORS`
2) connectors but no docs → `ONBOARD_IMPORT`
3) docs but poor metadata → `ORGANISE_METADATA`
4) no deal/workflow started → `START_DEAL`
5) no automation enabled → `ENABLE_AUTOMATION`
6) else → `MATURE_TODAY_FOCUS`

Each state produces:
- one primary CTA + optional secondary CTA
- 3–5 Maestro quick-start actions/chips

This is the "no blank dashboard" solution.

### B) Actionable Widgets Standard (one widget system everywhere)
Every widget must support:
1) click → drill-down view (filtered list / detail)
2) action bar appears with one primary action + 2–3 chips + "Why?"
3) optional Maestro sidecar shows preview + "Why?" + approve/execute
4) loading / empty / error states

Widget slots (standard):
- Header (title, optional subtitle, optional time-range control)
- Body (chart/list/content)
- Actions (0–3 actions max)
- Sidecar (optional: filters, explanation, preview, approval CTA)

Widget sizing (12-col grid only; no one-off widths):
- S = 3 cols (KPI/status)
- M = 4 cols (small lists/sparklines)
- L = 6 cols (primary charts/lists)
- XL = 12 cols (funnels/swimlanes/matrices)

### C) Reminder Layer (first-class)
Maestro proposes/executes and **reminds**.
- Reminder modes: Off / Manual / Autopilot
- Guardrails: rate limits, stop conditions (signed/moved stage/responded), mute/pause per doc/counterparty

---

## 4) High-ROI viral loops (low complexity only)
1) **Free Collaborator Role** (view/comment/suggest only)
2) **Keep a copy in your Vault** (recipient CTA after viewing/signing)
3) **Clone this template for yourself** (share page CTA)

Guardrails:
- Never block view/sign.
- CTAs are non-spammy and clearly separated from the primary action.

Instrumentation events (canonical):
- `invite_collaborator`, `claim_signed_doc`, `clone_template`

---

## 5) RAG + template strategy (impacted by new UI)
We are moving from prompt-based Q&A to **action-centric RAG**.
Retrieval must support actions with:
- Evidence (Vault content + citations)
- Constraints (preferences/policy)
- Entity context (docId/envelopeId/shareLinkId/taskId)

Define "Action Context Pack":
- `{goal, entities, evidence, policy, options, reminder_plan}` as canonical input to Maestro, previews, and audit logs.

Indexing aligns to UI:
- Vault semantic index (content)
- metadata index (structured)
- activity/event index (timeline)
- internal template/clause library index (generation choices)

Templates must carry operational metadata:
- required inputs, risk profile, recommended workflow, default reminder cadence,
  optional/required clauses, tone variants

---

## 6) PGW1–PGW26 plan alignment (high level)

### PGW1 — Foundation (complete)
- Stabilisation + schema correctness + core reliability (auth/share/vault)
- Prepare UI surfaces for actionable widgets (layout slots, drill-down patterns)

### PGW2 — Guided UX + Viral v1 (this week)
- Implement User Progress Narrator (Dashboard hero + Maestro quick-start chips)
- Implement viral loops v1 (free collaborators, keep-a-copy, clone-template) behind feature flags
- Standardize widget drill-down + action bar UX (single widget system)
- Lock design tokens (spacing/type/radius/shadows/icon sizing) and apply to Dashboard + Builder Hub

PGW2 acceptance criteria:
- AppShell renders all routes with **one** sidebar component and **one** header component; no duplicate nav trees.
- Tokens exist in a single source and are used by Dashboard + Builder Hub.
- UserProgressState drives DashboardHero + Maestro quick-start chips.
- Viral CTAs are behind flags and never block view/sign.
- No regressions: share → sign → save flows pass smoke.

### PGW3–PGW6 — Operator-grade Maestro
- Action taxonomy + execution previews ("Maestro sidecar")
- Reminder system v1 (modes + guardrails + stop conditions)
- Action-centric RAG scaffolding (Action Context Pack) + template operational metadata

### PGW7–PGW26 — Scale + Depth
- Expand connectors, deepen Workbench/Insights, reliability hardening, A/B refine action ranking,
  richer automation, mature action-centric RAG/evals

---

## 7) Ultimate Post-GA definition
Harmonyk is a **document-first operating system** with Maestro as an operator:
- UI surfaces predictive signals
- offers simple choices
- executes with human-in-loop
- reminds until outcomes happen

Prompts remain available, but secondary.

Canonical detail: `docs/UI/MAESTRO_UX_DOCTRINE.md`
