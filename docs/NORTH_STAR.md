# NORTH_STAR.md — Monolyth (v2026-06-01 rev A, Post-GA product spec)

## Tagline

**Monolyth — All your docs. One brain.**

## Positioning

Early-stage tech founders and lean teams (0–20 employees) on **Google Workspace or Microsoft 365** who live in contracts, decks, and investor-facing financials, but whose documents are scattered across email, cloud drives, task tools, and e-sign platforms.

## Product Promise

Draft the critical documents, keep them organised, and drive the follow-through — with one AI operator (**Mono**) that understands your files, your preferences, and your workflows.

Monolyth is a **document-first operating system** for founders: Contracts, Decks, and Accounts at the centre, with Tasks, Playbooks, and Insights orbiting around them.

---

## Non-Negotiable Truths

1. **Doc-first, not task-first.**  
   Monolyth organises around **contracts, decks, and financial packs**. Tasks, playbooks, and dashboards exist to move documents and deals forward, not the other way around.

2. **Google + Microsoft first, then high-value connectors.**  
   Deep support for **Google Workspace** and **Microsoft 365** (Drive/Slides/Gmail, OneDrive/SharePoint/Outlook/PowerPoint), plus opinionated connectors for e-sign, finance, docs, tasks and comms.

3. **Metadata-first ingestion.**  
   All connectors pull **metadata and lightweight previews** by default. Full content is fetched when the user explicitly imports or Vaults a document.

4. **Vault-only semantics.**  
   Embeddings, semantic search and RAG operate over **Vaulted documents**. External items accessed via connectors are **references** until the user chooses to Vault them.

5. **Human-in-the-loop.**  
   Mono and Playbooks **propose**; users approve. No silent edits, permission changes, bulk deletes, or external sends without visible confirmation.

6. **Explainability + Undo.**  
   Every AI/automation surface exposes “**Why this?**” and offers undo/rollback. RAG answers show sources; Playbooks have audit trails.

7. **Tenant-bound data.**  
   Customer documents, metadata and embeddings are **never** used for cross-tenant training. Mono’s “memory” is per-org; global behaviour is driven by Monolyth’s own internal corpora and synthetic eval sets.

8. **Telemetry with guardrails.**  
   Key flows (generate, save, share, sign, pack runs, Playbooks) are instrumented. Jobs run via a queue with retries + DLQ. Heavy features (RAG, Visual Assistant, connectors) have cost and rate controls.

---

## Core Surfaces & Navigation

### Top-level navigation

- **Workbench** – “My Company Today” control room.  
- **Vault** – Source of truth for all documents and versions.  
- **Builder** – **Contracts, Decks, Accounts** tabs.  
- **Share** – Share Hub + public views.  
- **Signatures** – Signatures Center (Documenso + e-sign connectors).  
- **Contacts** – People and organisations, with engagement.  
- **Tasks** – Task Hub.  
- **Calendar** – Week/month views and Google Calendar mirror.  
- **Playbooks** – Automation builder and run history.  
- **Insights** – Metrics, funnels, workspace health.  
- **Integrations** – Connectors and sync status.  
- **Settings** – Org settings, Mono Memory, billing, security.

### Layout

- Single **AppShell** for all protected routes.  
- Fully responsive: desktop sidebar; mobile nav drawer; consistent page headers, spacing, and typography.  
- Basic WCAG AA accessibility: keyboard nav, focus outlines, contrast, ARIA on main components.

---

## Builders

### Contracts Builder

**Role:** Legal contracts are the **hero experience**. Founders can draft, negotiate and track all key contracts in one place.

#### Library & Types

- ≈45 canonical templates across three categories:
  1. **Operational & HR** – NDAs, employment agreements, contractor/consulting, intern agreements, performance/termination letters, confidentiality, basic policies, SaaS ops terms.  
  2. **Corporate & Finance** – founder/shareholder agreements, SAFEs/convertibles, share/asset purchase, JV/partnership, loan/lease/financing docs.  
  3. **Commercial & Dealmaking** – MOUs/LOIs, MSAs/SOWs, reseller/distribution/licensing, referral agreements, commercial NDAs/NCND, supply/manufacturing.

- Templates live in a structured library with:
  - `category`, `canonical_type`, `jurisdiction`, `risk_level`, `is_canonical`, `alt_group`.  
  - Single canonical template per contract type, alternates for soft/aggressive variants.

