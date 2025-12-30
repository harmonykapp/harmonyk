# Maestro UX Doctrine (SSOT)

Updated: 2025-12-20

## What Harmonyk is
Harmonyk is not a chat app. It is a **document-first operating system**.
Maestro is an operator embedded into the UI.

Rule: prompt input exists, but is never required for the main workflow.

---

## 2026 AI UX Doctrine
- AI platforms will not be prompt-first. Prompts become a *secondary* input portal.
- The primary UX is **predictive insights + optimized choices + execution + reminders**.
- Maestro operates mainly through UI actions embedded in pages (buttons/chips), not chat.
- The UI is personalised to each user's state, workload, and priorities.

---

## 3-Layer Model (official)
1) **Predictive Signals**
   - Widgets surface what changed / what's blocked / what's due / what's risky
2) **Optimized Choices**
   - One primary action + 2–3 alternative chips + "Why?"
3) **Execute + Remind**
   - Maestro prepares → user approves if needed → executes → follows up with reminders until completed

---

## User Progress Narrator (no blank dashboard)
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
- One primary CTA (+ optional secondary CTA)
- 3–5 quick-start actions/prompts (chips)

---

## Actionable Widgets Standard
Every widget supports:
1) click → drill-down view (filtered list / detail)
2) action bar appears with primary action + 2–3 chips
3) Maestro sidecar shows preview + "Why?" + approve/execute

Non-goals:
- No giant "ask me anything" box as the primary path.
- No dead widgets that don't drill down or act.

---

## Reminder Layer (first-class)
Maestro doesn't just propose/execute; it **reminds** until outcomes happen.

Reminder modes:
- Off
- Manual (approve each reminder)
- Autopilot (approve once; runs within limits)

Guardrails:
- Rate limits
- Stop conditions (signed, stage moved, doc archived, etc.)
- Mute/pause per doc/counterparty

---

## Viral loops (high-ROI, low complexity)
1) Free Collaborator role (view/comment/suggest only)
2) Keep-a-copy in recipient Vault (CTA after view/sign)
3) Clone-template for recipient (CTA on Smart Share page)

Guardrails:
- Never block view/sign.
- CTAs must be optional and separated from core actions.
- Instrument: `invite_collaborator`, `claim_signed_doc`, `clone_template`.

---

## Action-centric RAG + Template Strategy
We move from prompt-first Q&A to **action-centric RAG**.

Retrieval must support actions with:
- Evidence (Vault content + citations)
- Constraints (preferences/policy)
- Entity context (docId/envelopeId/shareLinkId/taskId)

### Action Context Pack (canonical)
`{ goal, entities, evidence, policy, options, reminder_plan }`

This is the canonical input to:
- Maestro previews
- "Why?" explanations
- execution approvals
- audit logs

Indexing aligned to UI:
- Vault semantic index (content)
- metadata index (structured)
- activity/event index (timeline)
- internal template/clause library index (generation choices)

Templates must carry operational metadata:
- required inputs
- risk profile
- recommended workflow
- default reminder cadence
- optional/required clauses
- tone variants

---

## PGW alignment (high-level)
PGW1: stability + prepare surfaces (layout slots, drill-down patterns)
PGW2: narrator + quick-start chips + viral v1 + widget standard
PGW3–PGW6: sidecar previews + reminders v1 + action-centric RAG scaffolding
PGW7–PGW26: scale connectors, deepen workbench/insights, harden reliability, mature RAG/evals

