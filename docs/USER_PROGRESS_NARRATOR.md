# User Progress Narrator — SSOT

This file defines the **User Progress Narrator** states and outputs used to prevent a "blank dashboard"
and to drive the **Maestro quick-start chips**.

The implementation source of truth is:
- `lib/user-progress.ts`

## Purpose
- Always show a next-best step (even for brand-new workspaces)
- Keep the primary UX **predictive → choices → execute + remind**
- Prompts stay available, but are never required for the main workflow

## Inputs
`UserProgressSignals` (current minimal set):
- `hasConnectedAnyConnector`
- `hasImportedAnyDocs`
- `hasAnyDocsInVault`
- `hasCompletedMetadataBasics`
- `hasCreatedAnyDealOrWorkflow`
- `hasRunAnyPlaybook`
- `hasAnyTasks`

## Output contract
`UserProgressNarration` produces:
- `state`
- `title`
- `description`
- `primaryCta` (+ optional `secondaryCta`)
- `quickStarts` (3–5 items; can be `link` or `maestro_intent`)

## States (ordered)
These are evaluated in order; the first match wins:

### 1) ONBOARD_CONNECTORS
When: no connector is connected.
Goal: connect at least one connector (Drive is the default).

### 2) ONBOARD_IMPORT
When: connector connected, but no docs in Vault.
Goal: import documents or create the first document via Builder.

### 3) ORGANISE_METADATA
When: docs exist, but metadata basics not complete.
Goal: add minimal metadata so search/filters/insights become useful.

### 4) START_DEAL
When: metadata basics exist, but no workflow/deal action started.
Goal: move one important doc/deal forward.

### 5) ENABLE_AUTOMATION
When: workflow started, but no automation/playbook runs.
Goal: run one playbook.

### 6) MATURE_TODAY_FOCUS
When: baseline maturity reached.
Goal: focus on today's highest-impact actions; reminders become first-class.

## Notes
- `maestro_intent` items are allowed before full Maestro wiring exists.
  UI can route these to a safe placeholder (e.g. dashboard with intent querystring),
  then later wire to Maestro sidecar execution.
- This system is deliberately conservative. We can "promote" signals as we add analytics:
  tasks created, signatures pending, share links created, playbook runs, etc.