#### Clause Library & ClauseGraph

- Clause catalog covering:
  - **Core business**: parties, recitals, term/termination, governing law, notices, entire agreement, amendments, counterparts/e-signatures.  
  - **Risk & liability**: confidentiality, IP, reps/warranties, indemnity, limitation of liability, force majeure, dispute resolution, assignment, non-compete/non-solicit.  
  - **Commercial & operational**: SOW, payment terms, SLAs, change control, acceptance, return of materials/data, compliance, publicity, survival.

- ClauseGraph v1.5/2:
  - Visual/matrix view of clause usage and risk heat across the contract portfolio.  
  - Filters by category, risk posture, jurisdiction.  
  - Clause-level stats (usage by template, “aggressive vs soft” adoption, missing standard clauses).

- Clause library management UI:
  - Add/update/archive clauses, mark alternates, define canonical/soft/aggressive profiles, set jurisdiction tags.

#### Builder UX

- **Contracts** tab inside Builder with:
  - 3-level tree (Category → Type → Template).  
  - Hero shortcuts (Start NDA, Start MSA, Start SOW, Contractor Agreement, Employment Agreement, SaaS Agreement).  
  - Template cards showing risk, jurisdiction baseline, recommended usage.

- Two entry paths:
  - **Start from Template** – choose template, tweak clauses with ClauseGraph.  
  - **Start with AI Brief** – user gives brief; Mono suggests template + clauses and generates a first draft for review.

#### Status & Lifecycle

- Lifecycle: `draft → in_review → approved → sent → signed → active → expired`.  
- Status changes logged in Activity/Insights and visible on Workbench, Deals, and Contacts.

#### Diff & Redline

- Clause-aware diff:
  - Added/removed/changed clauses highlighted; text diff within changed clauses.  
  - Fallback to text diff if clause IDs are missing.

- Diff accessible from:
  - Builder (“Compare to previous version”).  
  - Vault (“View diff” for versions).

#### Mono for Contracts

- Explain clause (“What this means” + “Why this clause appears now”).  
- Suggest standard/safer/more aggressive variants.  
- Compare drafts and summarise risk deltas.  
- Respect org-level **jurisdiction**, **tone**, and **risk posture** from Mono Memory.

---

### Decks Builder

**Role:** Central place to create, iterate, and track pitch and update decks, tied tightly to deals and investors.

#### Deck Types

- **Fundraising Deck** – For raising pre-seed/seed/Series A rounds.  
- **Investor Update Deck** – For monthly/quarterly updates.  
- Seed templates for **Sales / Customer decks** and other founder docs.

#### Structure & Checks

- Opinionated structure per deck type:
  - Fundraising: Problem, Solution, Product, Market, Traction, Business Model, Go-To-Market, Team, Financials, Appendix, etc.  
  - Investor Update: Highlights, Product, GTM, Metrics, Finance, Asks.

- “Missing pieces” checker prompts user when crucial sections are empty or weak.

#### Content & Variants

- Mono generates content per section using:
  - Vaulted company docs and decks.  
  - Accounts packs (for metrics and financials).  
  - Org preferences (tone, region, stage).

- Support for **deck variants per recipient**:
  - Master deck + derived investor-specific variants.  
  - Keep linkage so analytics roll up to master.

#### Visual Deck Assistant

- Per-slide **“Suggest visual”** button:
  - Generates timelines, process diagrams, basic charts/infographics via a chosen image model.  
  - Stores visual spec + generated image in an asset bucket.  
  - Allows regenerate/replace while preserving lineage.

- Rate-limited by org/user with cost and latency telemetry.  
- Global kill-switch behind a feature flag.

#### Deck Analytics & Investor Feedback

- Based on tracked share links + pixels:
  - Per-deck and per-recipient metrics (views, last viewed time, session count).  
  - Optional per-slide engagement (time on slide, drop-off slide).

- Investor-level view:
  - Which decks and versions each investor opened, how often, how recently.  
  - Feeds into Deal Agent and Workbench (“investor X is engaged / cold”).

#### Accounts → Decks

- Financial blocks from Accounts Packs:
  - Runway charts, SaaS spend breakdown, KPI tables, time-series metrics.

