# Harmonyk — Product Spec (Post-GA Additions)
_Updated: 2025-12-20_

## 1) User Progress Narrator
**Purpose:** No blank dashboards; obvious next step for every user.

### `UserProgressState` (enum)
- `ONBOARD_CONNECTORS`
- `ONBOARD_IMPORT`
- `ORGANISE_METADATA`
- `START_DEAL`
- `ENABLE_AUTOMATION`
- `MATURE_TODAY_FOCUS`

### Contract
- Input: `userId` (and org context)
- Output: `{ state, primaryCta, secondaryCta?, quickStarts[] }`
- Surfaces:
  - `DashboardHero` (title, subline, CTAs)
  - `MaestroQuickStart` (3–5 chips)

### Default CTAs per state (v1)
- `ONBOARD_CONNECTORS`: **Connect Google** → `/integrations`; Secondary: "Import a file to Vault"
- `ONBOARD_IMPORT`: **Import to Vault** → `/vault/import`; Secondary: "Classify your docs"
- `ORGANISE_METADATA`: **Classify & tag** → `/vault` filtered view
- `START_DEAL`: **Draft a contract** → `/builder?tab=contracts`; Secondary: "Create a deck"
- `ENABLE_AUTOMATION`: **Enable Playbooks** → `/playbooks`
- `MATURE_TODAY_FOCUS`: **Open Workbench** → `/workbench`

---

## 2) Actionable Widgets Standard
All first-class widgets must support:
1) **Drill-down** to a filtered list/detail  
2) **Action bar**: one primary action + 2–3 chips  
3) **Maestro sidecar**: preview (data, "Why?"), approve/execute

Design tokens & slots:
- `Widget.Header`, `Widget.Body`, `Widget.Actions`, `Widget.Sidecar`
- Sidecar opens inline on desktop, full-height drawer on mobile

---

## 3) Reminder Layer (first-class)
Mode per entity or playbook: **Off** / **Manual** / **Autopilot**  
Guardrails:
- Rate limits (org/user)
- Stop conditions (e.g., status change, signature recorded)
- Mute/Pause per doc/counterparty

Audit:
- Every reminder attempt is logged with reason, target, outcome.

---

## 4) Viral Loops (Growth)
1) **Free Collaborator Role**
   - Paid workspaces can invite unlimited free collaborators (view/comment/suggest only).
2) **"Keep a copy in your Vault"**
   - After viewing/signing, recipient gets an optional CTA to create a free workspace with the doc copied into their Vault.
3) **"Clone this template for yourself"**
   - Smart Share page offers optional CTA to spin up free workspace with the underlying template.

Guardrails:
- Never block view/sign.
- CTAs are non-spammy + clearly separated from core action.
- Instrument events: `invite_collaborator`, `claim_signed_doc`, `clone_template`.

---

## 5) Template Operational Metadata
Templates include:
- `required_inputs[]`, `risk_profile`, `recommended_workflow`,
- `default_reminder_cadence`, `optional_clauses[]`, `required_clauses[]`,
- `tone_variants[]`

Used by Maestro to pre-configure sidecar actions & reminders.

