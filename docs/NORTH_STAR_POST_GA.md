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

### UX / UI Minimalism Rules (Locked)
- Most pages: at most 1 row of 3 widgets + compact Quick Actions strip + optional Maestro recs.
- Widget sections collapsed by default on first render/first visit (NO persistence unless already supported).
- Each page must have a purpose line + primary CTA under title.
- Keep at least one anchor per page (primary list/table or a single “do next” card) so pages never feel empty.

### 3-Layer Model (official)
1) **Predictive Signals** (widgets surface what changed / what's blocked / what's due / what's risky)
2) **Optimized Choices** (one primary action + 2–3 alternative chips + "Why?")
3) **Execute + Remind** (Maestro prepares → user approves if needed → executes → follows up with reminders until completed)

Rule: **Prompt window stays available, but is never required** for the main workflow.

---

## 2) Workflow-first Navigation (Locked)
Exact left-nav order:
1) Dashboard
2) Tasks
3) Workbench
4) Rooms
5) Vault
6) Builder
7) Share Hub
8) Playbooks
9) Insights
10) Integrations
11) Settings

## 2.1) Design System (Locked)
- Single accent color aligned to nav/buttons/logo.
- Mono charts (no multi-color graphs).
- Semantic colors (red/amber/green) allowed only as small badges/dots/icons/status tags, not full charts.
- Prefer ranked lists, KPI cards, mono bars/lines, stacked bars; avoid pies/donuts.

## 3) Rooms (Locked)
- Rooms are top-level deal / project / company hubs.
- Each Room auto-aggregates docs, evidence, timeline, and actions.
- Rooms are project/deal/company hubs (containers for docs/sources/tasks/activity). NOT teams/workspaces.
- Rooms are NOT part of Playbooks.

## 3.1) Workbench (Locked)
- Workbench is the personal execution cockpit across all Rooms (queues for review/sign/blockers).

## 3.2) Playbooks (Locked)
- Playbooks are the automation engine operating on Rooms/docs/tasks; runs monitored in Playbooks.

## 4) Tasks (Locked)
- Tasks is a doc-driven action queue (views, signatures, approvals, renewals, filing, playbook steps).
- Tasks is not a generic CRM task list.

## 5) Evidence-first RAG (Vault-only semantic index posture)
Timeline (locked):
- PGW5: define chunk + citation contract
- PGW6: implement first real `rag.retrieve()` (read-only) with citations
- PGW7–PGW8: template corpus + library ingestion (normalize/chunk/tag/version + golden query sets)
- PGW9–PGW14: expand corpus with Builders, large-doc handling
- PGW15–PGW17: connector-driven corpus growth
- PGW19–PGW20: evals/observability/regressions ("no lies", no permission leaks)

## 6) Tool Spine (MCP-style, stubs first)
Typed tool contracts (stubs acceptable first):
- `vault.list`, `vault.get`, `vault.search`
- `vault.suggest_name`
- `vault.move`
- `db.query`
- `rag.retrieve`
- `events.log`

Order: implement read-only retrieval first. Write actions come later with guardrails.

### MCP tool spine stubs (PGW4 Day 6)
Harmonyk will adopt an MCP-style “tool spine” to keep AI actions auditable, least-privilege, and swappable across providers.

#### Tool contracts (typed; read-only first)
Defined in: `lib/mcp/tools.ts`

Vault:
- `vault.list(folderId?, limit?, cursor?)` → list items
- `vault.get(id)` → item metadata (and later: signed URL / bytes via server)
- `vault.search(query, limit?)` → search results
- `vault.suggest_name(originalName, hint?)` → naming helper (pure function; no writes)
- `vault.move(id, toFolderId)` → write action (behind approvals + dry-run first)

DB:
- `db.query(sql, params?)` → **restricted**. Only allowlisted queries/templates in implementation.

RAG:
- `rag.retrieve(query, topK?)` → retrieve evidence chunks (Vault-only semantic index)

Events / Telemetry:
- `events.log(name, props?)` → append-only event logging (never blocks product flows)

#### Guardrails (requirements)
1) **Least privilege**
   - Tools run server-side; client calls via API routes.
   - Each tool is scoped by actor/workspace and an allowlist of operations.

2) **Approvals + dry-run**
   - Any write tool must support `dryRun` and return a preview of changes.
   - Writes require explicit user approval (UI prompt) before execution.

3) **Audit + receipts**
   - Every tool call logs: tool name, actor, workspace, inputs (redacted), outcome, duration, and a stable requestId.
   - Errors are captured but must not break core UX.

4) **Deterministic defaults**
   - No non-deterministic IDs in server-rendered UI.
   - Avoid hydration mismatch by deferring client-only state to `useEffect`.

5) **Rollback posture**
   - Prefer reversible operations (move vs delete).
   - For destructive actions, require extra confirmation and keep tombstones where possible.

6) **Provider optionality**
   - Tool contracts remain stable even if LLM provider changes.
   - Provider selection is config-driven; no refactors required to swap.

## 7) LLM Provider Optionality
- OpenAI is the default provider.
- Claude and Gemini are optional via config/env; no refactor required to switch.
- Later: job-based routing (cheap vs premium; writing vs coding; vision/graphics).

## 8) Guardrails are mandatory
Required guardrails (esp. 2-way connectors and write tools):
- least-privilege scopes
- allowlists
- approval gates
- dry-run previews
- rate limits
- audit logs
- rollback

## 9) Mobile (Locked)
- PGW4: mobile nav + responsive shell.
- PGW6–PGW8: mobile usable for search/view/share/approve/sign/quick actions.

## 10) Mandatory UI surface separation (no drift)

Harmonyk stays document-first by enforcing page intent:

Page purpose + primary CTA rule:
- Every core page must declare a purpose line + primary CTA and keep it consistent with PRODUCT thread table.

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

## 11) Concrete product feature additions (v1)
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

## 12) High-ROI viral loops (low complexity only)
1) **Free Collaborator Role** (view/comment/suggest only)
2) **Keep a copy in your Vault** (recipient CTA after viewing/signing)
3) **Clone this template for yourself** (share page CTA)

Guardrails:
- Never block view/sign.
- CTAs are non-spammy and clearly separated from the primary action.

Instrumentation events (canonical):
- `invite_collaborator`, `claim_signed_doc`, `clone_template`

---

## 13) RAG + template strategy (impacted by new UI)
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

## 14) PGW1–PGW26 plan alignment (high level)

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

### PGW3 — Operator-grade Maestro
- Action taxonomy + execution previews ("Maestro sidecar")
- Reminder system v1 (modes + guardrails + stop conditions)
- Action-centric RAG scaffolding (Action Context Pack) + template operational metadata

### PGW4–PGW26 summary (updates locked)
- PGW4: Sidebar v2 + mobile nav + Rooms + optionality plumbing
- PGW5: Dashboard widgets + chunk/citation contract
- PGW6: Workbench + Tasks + first `rag.retrieve()`
- PGW7–8: Vault intelligence + template corpus + hybrid hooks
- PGW15–17: connector framework + packs
- PGW19–20: 2-way actions with guardrails + evals/observability

### PGW7–PGW26 — Scale + Depth
- Expand connectors, deepen Workbench/Insights, reliability hardening, A/B refine action ranking,
  richer automation, mature action-centric RAG/evals

---

## 15) Ultimate Post-GA definition
Harmonyk is a **document-first operating system** with Maestro as an operator:
- UI surfaces predictive signals
- offers simple choices
- executes with human-in-loop
- reminds until outcomes happen

Prompts remain available, but secondary.

Canonical detail: `docs/UI/MAESTRO_UX_DOCTRINE.md`
