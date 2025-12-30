# Harmonyk — AI Architecture (Maestro, Action-centric RAG)
_Updated: 2025-12-20_

## Principle
Move from prompt-first to **action-centric** AI: Maestro prepares actions with evidence, explains **why**, executes with approval, and **reminds** until outcomes happen.

## Action Context Pack
Canonical input to Maestro sidecar + audit:
```ts
type ActionContextPack = {
  goal: string
  entities: { docId?: string; envelopeId?: string; shareLinkId?: string; taskId?: string; dealId?: string }
  evidence: Array<{ source: 'vault'|'external'|'activity'|'template'; id: string; title?: string; snippet?: string; citation?: string }>
  policy: { prefs: Record<string,string|number|boolean>; constraints?: string[] }
  options: Array<{ id: string; label: string; estEffort?: string; risk?: 'low'|'med'|'high' }>
  reminder_plan?: { mode: 'off'|'manual'|'autopilot'; cadence?: string; stopConditions?: string[] }
}
```

## Retrieval & Indexing
- **Vault semantic index** (content)  
- **Metadata index** (structured attributes)  
- **Activity/event index** (timeline)  
- **Template/clause library index** (generation choices)

## Sidecar Flow
1. Predictive widget selects a goal → builds Action Context Pack  
2. Maestro assembles evidence + policy, proposes **one primary** + 2–3 alternatives  
3. User sees **"Why?"** + preview, approves → execution  
4. Reminder plan activates if needed; audit trail recorded

## Guardrails
- Hard limits on cost/latency per org/user
- Clear provenance chips for every snippet
- Vault-first semantics; external docs only when explicitly imported or clearly marked

## Template Operational Metadata
Templates must carry operational metadata:
- `required_inputs[]` — what fields/clauses must be provided
- `risk_profile` — conservative/balanced/aggressive
- `recommended_workflow` — suggested steps and approvals
- `default_reminder_cadence` — when to remind (e.g., "3 days before renewal")
- `optional_clauses[]` — clauses that can be added
- `required_clauses[]` — clauses that must be included
- `tone_variants[]` — available tone options (formal/friendly/neutral)

Used by Maestro to:
- Pre-configure sidecar actions & reminders
- Suggest appropriate templates based on context
- Generate Action Context Packs with proper defaults

## Evaluation
- Golden Q&A/action sets per domain (Contracts/Decks/Accounts)
- Regression checks on ranking & snippet accuracy

