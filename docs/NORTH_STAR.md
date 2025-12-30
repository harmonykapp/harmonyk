# Harmonyk North Star (SSOT)

## Post-GA UI + Maestro doctrine (SSOT)
Harmonyk is not a chat app. It is a **document-first operating system** with **Maestro** as an operator.
Prompts remain available, but **secondary**.

### 2026 AI UX Doctrine (Harmonyk + Maestro)
- AI platforms will not be prompt-first. Prompts become a *secondary* input portal.
- The primary UX is **predictive insights + optimized choices + execution + reminders**.
- Maestro operates mainly through **UI actions embedded in pages** (buttons/chips), not chat.
- The UI is personalised to each user's state, workload, and priorities.

### 3-Layer Model (official)
1) **Predictive Signals** (widgets surface what changed / what's blocked / what's due / what's risky)
2) **Optimized Choices** (one primary action + 2–3 alternative chips + "Why?")
3) **Execute + Remind** (Maestro prepares → user approves if needed → executes → follows up with reminders until completed)

Rule: **Prompt window stays available, but is never required** for the main workflow.

### Product UI standard: Actionable Widgets
Every dashboard/workbench/insights widget must support:
1) click → drill-down view (filtered list / detail)
2) action bar appears with primary action + 2–3 chips
3) Maestro "sidecar" can show preview + "Why?" + approve/execute

### Reminder Layer (first-class)
Maestro doesn't just propose/execute; it **reminds until outcomes happen**.
- Reminder modes: Off / Manual (approve each) / Autopilot (approve once; within limits)
- Guardrails: rate limits, stop conditions (signed/moved stage), mute/pause per doc/counterparty

### Canonical reference docs
- See: `docs/UI/MAESTRO_UX_DOCTRINE.md` (full spec + context pack + PGW alignment)

---

## Core Product Additions (Post-GA)

### A) User Progress Narrator (Dashboard + Maestro Quick Starts)
State machine `UserProgressState` drives:
- **Dashboard hero** ("Welcome {firstName}… next best step")
- **Maestro quick-start chips** (3–5 context-aware actions)

States:
`ONBOARD_CONNECTORS`, `ONBOARD_IMPORT`, `ORGANISE_METADATA`, `START_DEAL`, `ENABLE_AUTOMATION`, `MATURE_TODAY_FOCUS`

Each state produces: one primary CTA, optional secondary CTA, and the quick-start actions.

### B) Actionable Widgets Standard
Every key widget (Dashboard / Workbench / Insights / Playbooks) must support:
1. Click → **drill-down** (filtered list/detail)  
2. **Action bar** with a primary action + chips  
3. **Maestro sidecar** preview with **"Why?"** + Approve/Execute

### C) First-class Reminder Layer
Maestro not only proposes/executes; it **reminds**.
- Modes: Off / Manual (approve each) / Autopilot (approve once; within limits)
- Guardrails: rate limits, stop conditions (e.g., signed/moved stage), mute/pause per doc/counterparty

---

## Scope (GA baseline → Post-GA)
- GA delivered: Contracts, Decks, Accounts, Vault, Share, Insights, Playbooks foundations; connectors (Google) with metadata-first ingestion; basic telemetry; feature flags.
- Post-GA additions:
  - User Progress Narrator + actionable widgets + reminder layer
  - Action-centric RAG (Action Context Pack) + Maestro sidecar previews
  - Viral loops (Free Collaborator, Keep a copy, Clone template)
  - External connectors beyond Google (Dropbox, OneDrive, Slack, etc.)
  - Billing / plan enforcement

---

## Growth Loops (Low-friction, non-spam)
1) **Free Collaborator role** — view/comment/suggest only; upsell to create their own workspace.  
2) **Keep a copy in your Vault** — after viewing/signing, optional CTA to create a free workspace with the doc copied.  
3) **Clone this template for yourself** — Smart Share page CTA to spin up a workspace pre-loaded with the template.  
Events: `invite_collaborator`, `claim_signed_doc`, `clone_template`.