- “Push to Deck”:
  - Insert or update slides in Decks Builder with these blocks.  
  - Ability to refresh slides when underlying Packs change.

---

### Accounts Builder

**Role:** Turn messy financial docs into investor-ready packs and runway views.

#### Financial Inbox

- `financial_documents` schema for:
  - SaaS invoices, receipts, statements, accountant packs.  
  - Fields: vendor, provider, doc_type, report_type, currency, total_amount, period_start, period_end, etc.

- Classifier/extractor tuned on real samples (~50–100 docs) to ≈90% accuracy.  
- Documents arrive from:
  - Connectors (QBO, Xero, Stripe, email/drive storage).  
  - CSV/statement uploads.

#### Accounts Packs

Pack types:

1. **SaaS Expenses Pack** – SaaS vendor list, monthly spend, trends.  
2. **Investor Snapshot** – high-level revenue, growth, burn, runway, key KPIs.  
3. **Runway Planner** – cash runway with best/base/worst-case toggles.  
4. **KPI Notebook** – curated metrics with narrative commentary.

Flow:

- Select period/scope → generate → review → save to Vault (and optionally push blocks to Decks).

#### Scenario Modelling

- Simple toggles/sliders for:
  - Growth scenarios.  
  - Cost cuts.  
  - New hires or major expenses.

- Mono explains impacts (“This change extends runway by X months,” etc.).

#### Data Sources

- **QuickBooks / Xero**: customers/vendors, invoices/bills, P&L/BS summaries.  
- **Stripe**: subscription metrics and revenue trends.  
- CSV imports for edge cases and non-integrated sources.

---

## Workbench & Tasks

### Workbench — “My Company Today”

- Cards for:
  - Hot vs stuck deals.  
  - Pending signatures and recently signed contracts.  
  - Recently shared decks and their engagement.  
  - Accounts packs and runway alerts.  
  - Tasks due/overdue.

- Quick actions:
  - Generate new contract/deck/pack.  
  - Resume in-progress items.  
  - Trigger key Playbooks (Weekly Update, Fundraise Prep, Onboarding).

- Mono side panel:
  - Summarises what changed.  
  - Suggests what to focus on and offers one-click Playbook runs.

### Tasks & Calendar

- Tasks are org-scoped with:
  - Title, status, due date, assigned user, linked doc/deal/contact, tags.

- **Recurring tasks** and **templates**:
  - Weekly investor update, monthly close, quarterly board prep, contract renewals.

