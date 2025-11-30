# NORTH_STAR.md — Monolyth (v2025-11-28 rev B, GA scope frozen — 20 weeks)

## Tagline

**Monolyth — All your docs. One brain.**

## Positioning

Early-stage tech founders (0–20 employees) on **Google Workspace** drowning in scattered contracts, decks, and investor-facing financials.

## Product Promise

Draft the critical documents, keep them organized, and drive the follow-through — with one AI operator (**Mono**) that knows your files and preferences.

---

## Non-Negotiable Truths

1. **Google-first at GA.** Only **Google Drive** and **Gmail** live at GA. Others are visible as "Coming Soon."

2. **Metadata-first ingestion.** Fetch full content only on **Preview / Save to Vault / Send for Signature**.

3. **Vault-only semantics.** Embeddings + semantic search apply to **Vaulted** docs; external items are keyword-indexed refs.

4. **Human-in-the-loop.** Mono proposes; users approve. No silent edits, permission changes, or automations.

5. **Explainability + Undo.** Every AI/automation shows "Why this?" and supports undo/rollback.

## Builders at GA

### Contracts Builder — GA

- Status: **GA feature**. This is the primary Builder experience at launch.

- Scope: canonical templates across Operational & HR, Commercial & Dealmaking, and Corporate & Finance, plus clause library and AI-assisted first drafts.

- Storage: all generated drafts and saved versions live in **Vault**, with semantic indexing on vaulted content only.

- Actions: generate → edit → save to Vault → send for signature via Documenso.

### Decks Builder — v1

- Status: **GA feature (v1)** focused on founder-facing decks.

- Scope: Fundraising and Investor Update decks with configurable outlines, company/round metadata, and Mono-generated section content.

- Storage: saved as `kind = "deck"` documents in Vault, with metadata block (`MONO_DECK_METADATA`) at the top of the content.

- Actions: outline editing, deck generation, Vault save, and HTML export (for now) for copy/paste into slides.

### Accounts Builder — v1 (Financial Inbox, Week 14)

- Status: **Developer preview / read-only shell** at GA. No write actions or exports yet.

- Scope: normalized view over the `financial_documents` table populated from connectors and dev classifiers:

  - SaaS invoices, bank statements, and accountant packs.

  - Core fields: `vendor_name`, `provider`, `doc_type`, `report_type`, `currency`, `total_amount`, `period_start`, `period_end`, `created_at`.

  - All rows are scoped by `org_id` and `source` (e.g. `google_drive`).

- Behavior in UI:

  - Appears as the **Accounts** tab inside Builder alongside Contracts and Decks.

  - Loads once when the user switches into Accounts; shows loading, empty, or list states without re-fetch flicker.

  - Explicitly labelled as read-only v1; future weeks wire this into "Monthly SaaS Expenses Pack" and "Investor Accounts Snapshot".

- Future: Week 15+ attaches Accounts Builder packs that pull from this inbox, generate summaries, and output investor-ready views, while keeping ingestion and classification logic in a single place.

6. **Scope freeze to GA.** No new GA modules, flows, connectors, or vendors mid-build.

7. **Builder-first GA.** GA is defined by **Contracts, Decks, and Accounts Builders** shipping usable flows for founders; everything else (Connectors, Insights, Playbooks, Tasks) exists to support those.

8. **Legal-first depth.** Contracts Builder (legal) is the **hero** at GA; it gets the deepest UX and library investment.

---

## Navigation (GA)

**Top-level:**  

Dashboard · Workbench · Builder · Vault · Playbooks · Share · Integrations · Insights · Settings

**Builder tabs:**  

**Contracts · Decks · Accounts**

- **Contracts** tab: full 3-level legal tree + ClauseGraph.

- **Decks** tab: Fundraising + Investor Update flows.

- **Accounts** tab: SaaS Pack + Investor Snapshot flows.

---

## GA Deliverables (Builder-first)

### Contracts Builder — GA Scope (Hero)

**Objective:** Legal contracts are the flagship "this feels real" experience.

#### Library & Types

- **≈45 canonical legal templates**, drawn from internal library (no extra scraping).

- All templates live under **Legal Contracts**, with 3 subfolders:

  1. **Operational & HR** — NDAs (mutual / one-way), employment agreements, offer letters, confidentiality, termination/severance, warnings/performance, intern agreements, reference letters, contractor/consulting, MSAs/SOWs, SaaS ops (SaaS, DPA basics, Privacy Policy).

  2. **Corporate & Finance** — founders/shareholders agreements, share/asset purchase, loan/lease/financing, JV/partnership/structure.

  3. **Commercial & Dealmaking** — MOUs/LOIs, reseller/distribution/franchise/licensing/supply/manufacturing/referral, commercial MSAs, NCND, etc.

- **Single canonical template per contract type** for ease-of-use; alternates tracked via `canonical_type`, `is_canonical`, `alt_group`. Mono and ClauseGraph can still see/use alternates for RAG and AI suggestions.

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

  - **AI Brief**: user writes a plain-English brief; Mono proposes template + clauses; user can override and edit via ClauseGraph.

#### Status Pipeline

`draft` → `in_review` → `approved` → `signed` → `active` → `expired` (+ Activity events).

#### Compare / Diff (Contracts)

- Clause-aware diff (W16): added/removed/changed clauses; text diff inside changed clauses; fallback to text diff if no clause IDs.

- Exposed in Builder ("Compare to prior version") and Vault ("View diff").

#### Mono for Contracts

- **Explain clause** (with "Why this?" references), **suggest standard terms**, **compare drafts** (risk deltas).