Guardrails: never block view/sign; CTAs are optional and clearly separated.

---

## RAG + Templates Strategy (Action-centric)
Move from prompt Q&A to **action-centric RAG**:
- Retrieval must support **actions** with: **Evidence** (Vault + citations), **Constraints** (prefs/policy), **Entity context** (docId/envelopeId/shareLinkId/taskId).
- Define **Action Context Pack**:
  ```ts
  { goal, entities, evidence, policy, options, reminder_plan }
  ```
  Used by Maestro sidecar previews and audit logs.
- Indexes aligned to UI: Vault semantic index (content), metadata index (structured), activity/event index (timeline), template/clause library index (generation choices).
- **Templates carry operational metadata**: required inputs, risk profile, recommended workflow, default reminder cadence, optional/required clauses, tone variants.

---

## PGW Alignment (26-week Post-GA plan snapshot)
- **PGW1**: Stabilisation + schema correctness + core reliability (auth/share/vault); prepare UI surfaces for actionable widgets (layout slots, drill-down patterns).  
- **PGW2**: Implement User Progress Narrator (Dashboard hero + Maestro quick-start chips); implement viral loops v1 (free collaborators, keep-a-copy, clone-template); standardize widget drill-down + action bar UX.  
- **PGW3–6**: Operator-grade Maestro (action taxonomy, sidecar previews, Reminder v1, Action Context Pack scaffolding) + template operational metadata.  
- **PGW7–26**: Scale connectors, deepen Workbench/Insights, reliability hardening, A/B refine action ranking, richer automation, mature action-centric RAG/evals.

---

## Non-Negotiable Truths

1. **Google-first at GA.**  
   Only **Google Drive** and **Gmail** are live at GA. Others are visible as "Coming Soon."

2. **Metadata-first ingestion.**  
   Fetch full content only on **Preview / Save to Vault / Send for Signature**. Everything else is metadata + links.

3. **Vault-only semantics.**  
   Embeddings + semantic search apply to **Vaulted** docs; external items are keyword-indexed references until explicitly copied.

4. **Human-in-the-loop.**  
   Maestro proposes; users approve. No silent edits, permission changes, or automations.

5. **Explainability + Undo.**  
   Every AI/automation shows "Why this?" and supports undo/rollback.

6. **Builder-first GA.**  
   GA is defined by **Contracts, Decks, and Accounts Builders** shipping usable flows for founders; everything else (Connectors, Insights, Playbooks, Tasks) exists to support those.

7. **Legal-first depth.**  
   Contracts Builder (legal) is the **hero** at GA; it gets the deepest UX and library investment.

8. **Guided, not generic.**  
   A **User Progress Narrator** and Maestro quick-start prompts guide users from first login through mature usage. No blank states.

9. **Virality rides on real work.**  
   Growth comes from contracts, templates, collaborators, and share/sign flows — not from gimmicky referral codes or forced sign-ups.

10. **Scope freeze to GA.**  
    No new GA modules, flows, connectors, or vendors mid-build. Post-GA work lives in the PG-W1–W26 plan.

---

## Builders at GA

### Contracts Builder — GA

- Status: **GA feature**. This is the primary Builder experience at launch.

- Scope: canonical templates across Operational & HR, Commercial & Dealmaking, and Corporate & Finance, plus clause library and AI-assisted first drafts.

- Storage: all generated drafts and saved versions live in **Vault**, with semantic indexing on vaulted content only.

- Actions: generate → edit → save to Vault → send for signature via Documenso.

#### Library & Types

- **≈45 canonical legal templates**, drawn from internal library (no extra scraping).

- All templates live under **Legal Contracts**, with 3 subfolders:

  1. **Operational & HR** — NDAs (mutual / one-way), employment agreements, offer letters, confidentiality, termination/severance, warnings/performance, intern agreements, reference letters, contractor/consulting, MSAs/SOWs, SaaS ops (SaaS, DPA basics, Privacy Policy).

  2. **Corporate & Finance** — founders/shareholders agreements, share/asset purchase, loan/lease/financing, JV/partnership/structure.

  3. **Commercial & Dealmaking** — MOUs/LOIs, reseller/distribution/franchise/licensing/supply/manufacturing/referral, commercial MSAs, NCND, etc.

