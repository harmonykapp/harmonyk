# Harmonyk — Post-GA UI + Maestro Doctrine (SSOT)
Updated: 2025-12-20

Harmonyk is not a chat app. It is a **document-first operating system** with Maestro as an operator:
- the UI surfaces predictive signals
- offers optimized choices
- executes with human-in-loop
- and reminds until outcomes happen

Prompts remain available, but are **secondary**. The main workflow must not require prompting.

---

## 1) 2026 AI UX Doctrine (Harmonyk + Maestro)
- AI platforms will not be prompt-first. Prompts are a secondary input portal.
- The primary UX is: **predictive insights → optimized choices → execution → reminders**
- Maestro operates mainly through UI actions (buttons/chips), not chat.
- The UI is personalized to the user's state, workload, and priorities.

### 3-Layer Model (official)
1) **Predictive Signals** — widgets surface what changed / what's blocked / what's due / what's risky
2) **Optimized Choices** — one primary action + 2–3 alternatives + "Why?"
3) **Execute + Remind** — Maestro prepares → user approves (if needed) → executes → follows up until done

Rule: **Prompt window stays available, but is never required** for the main workflow.

---

## 2) Concrete product additions (must shape UI)

### A) User Progress Narrator (Dashboard + Maestro Quick Starts)
Per-user `UserProgressState` drives:
- Dashboard hero ("Welcome {firstName}… next best step")
- Maestro quick-start chips (state-aware)

States:
- `ONBOARD_CONNECTORS`
- `ONBOARD_IMPORT`
- `ORGANISE_METADATA`
- `START_DEAL`
- `ENABLE_AUTOMATION`
- `MATURE_TODAY_FOCUS`

Each state produces:
- one primary CTA + optional secondary CTA
- 3–5 Maestro quick-start actions/prompts

This is the "no blank dashboard" solution.

### B) Actionable Widgets Standard
Every widget across Dashboard / Workbench / Insights / Playbooks must support:
1) click → drill-down view (filtered list / detail)
2) an action bar with primary action + chips
3) Maestro sidecar shows preview + "Why?" + approve/execute

### C) Reminder Layer (first-class)
Maestro doesn't just propose/execute; it **reminds**.

Reminder modes:
- Off
- Manual (approve each)
- Autopilot (approve once; within limits)

Guardrails:
- rate limits
- stop conditions (e.g. signed / moved stage)
- mute/pause per doc/counterparty

---

## 3) Low-complexity viral loops (high ROI)
1) **Free Collaborator Role**
   - Paid workspaces can invite unlimited free collaborators (view/comment/suggest only).
2) **"Keep a copy in your Vault"**
   - After viewing/signing, recipient can create a free workspace and copy the doc into their Vault.
3) **"Clone this template for yourself"**
   - Smart Share page offers a CTA to spin up a free workspace with the underlying template.

Guardrails:
- Never block view/sign.
- CTAs are non-spammy and clearly separated from core action.
- Instrument events: `invite_collaborator`, `claim_signed_doc`, `clone_template`.

---

## 4) RAG + template strategy (action-centric)
We are moving from prompt Q&A to **action-centric RAG**.

Retrieval must support actions with:
- Evidence (Vault content + citations)
- Constraints (preferences/policy)
- Entity context (docId/envelopeId/shareLinkId/taskId)

Define an "Action Context Pack":
`{goal, entities, evidence, policy, options, reminder_plan}`

Indexing aligns to UI:
- Vault semantic index (content)
- metadata index (structured)
- activity/event index (timeline)
- template/clause library index (generation choices)

Templates must carry operational metadata:
- required inputs, risk profile, recommended workflow
- default reminder cadence
- optional/required clauses
- tone variants