---

### Decks Builder — v1 (B+)

- **Fundraising Deck** and **Investor Update Deck**.

- Outline → Slides/PDF (Google APIs).

- RAG pulls latest metrics (MRR, runway, etc.) from Vaulted CSVs/Docs; key narrative points from Vaulted docs.

- Mono suggests storyline and rewrites; tone via Mono Memory.

- Outputs are Vault docs (`doc_type="deck"`, type, status).

---

### Accounts Builder — v1 (B+, revised)

- **Flows:** SaaS Financial Pack, Investor Snapshot, **Cash Runway Planner**, **KPI Notebook**.

- **Inputs:** CSV uploads + manual fields.

- **Outputs:** charts/tables; **scenario toggles** (best/base/worst); validation checks; one-click "Push to Deck" blocks.

- Mono explains trends and flags anomalies.

- Outputs are Vault docs (`doc_type="accounts"`, status).

---

### Workbench

- Cards: **Recent Activity**, **Open Tasks**, **Active Deals & Rounds**.

- Quick actions: Generate new contract/deck/account; resume drafts; run built-in Playbooks.

- Page-aware Mono side panel ("What should I focus on today?", summaries, explainers).

---

### Vault

- Source of truth for Builder outputs + explicit Drive/Gmail imports.

- Metadata: type/parties/dates/amounts/status/links/deal tags.

- Version history and contract diffs.

- Primary **RAG source**.

---

### Tasks (Internal at GA)

- Internal tasks only (no external sync).

- Created by Playbooks and manually.

- Fields: title, status, due_at, linked doc/event/deal tag.

- Task Hub (`/tasks`); in-app reminders; optional email digest (post-GA if needed).

---

### Playbooks v1 (Built-ins)

- Deterministic rules; read Vault + Activity + limited RAG; create/update tasks; basic emails.

- Built-ins:

  1) Contract Signed → Renewal Task  

  2) Fundraising Deck → Outreach Task  

  3) Investor Snapshot → Update Task  

  4) **Runway < X months → Alert Task**

- GA adds simulate/dry-run, confirm, error visibility (W16).

---

### Share & Sign

- Secure share links (auth-aware or token), password/expiry/watermark.

- Documenso send; clear states; envelope IDs in DB.

- Follow-ups via Playbooks/Tasks.

---

### Integrations (GA)

- **Google Drive** (selected folders) and **Gmail** (attachments/important links) → Vault → RAG.

- Others are "Coming Soon" (post-GA).

---

### AI & Vendors

- **OpenAI** (LLM) and Google APIs (Slides/PDF exports).

- **Mono Memory** (tone/risk/jurisdiction/locale) per org.

- Template usage telemetry recorded (UI post-GA).

---

### RAG

- Embeddings over Vaulted docs + explicitly imported Google docs.

- Grounds contract advice, deck narratives, and financial checks.

---

### Import Policy & Storage

- Default YTD import horizon (presets 12/36m/custom).

- Copy-to-Vault is explicit and shows GB impact; heavy media = reference-only.

- Storage metered by Vault GB; per-file caps.

---

### Insights

- Activity timeline; lean dashboards (sent/viewed/signed; tasks due/completed; decks created/sent).

- CSV export; weekly summary email (time permitting).

---

### Security

- Least-privilege scopes; org-scoped RLS; watermark/redaction; full audit; "Why this?".

- Security pass + incident/runbooks pre-launch.

---

## Pricing (Initial)

- **Free (1 user)** · **Starter (~$30/user)** · **Pro (~$60/user)** · **Team (~$200/3 users + $50/additional)**

- Paywalls on **volume** (docs/tasks/storage/signatures) and **depth** (Builders/Playbooks features).

---

## KPIs (Launch +90 days)

- Time-to-first Save and Sign

- Connect Google + ≥1 Playbook in 7 days

- WAU workspaces

- Task follow-through

- Contract Signed → Renewal automation adoption

- Upgrade at ≥80% of plan caps

---

## Delivery Plan (W1–W20)

**Done:**  

W1–W6 base, scopes, Vault v1, Workbench shell, Contracts spine, Documenso POC, Share v1, Activity/Insights v0, Mono v1, Beta hardening.  

W7 Share & Signatures v1; W8 Playbooks v1 & Activity v1; W9 Mono & Workbench deepening; W10 Connectors v1 (Drive/Gmail); W11 Activity & Insights v1.

**Remaining:**  

W12–W13 **Contracts GA** (library, tree, pipeline, ClauseGraph, Mono, renewal Playbook).  

W14 **Decks v1**.  

W15 **Accounts v1 (revised)**.  

W16 **Playbooks GA + Tasks v1.5 + Workbench Cards + Vault Diff UI**.  

W17 hardening (perf, reliability, security, a11y AA).  

W18 pricing & caps (limits, nudges, paywall copy, telemetry).  

W19 onboarding & guides (setup flows, tours, hero paths, docs, support).  

W20 GA launch & telemetry (public switch, funnels, runbooks, v2 backlog).

---

## Definition of Done (GA)

- Google Drive + Gmail live and stable.

- Contracts, Decks, Accounts deliver promised flows.

- Documenso "Send for signature" is stable for Contracts.

- Contracts: ≈45-template library, ClauseGraph v1, status pipeline end-to-end.

- Internal Tasks + built-in Playbooks run reliably.

- Vault GB metering + per-file caps enforced with clear UI.

- Telemetry on ≥95% of critical paths.

- Security review and runbooks signed off.
