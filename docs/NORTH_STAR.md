# Monolyth — NORTH_STAR (v2025-11-26, GA Scope Locked)

> **Tagline:**  
> **Monolyth – All your docs. One brain.**

This document is the **single source of truth** for what Monolyth is, who it’s for, and what we are shipping for GA in the 20-week build.

If something in the code or UI disagrees with this, the code/UI is wrong unless we explicitly update this doc.

---

## 1. Vision

Monolyth is the **document-first business OS** for founders and small teams.

It connects your contracts, decks, and financial statements, puts them into one Vault, and gives you an AI operator — **Mono** — that:

- Knows what’s in your docs.
- Remembers your preferences.
- Automates the “next steps” around those docs via tasks and Playbooks.

The outcome:

- You stop juggling 5–7 tools (Docs, Slides, Sheets, e-sign, email, random trackers).
- You stop losing track of deals, renewals, and investor updates.
- You get a “doc ops brain” that sits on top of your Google Drive and Gmail.

---

## 2. Who Monolyth Is For (ICP)

Primary ICP for GA + first 12 months:

- **Early-stage tech founders / operators**
  - 0–20 employees
  - B2B SaaS, agencies, consultancies, productised services
- Running primarily on **Google Workspace**:
  - Google Drive, Docs, Sheets, Slides
  - Gmail

They:

- Live in a mess of folders, drafts, and email threads.
- Are constantly:
  - Sending/negotiating contracts
  - Building/updating decks
  - Explaining basic financials to investors / advisors

They want:

- Less chaos.
- Fewer tools.
- Confidence that contracts, decks, and numbers are **in sync** and under control.

---

## 3. The Core Problem

Today, founders experience:

1. **Contract chaos**
   - NDAs, MSAs, SOWs, contractor agreements in random folders.
   - No system for renewals, obligations, or changes.
   - Cobbling together templates from old emails and Google search.

2. **Deck chaos**
   - Multiple versions of pitch and update decks.
   - Story rarely matches the latest numbers.
   - Decks built in a rush every time they need to send something out.

3. **Number chaos**
   - Financials spread across Sheets, accounting tools, and half-finished dashboards.
   - Investor snapshots rebuilt manually from scratch.
   - Numbers in decks often out of date or inconsistent.

4. **Workflow glue hell**
   - Use 5–7 tools to:
     - Draft a contract,
     - Get it signed,
     - Track it,
     - Build a deck,
     - Send an update,
     - Chase a renewal.

No one is watching the whole system. No one is reminding them what matters when.

---

## 4. Monolyth’s Answer (Conceptual Model)

Monolyth is a **single, opinionated system** with these core components:

1. **Vault**  
   - One place for all important docs.
   - Metadata-first: who, what, when, how much, status, deal/round.
   - Backed by RAG for retrieval.

2. **Builders**
   - AI-assisted document builders for:
     - Contracts
     - Decks
     - Financial statements/snapshots

3. **Mono (AI Operator)**
   - The “brain” that can:
     - Draft and revise documents.
     - Explain and compare clauses.
     - Summarise and interpret numbers.
     - Suggest what to do next.

4. **Tasks**
   - Internal Monolyth tasks, created mainly by Playbooks.
   - Attached to docs and deals/rounds.
   - Show up on Workbench and can send email reminders.

5. **Playbooks**
   - Deterministic workflows that respond to doc events (e.g. “contract signed”) and create tasks and notifications.

6. **Connectors**
   - For GA:
     - Google Drive
     - Gmail
   - Post-GA:
     - Slack, Notion, OneDrive, Google Calendar, Google Tasks, etc.

All of this is anchored around **deals/rounds**, so founders can see:

> “Everything for this client / this funding round in one place.”

---

## 5. GA Scope (Frozen)

GA is a **20-week build** with the following frozen scope:

### 5.1 Builders

We ship **three Builders**:

1. **Contracts Builder (Hero)**
2. **Deck Builder** – exactly 2 flows:
   - Fundraising Deck
   - Investor Update Deck
3. **Accounts Builder** – exactly 2 flows:
   - SaaS Financial Pack
   - Investor Financial Snapshot

No additional Builders or flows are added before GA.

### 5.2 Connectors

At GA, only:

- **Google Drive** (live)
- **Gmail** (live)

All other connectors are **Post-GA**.

### 5.3 AI Vendors

At GA, only:

- **OpenAI** (LLMs)
- **Google** (for slides/visuals where needed)

No Claude, Llama, Grok, or others before GA.

### 5.4 Tasks

At GA:

- Tasks are **internal Monolyth tasks**:
  - Created by Playbooks.
  - Shown on Workbench.
  - Linked to docs and deals/rounds.
  - Support email reminders.

No external task/calendar sync until Post-GA.

---

## 6. Core Modules (Detailed)

### 6.1 Workbench

Workbench is the default entry point.

It shows:

- **Recent Activity**
  - Contracts:
    - Created, sent, viewed, signed.
  - Decks:
    - Generated, updated.
  - Accounts:
    - New snapshots/packs created.

- **Open Tasks**
  - Internal tasks that need attention:
    - “Review renewal for Client X”
    - “Send investor update deck”
    - “Refresh SaaS metrics”

- **Active Deals & Rounds**
  - Cards representing:
    - Important clients (deals)
    - Fundraising rounds
  - Each card links to:
    - Related contracts
    - Latest deck
    - Latest financial snapshot
    - Open tasks

- **Mono Side Panel**
  - Context-aware assistant:
    - “What changed this week?”
    - “What should I focus on?”
    - “Explain this contract / deck / snapshot.”

- **Quick Actions**
  - New Contract
  - New Deck
  - New Statement
  - Analyze Doc
  - Send for Signature

---

### 6.2 Vault

Vault is the central store for docs and their metadata.

Each doc in Vault has:

- ID
- Type: contract / deck / statement / other
- Source: Builder / Drive / Gmail / upload
- Parties / counterparties (contracts)
- Dates:
  - Created
  - Effective
  - Signed
  - Renewal
  - Expiry
- Amounts:
  - Fees
  - MRR / ARR
  - Other key metrics where applicable
- Status: draft / sent / signed / archived
- Links:
  - Share links
  - E-sign IDs
- **Deal / Round / Project Tag**

Vault also:

- Serves as the **RAG corpus**:
  - Content is chunked and embedded.
- Drives search / filters for:
  - Workbench
  - Builders
  - Mono

---

### 6.3 Contracts Builder

Contracts Builder is the **flagship**.

It supports:

- Common startup-focused templates:
  - Mutual NDA
  - Service Agreement / MSA
  - SOW / Work Order
  - Contractor Agreement
- Clause library with:
  - Clause categories (confidentiality, liability, termination, etc.)
  - Standard positions (friendly / balanced / aggressive).

Flows:

1. **Create from template**
   - Pick contract type.
   - Answer a guided UI for key parameters.
   - Mono generates a first draft.

2. **Edit with Mono**
   - Ask Mono to:
     - Explain clauses.
     - Compare versions.
     - Suggest alternative wording (based on tone/risk profile).
   - Mono is grounded in:
     - Org/User preferences (Mono Memory).
     - Similar past contracts (RAG).

3. **Send & Sign**
   - Generate a share link / signature request via e-sign provider.
   - Track:
     - Sent
     - Viewed
     - Signed

4. **Post-sign**
   - Store executed version in Vault.
   - Trigger Playbooks to create tasks:
     - Renewal review tasks.
     - Key obligation tasks.

---

### 6.4 Deck Builder (2 Flows)

Deck Builder:

1. **Fundraising Deck**
2. **Investor Update Deck**

Inputs:

- Company basics (name, stage, sector).
- Metrics from Accounts Builder outputs (where available).
- Existing deck (optional) for remix.

Outputs:

- A structured deck:
  - Headline
  - Problem / solution
  - Traction
  - Business model
  - Market
  - Team
  - Ask / use of funds (for fundraising)
- Slide-level content that can be exported to:
  - Google Slides
  - PDF

Mono helps:

- Rewrite content for clarity and tone.
- Align story with latest numbers (via RAG over financial snapshots).

---

### 6.5 Accounts Builder (2 Flows)

Accounts Builder:

1. **SaaS Financial Pack**
   - Revenue / MRR / ARR
   - Basic P&L shape
   - Simple balance sheet/runway view