- **Single canonical template per contract type** for ease-of-use; alternates tracked via `canonical_type`, `is_canonical`, `alt_group`. Maestro and ClauseGraph can still see/use alternates for RAG and AI suggestions.

- Templates can be **searchable/tagged across multiple categories** (e.g., NDA shown under Operational & HR and Commercial).

#### Clause Library & ClauseGraph v1

- **≈20 clause docs** across:

  - **Core Business** (definitions, parties, recitals; term/termination; governing law; notices; entire agreement; amendments; counterparts/e-signatures)

  - **Risk & Liability** (confidentiality; IP ownership; reps & warranties; indemnity; limitation of liability; force majeure; dispute resolution; assignment; non-compete/non-solicit)

  - **Commercial & Operational** (SOW; payment terms; SLAs; change control; acceptance; return of materials/data; compliance; publicity; survival)

- **ClauseGraph v1** (structured side panel):

  - Grouped list with search/filters; add/remove/toggle required; alternate variants via `alt_group`.
  - Version meta stores selected clause IDs → clause-level diffs.

#### Builder UX

- **Single Builder page** with tabs: **Contracts / Decks / Accounts**.

- **Contracts** header with **Start from Template** and **Start with AI Brief**:

  - 3-level tree (Category → Type → Template).
  - Hero shortcuts: Start NDA, MSA, SOW, Contractor, Employment, SaaS.
  - Template cards show category, description, risk level, jurisdiction baseline, "Recommended".

  - **AI Brief**: user writes a plain-English brief; Maestro proposes template + clauses; user can override and edit via ClauseGraph.

#### Status Pipeline

`draft` → `in_review` → `approved` → `signed` → `active` → `expired` (+ Activity events).

#### Compare / Diff (Contracts)

- Clause-aware diff (W16): added/removed/changed clauses; text diff inside changed clauses; fallback to text diff if no clause IDs.
- Exposed in Builder ("Compare to prior version") and Vault ("View diff").

#### Maestro for Contracts

- **Explain clause** (with "Why this?" references).
- **Suggest standard terms** with risk commentary.
- **Compare drafts** (risk deltas), grounded in Vault-only semantics.

---

### Decks Builder — v1

- Status: **GA feature (v1)** focused on founder-facing decks.

- Scope: Fundraising and Investor Update decks with configurable outlines, company/round metadata, and Maestro-generated section content.

- Storage: saved as `kind = "deck"` documents in Vault, with metadata block (`MONO_DECK_METADATA`) at the top of the content.

- Actions: outline editing, deck generation, Vault save, and HTML export (for now) for copy/paste into slides.

- RAG (post-GA): pulls latest metrics (MRR, runway, etc.) from Vaulted CSVs/Docs; key narrative points from Vaulted docs (behind feature flag until PG RAG work is complete).

---

### Accounts Builder — v1 (Financial Inbox, Week 14)

- Status: **Developer preview / read-only shell** at GA. No write actions or exports yet.

- Scope: normalized view over the `financial_documents` table populated from connectors and dev classifiers:

  - SaaS invoices, bank statements, and accountant packs.
  - Core fields: `vendor_name`, `provider`, `doc_type`, `report_type`, `currency`, `total_amount`, `period_start`, `period_end`, `created_at`.
  - All rows are scoped by `org_id` and `source` (e.g. `google_drive`).

- Behavior in UI:

  - Appears as the **Accounts** tab inside Builder alongside Contracts and Decks.
  - Loads once when the user switches into Accounts; shows loading, empty, or list states without re-fetch flicker.
  - Explicitly labeled as read-only v1; future weeks wire this into "Monthly SaaS Expenses Pack" and "Investor Accounts Snapshot".

