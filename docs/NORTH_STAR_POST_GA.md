# Harmonyk North Star (Post-GA) — SSOT

## Post-GA UI + Maestro Direction Update
Updated: 2025-12-20  
Scope: Post-GA definition + PGW1–PGW26 alignment + UI/AI philosophy shift

### 1) New Core UX Doctrine (Post-GA)
#### 2026 AI UX Doctrine (Harmonyk + Maestro)
- AI platforms will not be prompt-first. Prompts become a *secondary* input portal.
- The primary UX is **predictive insights + optimized choices + execution + reminders**.
- Maestro operates mainly through UI actions embedded in pages (buttons/chips), not chat.
- The UI is personalised to each user's state, workload, and priorities.

#### 3-Layer Model (official)
1) **Predictive Signals** (widgets surface what changed / what's blocked / what's due / what's risky)
2) **Optimized Choices** (one primary action + 2–3 alternative chips + "Why?")
3) **Execute + Remind** (Maestro prepares → user approves if needed → executes → follows up with reminders until completed)

Rule: **Prompt window stays available, but is never required** for the main workflow.

---

### 2) Concrete Product Feature Additions
#### A) User Progress Narrator (Dashboard + Maestro Quick Starts)
Per-user `UserProgressState` drives:
- Dashboard hero ("Welcome {firstName}… next best step")
- Maestro quick-start chips (state-aware)

States:
- `ONBOARD_CONNECTORS`, `ONBOARD_IMPORT`, `ORGANISE_METADATA`,
  `START_DEAL`, `ENABLE_AUTOMATION`, `MATURE_TODAY_FOCUS`

Each state produces:
- one primary CTA + optional secondary CTA
- 3–5 Maestro quick-start actions/prompts

This is the "no blank dashboard" solution.

#### B) Actionable Widgets Standard
Every widget must support:
1) click → drill-down view (filtered list / detail)
2) action bar appears with primary action + chips
3) Maestro sidecar shows preview + "Why?" + approve/execute

#### C) Reminder Layer (first-class)
Maestro proposes/executes and **reminds**.
- Reminder modes: Off / Manual / Autopilot
- Guardrails: rate limits, stop conditions, mute/pause per doc/counterparty

---

### 3) High-ROI Viral Loops (Low Complexity Only)
1) **Free Collaborator Role** (view/comment/suggest only)
2) **Keep a copy in your Vault** (recipient CTA after viewing/signing)
3) **Clone this template for yourself** (share page CTA)

Guardrails:
- Never block view/sign.
- CTAs are non-spammy + clearly separated from core action.
- Instrument events: `invite_collaborator`, `claim_signed_doc`, `clone_template`.

---

### 4) RAG + Template Strategy (Impacted by new UI)
We are moving from prompt-based Q&A to **action-centric RAG**.
Retrieval must support actions with:
- Evidence (Vault content + citations)
- Constraints (preferences/policy)
- Entity context (docId/envelopeId/shareLinkId/taskId)

Define "Action Context Pack" concept:
- `{goal, entities, evidence, policy, options, reminder_plan}` as canonical input to Maestro, previews, and audit logs.

Indexing aligns to UI:
- Vault semantic index (content)
- metadata index (structured)
- activity/event index (timeline)
- internal template/clause library index (generation choices)

Templates must carry operational metadata:
- required inputs, risk profile, recommended workflow, default reminder cadence,
  optional/required clauses, tone variants.

---

### 5) PGW1–PGW26 Plan Alignment (high-level)
#### PGW1 — Foundation
- Stabilisation + schema correctness + core reliability (auth/share/vault)
- Prepare UI surfaces for actionable widgets (layout slots, drill-down patterns)

#### PGW2 — Guided UX + Viral v1
- Implement User Progress Narrator (Dashboard hero + Maestro quick-start chips)
- Implement viral loops v1 (free collaborators, keep-a-copy, clone-template)
- Standardize widget drill-down + action bar UX

#### PGW3–PGW6 — Operator-grade Maestro
- Action taxonomy + execution previews ("Maestro sidecar")
- Reminder system v1 (modes + guardrails + stop conditions)
- Action-centric RAG scaffolding (Action Context Pack) + template operational metadata

#### PGW7–PGW26 — Scale + Depth
- Expand connectors, deepen Workbench/Insights, reliability hardening, A/B refine action ranking,
  richer automation, mature action-centric RAG/evals.

---

### 6) Ultimate Post-GA Definition
Harmonyk is a **document-first operating system** with Maestro as an operator:
- UI surfaces predictive signals
- offers simple choices
- executes with human-in-loop
- reminds until outcomes happen
Prompts remain available, but secondary.

Canonical detail: `docs/UI/MAESTRO_UX_DOCTRINE.md`