2. **Investor Financial Snapshot**
   - Headline metrics:
     - MRR / ARR
     - Growth rates
     - Burn and runway
     - High-level unit economics where available

Inputs:

- Manual entry or CSV upload.
- Later: direct Sheet reading (if possible within GA without scope creep).

Mono:

- Explains trends.
- Highlights anomalies against previous snapshots.

Deck Builder can pull from Accounts outputs to keep decks aligned.

---

### 6.6 Tasks

Tasks are:

- Internal Monolyth objects at GA.
- Created mainly via Playbooks.
- Linked to:
  - Contracts
  - Decks
  - Statements
  - Deals / rounds

Each task has:

- Title
- Description (optional)
- Linked object(s)
- Due date / relative schedule
- Status (open / completed)

Tasks appear:

- On Workbench (“Open Tasks”).
- Potentially on a simple Tasks view (if implemented within GA effort).

Tasks can trigger:

- Email reminders (via a simple scheduled job or Playbook).

No external sync to Google Tasks/Calendar until Post-GA.

---

### 6.7 Playbooks

Playbooks are deterministic automations like:

- **On Contract Signed**
  - Store executed contract.
  - Create renewal review task.
  - Optional follow-up email.

- **On Fundraising Deck Generated**
  - Log activity.
  - Create “send to investors” task.

- **On Investor Snapshot Created**
  - Link to latest deck.
  - Create “send investor update” task.

The engine:

- Reads event payloads from ActivityLog.
- Writes tasks and logs back to DB.
- May call OpenAI for summaries where needed (but flows are deterministic).

User-built Playbooks and a marketplace are Post-GA.

---

### 6.8 Connectors

**GA Live Connectors:**

- **Google Drive**
  - Folder selection.
  - File import (docs, slides, PDFs).
  - Store file references + snapshots in Vault.

- **Gmail**
  - Limited-scope ingestion:
    - Recent attachments.
    - Important links (e.g. share links).
  - Attach to Vault docs.

**UI-only (Coming Soon) Connectors (No Sync at GA):**

- Google Calendar
- Google Tasks
- Slack
- Notion
- OneDrive
- Others

These are visible but disabled to signal future breadth.

---

## 7. AI Architecture

### 7.1 Vendors

At GA:

- **OpenAI** – single LLM provider for:
  - Contracts Builder
  - Decks Builder
  - Accounts Builder
  - Mono
  - Playbooks summarisation (where needed)

- **Google** – for:
  - Slides/visual generation or integration.
  - OCR/vision tasks if required.

No multi-provider switching before GA.

---

### 7.2 Mono Memory v1

Mono Memory has two main tables:

1. `mono_org_profile`
   - `org_id`
   - `default_tone` (`formal` | `neutral` | `casual`)
   - `default_risk_profile` (`friendly` | `balanced` | `aggressive`)
   - `default_jurisdiction` (e.g. “Delaware, USA”)
   - `default_locale` (e.g. “en-US”)

2. `mono_user_profile`
   - `user_id` (auth.users)
   - `org_id` (optional)
   - `tone`
   - `risk_profile`
   - `default_jurisdiction`
   - `default_locale`

Helpers:

- `getMonoProfiles()` – loads user + org profile, with sane defaults if missing.
- `buildMonoPreferenceConfig()` – returns a small object used in prompts.

Mono and Builders:

- Read these preferences on every call.
- Use them to shape:
  - Draft tone.
  - Risk posture for clauses.
  - Jurisdiction defaults.
  - Spelling/format (locale).

---

### 7.3 Template Usage Logging

`mono_template_usage` table:

- `user_id`
- `org_id`
- `builder_type` (`contract` | `deck` | `accounts`)
- `template_id`
- `clause_id`
- `usage_count`
- `last_used_at`

For GA:

- We **insert** rows whenever:
  - A template is selected.
  - A clause is added/accepted.
- We **log** errors but never block the main request.

Post-GA:

- Use this data for:
  - Re-ranking templates/clauses.
  - “Frequently used” suggestions.
  - User-level and org-level learning.

---

### 7.4 RAG

RAG components:

- Embedding store (in Supabase or external vector DB).
- Chunking strategy:
  - Contract sections, deck slides, snapshot sections.