- Future (post-GA / Week 15+):

  - Attach Accounts Builder packs that pull from this inbox, generate summaries, and output investor-ready views.
  - Keep ingestion and classification logic in a single place.

---

## Navigation (GA)

**Top-level:**  

Dashboard · Workbench · Builder · Vault · Playbooks · Share · Integrations · Insights · Tasks · Settings

**Builder tabs:**  

**Contracts · Decks · Accounts**

- **Contracts** tab: full 3-level legal tree + ClauseGraph.
- **Decks** tab: Fundraising + Investor Update flows.
- **Accounts** tab: SaaS Pack + Investor Snapshot flows (dev preview).

---

## Guided Experience — User Progress Narrator & Maestro

### User Progress State Engine

We define a per-user `UserProgressState`:

- `ONBOARD_CONNECTORS`  
- `ONBOARD_IMPORT`  
- `ORGANISE_METADATA`  
- `START_DEAL`  
- `ENABLE_AUTOMATION`  
- `MATURE_TODAY_FOCUS`

Derived from:

- Connectors connected (Drive/Gmail),
- Docs imported into Vault,
- Metadata coverage (doc type, owner, account, status),
- Active deals/docs in pipeline,
- Playbooks enabled and running.

### Dashboard Hero (“Narrator” Strip)

At the top of Dashboard, a dynamic hero shows:

- Welcome line: `Welcome {firstName} – …`
- One-line context.
- One primary CTA, optional secondary CTA.

Examples:

- `ONBOARD_CONNECTORS`  
  - “Welcome Adam – let’s connect your document apps.”  
  - CTA: `Connect Google Drive`, secondary: `Connect Gmail`.

- `ONBOARD_IMPORT`  
  - “Welcome back – time to import your key documents.”  
  - CTA: `Import documents`, secondary: `Review connector settings`.

- `ORGANISE_METADATA`  
  - “Nice, your documents are in – let’s classify and organize them.”  
  - CTA: `Run auto-classification`.

- `START_DEAL`  
  - “You’re set up. Let’s create your first live deal or contract.”  
  - CTA: `Create a new contract`, secondary: `Generate a pitch deck`.

- `ENABLE_AUTOMATION`  
  - “You’ve got live deals. Let’s automate follow-ups.”  
  - CTA: `Enable a playbook`, secondary: `See Workbench`.

- `MATURE_TODAY_FOCUS`  
  - “Welcome back – here’s what needs you today.”  
  - Subline: `X docs waiting on your review · Y signatures overdue · Z at-risk deals.`  
  - CTA: `Open Workbench`, secondary: `View Insights`.

The hero is **always** wired to real flows: Integrations, Vault import, classification, Builder, Playbooks, Workbench, Insights.

### Maestro Quick-Start Prompts

Maestro uses the **same state** to show 3–5 quick-start suggestions:

- Early:
  - “Connect Google Drive and pull in my contracts.”
  - “Import signed PDFs from Gmail for the last 12 months.”

- Mid:
  - “Classify my latest imports as NDAs, MSAs, SOWs, or general docs.”
  - “Group docs by customer account and tag deal status.”

- Mature:
  - “What should I do today?”
  - “Which documents are blocking signatures this week?”
  - “Show me my highest-value at-risk deals and why.”

**Rule:** Narrator and Maestro must agree on the “next step” for a given user.

---

## GA Deliverables (Builder-first, with Analytics)

### Workbench

**Objective:** “My company today” — a control room for deals and documents.

- Shows:
  - Active deals/docs by lifecycle stage.
  - Pending reviews and signatures.
  - At-risk deals and SLA bands.

- Views:
  - Main content supports **List / Kanban / Timeline** over deals/docs.
  - Kanban columns mirror the core pipeline: Draft → In Review → Contract Out → Waiting on Signature → Signed/Closed.

- Visual widgets (see `docs/UI_ANALYTICS_PAGES_SPEC.md` for detail):
  - Today Focus Wheel.
  - SLA & deadlines bar.
  - Signature & review swimlane.
  - Maestro Suggestions queue.

