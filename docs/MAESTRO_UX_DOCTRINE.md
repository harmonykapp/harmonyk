# Maestro UX Doctrine (Post-GA)
Updated: 2025-12-20

Harmonyk is not a chat app. It is a **document-first operating system** with Maestro as an operator.

## 1) Core Doctrine
- Prompts are secondary. The main workflow must not require the prompt window.
- The primary UX is:
  1) **Predictive Signals** (what changed / what's blocked / what's due / what's risky)
  2) **Optimized Choices** (one primary action + 2–3 alternatives + "Why?")
  3) **Execute + Remind** (prepare → approve if needed → execute → follow-up reminders)

## 2) User Progress Narrator (no blank dashboard)
Per-user `UserProgressState` drives:
- Dashboard hero: "Welcome {firstName}… next best step"
- Maestro quick-start chips: state-aware actions

States (initial):
- ONBOARD_CONNECTORS
- ONBOARD_IMPORT
- ORGANISE_METADATA
- START_DEAL
- ENABLE_AUTOMATION
- MATURE_TODAY_FOCUS

Each state outputs:
- 1 primary CTA + optional secondary CTA
- 3–5 quick-start actions

## 3) Actionable Widgets Standard
Every widget in Dashboard / Workbench / Insights / Playbooks must support:
1) click → drill-down view (filtered list / detail)
2) action bar with primary action + chips
3) Maestro sidecar showing preview + "Why?" + approve/execute

## 4) Reminder Layer (first-class)
Maestro doesn't just propose/execute; it **reminds** until outcomes happen.

Reminder modes:
- Off
- Manual (approve each reminder)
- Autopilot (approve once; within limits)

Guardrails:
- rate limits
- stop conditions (signed / moved stage / completed)
- mute/pause per doc/counterparty

## 5) Viral loops (low complexity only)
1) Free Collaborator Role (view/comment/suggest only)
2) "Keep a copy in your Vault" after viewing/signing
3) "Clone this template for yourself" from the Smart Share page

Guardrails:
- never block view/sign
- CTAs separated from core action (non-spammy)
- instrument events: invite_collaborator, claim_signed_doc, clone_template

## 6) RAG + Template Strategy impact
Shift from prompt Q&A to **action-centric RAG**.

Define "Action Context Pack":
`{goal, entities, evidence, policy, options, reminder_plan}`

Indexing aligned to UI:
- Vault semantic index (content)
- metadata index (structured)
- activity/event index (timeline)
- template/clause library index (generation choices)

Templates must carry operational metadata:
- required inputs
- risk profile
- recommended workflow
- default reminder cadence
- optional/required clauses
- tone variants