- Query API:
  - `searchRag(query, options)` returns matched chunks + metadata.

Usage:

- Mono:
  - When explaining a contract, deck, or snapshot, fetch top-k chunks of that doc.
  - When asked about “past deals” or “similar contracts”, search across Vault.

- Builders:
  - Contracts Builder:
    - Reuse language from previous similar contracts.
  - Deck Builder:
    - Pull in latest metrics from financial snapshots.
  - Accounts Builder:
    - Compare with previous snapshots for trend context.

For GA:

- RAG is **basic but real**:
  - Index docs written by Builders and imported from connectors.
  - Use retrieval in a few key flows.
- Advanced ranking and cross-doc analytics are Post-GA.

### 7.5 Mono Memory + RAG (Week 9)

- Week 9 ships the first version of Mono's "brain" layer:
  - Mono Memory v1 (org/user profiles + template usage logging) wired into Contracts Builder.
  - RAG foundations (embeddings table + helpers) wired into Mono's analyze/explain path.
- The detailed architecture lives in `docs/AI_MONO_MEMORY_AND_RAG_V1.md`.
- Behavioural goal: every contract generation and Mono doc-explain call can be conditioned on stable preferences and, later, grounded in stored document chunks.

This is a foundation-only milestone; real embeddings and profile UI will be implemented in later weeks, without changing the public APIs introduced here.

---

## 8. Product Strategy Guardrails

Until GA:

- No new Builders.
- No new flows beyond the 2 Deck and 2 Accounts flows.
- No new live connectors beyond Google Drive + Gmail.
- No new AI vendors beyond OpenAI + Google.
- No rewriting the whole product vision.

We can:

- Improve prompts.
- Improve UX.
- Improve metadata and tasks.
- Tighten the “Contracts First” path.

---

## 9. Hero Paths

GA must support **three excellent hero paths**:

1. **Close a New Client**
   - Create NDA (Contracts Builder).
   - Create MSA/SOW.
   - Send for signature.
   - Store executed docs in Vault.
   - Auto-create renewal/obligation tasks.

2. **Run a Fundraise**
   - Build/refresh SaaS Financial Pack + Investor Snapshot.
   - Generate Fundraising Deck.
   - Create tasks to send to target investors.
   - Keep deck narrative in sync with snapshot metrics.

3. **Do Monthly Investor Updates**
   - Refresh metrics.
   - Generate Investor Snapshot.
   - Generate Investor Update Deck.
   - Create “send update” tasks.

These three flows should be obvious in:

- Onboarding.
- Workbench.
- Marketing site.
- Your founder launch video.

---

## 10. Pricing & Plans (Guiding Idea)

Not strictly enforced at GA but guiding:

- **Free**
  - Single user
  - Limited docs
  - Limited Playbooks and tasks

- **Starter**
  - Ideal for solo founders
  - Unlocks Contracts, simple Decks, basic Accounts

- **Pro**
  - For 2–10 person teams
  - More volume, more tasks, better Playbooks

- **Team**
  - For small teams with multiple builders
  - Higher limits, more collaboration features

Pricing can move, but the structure should reinforce the wedge:
- People pay more as they rely on Monolyth for **core contract, deck, and number workflows**.

---

## 11. Post-GA Direction (High Level)

After GA, success looks like:

- 50–100 real signups.
- 20–30 active teams.
- 5+ founders using Monolyth as their primary way to:
  - Manage contracts
  - Communicate with investors
  - Share key numbers

Post-GA roadmap (only after GA ships):

- More connectors:
  - Slack, Notion, OneDrive, Google Calendar, Google Tasks
- Richer Tasks:
  - Two-way sync with Calendar/Tasks
- User Playbooks:
  - Custom automations, sharing, marketplace
- “AI Library” UI:
  - Template/Clause usage analytics
  - Org knowledge views
- Verticalisation:
  - More template packs for specific verticals

But **none** of that changes GA scope.

---

## 12. Final Rule

> **We do not change this North Star or GA scope until GA is shipped.**

We can:

- Fix bugs.
- Improve UX.
- Tune prompts and defaults.
- Tighten product language.

We **cannot**:

- Add new modules.
- Add new Builders/flows.
- Introduce new AI vendors.

We ship the GA we’ve defined here, then iterate in public.