- Maestro is page-aware:
  - “What should I focus on today?”
  - “What’s blocking signatures?”
  - “Where are my at-risk deals?”

---

### Vault

**Objective:** Source of truth for Builder outputs + explicit Drive/Gmail imports.

- Holds:
  - Builder outputs (Contracts, Decks, Accounts).
  - Imported Google Drive/Gmail docs selected by user.
  - Versions and diffs for contracts.

- Metadata:
  - `doc_type`, parties, dates, amounts, status, account, tags.

- Views:
  - File/folder explorer.
  - Filterable table.
  - Hygiene tiles (duplicates, stale docs, missing metadata).
  - Type & source donuts.

- Role in RAG:
  - Primary **semantic index** when RAG is enabled post-GA.
  - GA: RAG scaffolding is in place but behind feature flags.

---

### Tasks (Internal at GA)

- Internal tasks only (no external sync at GA).
- Task sources:
  - Manual creation.
  - Playbooks.
- Fields:
  - `title`, `status`, `due_at`, linked doc/event/deal tag.
- Views:
  - Task Hub (`/tasks`).
  - Calendar-style overview & My Week timeline.
  - List/Kanban mode over tasks.

---

### Playbooks v1 (Built-ins)

- Deterministic rules; read Vault + Activity + limited metadata; create/update tasks; send basic emails.

- Built-ins:
  1. Contract Signed → Renewal Task  
  2. Fundraising Deck → Outreach Task  
  3. Investor Snapshot → Update Task  
  4. Runway < X months → Alert Task  

- GA:
  - simulate/dry-run,
  - confirm before enabling,
  - basic error visibility in UI.

---

### Share & Sign

- Secure share links (auth-aware or token), password/expiry/watermark.
- Documenso send; clear states; envelope IDs in DB.
- Follow-ups via Playbooks/Tasks.

- Smart Share page:
  - Simple, frictionless viewing/signing.
  - Below the fold, subtle viral CTAs (see Growth & Virality).

---

### Integrations (GA)

- **Google Drive** (scoped folders) and **Gmail** (attachments/important links) → Vault → RAG semantics.
- Others are "Coming Soon" (post-GA and PG plan).

- Integrations page:
  - Connector status tiles.
  - Sync activity timeline.
  - Basic logs view.

---

### Insights (GA v2)

- Activity timeline (“what just happened?”).
- Lean dashboards for:
  - Sent / viewed / signed.
  - Tasks due/completed.
  - Decks created/sent.
  - Accounts pack runs.

- Tied tightly to action:
  - Every chart drills into Workbench, Vault, or Playbooks.
- See `docs/UI_ANALYTICS_PAGES_SPEC.md` for widget-level detail.

- CSV export and weekly summary email are post-GA, subject to infra.

---

### AI & Vendors

- **OpenAI** for LLM.
- Google APIs for Slides/PDF exports.

- Maestro Memory:
  - Per-org tone, risk tolerance, jurisdiction/locale preferences.
  - No cross-tenant training on customer docs.

- Template usage telemetry recorded (UI exposed post-GA).

---

### RAG

- Embeddings over Vaulted docs + explicitly imported Google docs.
- Grounds contract advice, deck narratives, and financial checks.
- Status:
  - Week 19–20 implement **Maestro RAG v1/v2** as post-GA feature, behind flags.
  - GA uses metadata + structured prompts; RAG is not exposed by default to tenants.

---

### Import Policy & Storage

- Default YTD import horizon (presets 12/36m/custom).
- Copy-to-Vault is explicit and shows GB impact; heavy media is reference-only.
- Storage metered by Vault GB; per-file caps, with clear UI.

---

## Growth & Virality (High-ROI, Low-Complexity)

Harmonyk grows through documents and relationships, not gimmicks.

### 1. Free Collaborator Roles

- Paid workspaces can invite **unlimited free collaborators** with constrained permissions:
  - Can view, comment, and suggest edits on docs.
  - Cannot manage billing, org settings, or Playbooks.