- Sync with external PM tools:
  - Outbound tasks to **Asana**/**Linear** (with optional inbound updates).  
  - Tasks tagged with “source” for mapping.

- Calendar:
  - Week + month views.  
  - Read-only **Google Calendar mirror** for key events (e.g. closes, board meetings).  
  - Filters by owner/tag/source.

- Daily/weekly email digests:
  - Tasks, deals, upcoming deadlines, and key changes.

---

## Playbooks & Automation

**Concept:** A constrained **automation builder** for founder workflows. Mono uses Playbooks as its “hands”.

### Built-in Playbooks

- Weekly Investor Update.  
- Seed/Series Raise Prep.  
- New Customer Onboarding.  
- Contract Signed → Renewal Task.  
- Runway Alert (runway below X months).

### Playbooks v2 Editor

- Visual editor with safe actions only:
  - Search / fetch docs.  
  - Summarise / generate doc/deck/email.  
  - Create/update tasks.  
  - Create share links.  
  - Send email (using templates).  
  - Notify Slack/Teams channels or DMs.

- Triggers:
  - Scheduled/cron (e.g. every Friday).  
  - Signature completed (Documenso + e-sign connectors).  
  - Hooks from internal events (e.g. pack generated, deck shared).

- Auditability:
  - Each run records inputs, outputs, and actions in an audit log.  
  - Dry-run mode to preview before committing changes.

---

## Mono AI & RAG

**Mono** is a **doc-first operator**, not a generic chatbot.

### RAG v1 – Vault-first

- Semantic indexing for:
  - Vaulted docs + explicitly imported Google docs.

- Mono answers:
  - Point-in-time Q&A about contracts, decks, and packs.  
  - “Where is X clause?” / “Show me all NDAs with Y party.”  
  - “Summarise the last month of investor updates.”

- Every answer:
  - Provides citations with doc titles and “Why this?” context.  
  - Observes org’s preferences (tone, jurisdiction, risk posture).

### RAG v2 – Federated

- Adds selected external sources via connectors:
  - Google Drive/Gmail, OneDrive/SharePoint, Notion, etc.

- Vault-first semantics:
  - Vault docs are primary.  
  - External docs included with clear provenance labels (“from Drive”, “from Notion”).

### Org Memory

- Settings surface where orgs define:
  - Jurisdiction(s) of choice.  
  - Tone and risk posture.  
  - Currency and sector focus.

- Per-Playbook overrides when needed (e.g. “use neutral tone for investor updates regardless of org default”).

---

## Share Hub, Signatures & Contacts

### Share Hub

- Share links with:
  - Auth-aware or token-based access.  
  - Expiry and password options.  
  - Watermark overlays on shared views.  
  - Basic redaction controls for sensitive blocks.

- Tracking:
  - Tokenised links and tracking pixel endpoint.  
  - Feeds Deck Analytics, Insights, Deals and Contacts.  
  - Privacy copy in share UI and shared view footers.

### Signatures Center

- Aggregates:
  - Documenso (primary).  
  - DocuSign, Dropbox Sign, Adobe Sign (via connectors).

- Shows:
  - Envelopes, recipients, statuses, timestamps.  
  - Links back to Vault contracts and Deals.

- Reliability:
  - Webhooks processed via Jobs/Queue, idempotent, with DLQ/replay.

- Multi-step flows:
  - Implemented with Playbooks (internal approvals, sequential signer routing, notifications).

### Contacts & Engagement

- Contacts DB with:
  - People and organisations, RLS protection.  
  - Links to docs, decks, deals, shares, signatures, tasks.

- Engagement:
  - Timelines of interactions.  
  - Simple engagement scoring (cold/warm/hot) based on opens, clicks, signatures, responses.

- Imports:
  - Optional Google Contacts import.  
  - Contacts flagged as PII; export/erasure paths gated via feature flags.

---

## Insights & Dashboards

- **Base metrics**:
  - Docs created, shared, signed.  
  - Accounts pack runs.  
  - Tasks created/completed.  
  - Connector status and usage.

- **Funnels**:
  - Contracts: created → sent → viewed → signed → renewed.  
  - Decks: generated → sent → opened → responded.

- **Workspace Health**:
  - Hygiene status (duplicates, bad names, untagged docs) with direct links to fix.

- **Deals & Investors**:
  - Deal pipelines, hot vs stuck markers.  
  - Investor-level engagement across decks, emails, and signatures.

- **Plan Usage & Admin**:
  - Docs, signatures, AI/RAG usage, storage GB, connector usage.  
  - Used for billing + upgrade prompts.

- **Weekly Digests**:
  - Email summaries covering contracts, decks, packs, tasks, runway and top contacts for the week.

---

## Connectors

### Email

- **Gmail**  
- **Microsoft 365 Outlook**

Use-cases: receipts/invoices, contract threads, introductions. Attachments and relevant emails can be pushed into Vault and Accounts.

### Docs & Storage

- **Google Drive**  
- **Microsoft OneDrive**  
- **Microsoft SharePoint** (doc libraries)  
- **Dropbox**  
- **Box**

Use-cases: contracts, decks, policy docs, financial statements and archives.

### Decks

- **Google Slides**  
- **Microsoft PowerPoint** (via Graph/OneDrive/SharePoint)  
- **Pitch.com**  
- **Canva**

Use-cases: importing existing decks into Decks Builder, tracking engagement, and updating them via Accounts → Decks flows.

### E-sign

- **DocuSign**  
- **Dropbox Sign (HelloSign)**  
- **Adobe Acrobat Sign**

Use-cases: importing envelope metadata and executed contracts into Vault, Deals, Signatures Center.

### Finance

- **QuickBooks Online**  
- **Xero**  
- **Stripe**

Use-cases: pulling invoices/bills, summary P&L/BS, subscription metrics, and revenue trends into Accounts schema and Packs.

### Workspace / Docs / Comms

- **Notion** (pages as docs)  
- **Slack** (files & links + notification target)  
- **Microsoft Teams** (files & links + notification target)

Use-cases: capturing docs created/shared in workspaces and surfacing them as Vault candidates; sending Playbooks notifications.

### Tasks / Projects

- **Asana**  
- **Linear**  
- **ClickUp**  
- **Trello**  
- **Jira**

Use-cases: importing existing tasks/projects into Monolyth Tasks, mapping boards to tags/spaces, and syncing key tasks back out.

### Connector framework

- All connectors share a common model for:
  - Accounts, sync jobs, last sync status, error state.  
  - Jobs/Queue-based sync (initial + incremental).  
  - Metadata-first ingestion, with controlled “Import to Vault/Tasks” flows.  
  - Health and usage surfaced in `/integrations` and Insights.

---

## Pricing & Plans

High-level shape — numeric quotas can be tuned independently.

### Plans

- **Free** – 1 person testing Monolyth.  
- **Starter** – 1–3 founders running real workflows.  
- **Pro** – 3–20-person startup teams making Monolyth their main doc/deal OS.  
- **Team** – pods and small funds using Monolyth across multiple deals.

### Free

- **Price:** $0  
- **Includes:**
  - Core surfaces (Workbench, Vault, Builders, Share, basic Signatures, Contacts, Tasks/Calendar, basic Insights).  
  - Mono with tight RAG limits.  
  - Built-in Playbooks only.  
  - Google Drive + Gmail connectors.
- **Limits:**
  - Small Vault/storage, low signatures/month, limited AI/RAG and Pack runs.  
  - No Playbooks editor, no advanced funnels, no admin dashboards.

### Starter

- **Price:** ~$30/seat/month (discount on annual).  
- **Includes:**
  - Everything in Free.  
  - Higher doc/storage, signatures, AI/RAG, Accounts Packs limits.  
  - Access to most connectors with a modest number of active connections.  
  - Full access to Contracts v2, Decks v2 (Visual Assistant constrained), Accounts v2.  
  - Playbooks v2 editor with a limited set of custom Playbooks.  
  - Basic Deck Analytics and Deal views.
- **Limits:**
  - Moderate usage caps, limited Playbooks count and runs, limited historical analytics retention.

### Pro

- **Price:** ~$60/seat/month (discount on annual).  
- **Includes:**
  - Everything in Starter.  
  - High doc/storage, signatures, AI/RAG, Accounts Packs limits.  
  - Broad use of 25 connectors (most can be connected simultaneously).  
  - Full Playbooks v2 editor with more triggers and actions.  
  - Full Deck Analytics + investor feedback dashboards.  
  - Advanced funnels and admin usage dashboards.  
  - Accounts → Decks integration and more generous Pack usage.
- **Limits:**
  - High but finite usage ceilings; overage or nudges to upgrade.  
  - Longer analytics retention.

### Team

- **Price:** ~$200/month for 3 seats + $50/additional seat (discount on annual).  
- **Includes:**
  - Everything in Pro.  
  - 3 seats bundled; tuned for “founder + ops + finance/legal” or “partner + associates” pods.  
  - Highest caps on usage, Packs, and connectors within this tier.  
  - More granular admin controls and priority access to roadmap/flagged features.  
  - Best support SLAs and security posture under published runbooks and DPA.
- **Limits:**
  - Not an “unlimited enterprise” tier; intended as the top self-serve plan before a future Enterprise SKU.

---

## Data & Training Principles

Monolyth’s AI features are designed around **trust-first, tenant-bound data**:

1. **No cross-tenant training on customer docs.**  
   Customer docs, embeddings and metadata are not used to train global models.

2. **Org-scoped learning only.**  
   Mono’s “brain” for a workspace is built purely from that workspace’s Vault docs, preferences, and Playbook history.

3. **Internal training corpus.**  
   Monolyth maintains its own internal corpus (house templates, public examples, synthetic data) for evals and improvements.

4. **Behavioural telemetry, not content scraping.**  
   We log **events** (e.g. “contract generated”) with minimal content, enough for reliability + product improvement.

5. **Deletion and export.**  
   When a document is removed from Vault, its embeddings are treated as removed from context. PII export/erasure paths are available where flags are enabled.

6. **Explicit opt-ins for anything beyond this.**  
   Any future programme that uses private data beyond this baseline is explicit, contractual, and opt-in.

---

This file is the **single source of truth** for the **Post-GA Monolyth product**: what it is, what it isn’t, and how it behaves.