- Collaborators see a subtle upsell:
  - “Start your own workspace” when they begin using Harmonyk to manage their own deals/docs.

This creates **internal virality** inside teams and across their advisors and lawyers.

### 2. “Keep a Copy in Your Vault” for Signers

- After a recipient views/signs a Harmonyk link, the Smart Share page offers:

  > “Keep a copy of this contract in your own free Vault.”

- Accepting:
  - Spins up a Free workspace with that doc in their Vault.
  - Establishes a “Partner org” link back to the original sender (for future insights and routing).

This is the primary **counterparty → new workspace** loop.

### 3. Template “Clone for Yourself”

- On Smart Share pages for templated docs (and signed docs originating from templates):

  > “Use this template for your own company.”

- Clicking:
  - Creates a new Free workspace pre-loaded with that template.
  - Anchors Harmonyk as the place where “good templates live” across the ecosystem.

### Guardrails

- Viewing and signing **never** require account creation.
- Viral CTAs are non-blocking, clearly optional, and kept visually separate from the core action.
- All viral interactions are instrumented:
  - `invite_collaborator`
  - `claim_signed_doc`
  - `clone_template`
- We track activation and conversion from these surfaces for future tuning.

---

## Pricing (Initial Hypothesis — unchanged for now)

We keep the existing four-tier ladder; we will tune **limits**, not labels, as we approach broader GA:

- **Free (1 user)**  
  - For individual founders testing a few deals.
  - Limited connectors, docs, links, and AI analyses.
  - No deep automation, limited Insights.

- **Starter (~$30/user)**  
  - For solo/very small teams starting to run deals seriously through Harmonyk.
  - More generous AI usage.
  - Some Playbooks.
  - Basic Insights.

- **Pro (~$60/user)**  
  - For active teams with multiple deals and automations.
  - Full Workbench, Playbooks, Insights.
  - Higher AI + automation limits.

- **Team (~$200/3 users + $50/additional)**  
  - For small firms/studios with multiple clients.
  - Everything in Pro plus higher limits and light admin controls.

Plan differentiation should primarily be:

- **Volume:** docs/tasks/storage/playbook runs/signatures.
- **Depth:** Builders/Playbooks features, Insights depth, and collaboration features.

---

## KPIs (Launch +90 Days)

- Time-to-first **Save to Vault** and **Send for Signature**.
- % workspaces that:
  - Connect Google **and**
  - Enable ≥1 Playbook in 7 days.
- WAU workspaces on Workbench and Builder.
- Task follow-through and SLA adherence (Docs signed before deadlines).
- Contract Signed → Renewal automation adoption.
- Viral loop performance:
  - Collaborator → workspace conversion.
  - Signer → “Keep a copy” conversion.
  - Template clone → active workspace.
- Plan upgrades at ≥80% of Free/Starter caps.

---

## Delivery Plan (W1–W20, GA Build)

**Done:**  

W1–W6 base, scopes, Vault v1, Workbench shell, Contracts spine, Documenso POC, Share v1, Activity/Insights v0, Maestro v1, Beta hardening.  

W7 Share & Signatures v1; W8 Activity & Insights v1; W9 Connectors v1 (Drive/Gmail); W10 ActivityLog tests & stability; W11 Activity & Insights v1.5.  

W12–W13 **Contracts Builder GA (Part 1)** — final contract metadata/enums, canonical templates, Contracts tab, simple clause picker.  

W14 **Accounts Builder v1 (Scanner + Reports)** — financial_documents + classifier + reports scaffold + Save to Vault.  

W15 **Accounts Packs v1 + Insights wiring** — SaaS Expenses & Investor Snapshot packs, pack API, pack cards, events into Activity/Insights.  

W16 **Insights v2 + Accounts Packs surfaces** — accounts_pack_runs, Insights surfaces, highlights grid, range selector, telemetry/guardrails.  

W17 **Playbooks GA (Contracts/Decks/Accounts)** — normalized playbooks s
