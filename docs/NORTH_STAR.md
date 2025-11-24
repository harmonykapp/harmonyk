# Monolyth — NORTH_STAR (v2025-11-24)

## 1. Tagline & Vision

**Tagline**  
Monolyth — **All your docs. One brain.**

**Vision**  
Monolyth is the **document-first business OS** for founders and small teams.

It connects all your important documents, automates the boring workflow glue around them, and gives you one AI operator — **Mono** — that knows what’s happening across your business.

If you plug in your current doc mess (contracts, decks, PDFs, share links), Monolyth should feel like you suddenly hired a sharp operations person who:
- Knows where every important doc lives.
- Remembers what’s been done with it.
- Nudges you on what needs to happen next.

---

## 2. Who Monolyth Is For

- Solo founders and lean teams who run their business out of Google Docs, Drive, PDFs, slides, and links.
- SMBs drowning in contracts, proposals, and updates with no real system.
- People who hate juggling 5–7 tools just to get a contract drafted, signed, shared, and tracked.

Monolyth is **not** an enterprise ECM or a generic note-taking app. It’s a **doc-first business task organizer** for small teams that want leverage, not bureaucracy.

---

## 3. Core Job To Be Done

> “Show me everything that matters across my documents,  
> help me get the next steps done automatically,  
> and keep track of who did what, when.”

In practical terms:
- One pane of glass for your important docs and their status.
- Smart workflows that move documents along without you micro-managing them.
- A trustworthy log + analytics layer so you aren’t flying blind.

---

## 4. Product Truths (Non-Negotiables)

1. **Metadata-first ingestion**  
   - Only pull full file content on **Preview / Save to Vault / Send for Signature**.  
   - Connectors start as metadata + keyword search.

2. **Vault-only semantics**  
   - Embeddings and semantic search **only** apply to docs stored in Vault.  
   - External sources stay **keyword-federated**, not semantically blended.

3. **Human-in-the-loop**  
   - Mono proposes; users approve.  
   - No silent changes to Playbooks, permissions, or critical workflows.

4. **Explainability & Undo**  
   - Every AI/automation has a reason, a log, and a path to undo.  
   - Playbooks runs and AI actions are fully traceable.

5. **Privacy by design**  
   - Least-privilege scopes on integrations.  
   - Doc-scoped guest tokens with TTL.  
   - Watermarks/redactions where feasible on sensitive shares.

---

## 5. Navigation & Information Architecture (GA)

**Primary nav (GA):**  
Dashboard · Workbench · Builder · Vault · Playbooks · Share Hub · Integrations · Insights · Task Hub · Settings

**Conceptual groupings**

- **Workspace:** Dashboard, Workbench, Builder, Vault.  
- **Automation:** Playbooks, Task Hub.  
- **Collaboration:** Share Hub (links, signatures, Guest Spaces).  
- **Ops & Governance:** Insights, Settings, Integrations.

Rule of thumb: every feature must clearly support one of these groups. If it doesn’t, it probably doesn’t belong in core.

**Golden Path (core flow)**  
Workbench → Analyze → Builder → Save to Vault → Share → Sign → Activity/Insights.

---

## 6. Product Pillars

### 6.1 Vault — Source of Truth

- Stores Monolyth-native docs and references to external docs (e.g., Drive, OneDrive).  
- Holds rich metadata: type, status, owner, tags, last activity, lineage.  
- **Semantic index is Vault-only** for safety and clarity.  
- Versioning and lineage: track how docs evolve, including Builder-generated versions.  
- Storage metering is **Vault bytes only** (see Storage section).

### 6.2 Builder — AI Document Studios

- **Studios:**  
  - **Contracts:** NDAs, MSAs, SOWs, employment docs, SLAs, etc.  
  - **Decks:** pitch, board, updates; AI outline → slide auto-layout.  
  - **Accounts:** receipts → entries, simple statements and summaries.

- **Contracts (near-term focus)**  
  - Template + Mono-driven drafting and redlining.  
  - ClauseGraph: structured clause library with reuse and risk scoring (beta at GA).  
  - Bundles: “hire packet”, “board pack”, “fundraising packet”.

- **Decks & Accounts (GA)**  
  - Decks: structured sections (problem, solution, traction, ask) with AI layouts.  
  - Accounts: map receipts and docs to simple statements and exports.

### 6.3 Workbench — Single Pane of Glass

- Unified triage table across Vault + connectors.  
- Federated keyword search over external sources; full semantics over Vault.  
- Smart queues and filters: by source, owner, doc type, status, last activity.  
- First place to:  
  - Find a doc across your mess.  
  - Run Analyze.  
  - Kick off a Playbook on a selection or Saved View.  

### 6.4 Playbooks — Automation Engine

- **Deterministic workflows:**  
  - Triggers / Conditions / Actions / Branching / Wait / Retry.  
  - Event + manual triggers (e.g., “share_link_created”, “signature_completed”, “Run on selection”).

- **Scope:**  
  - Scoped to selection, folder, tag, or Saved View.  
  - Users explicitly choose where a Playbook applies.

- **Guardrails:**  
  - “Save & Enable” required before anything runs on events.  
  - Dry-run mode shows a plan and diff before live runs.  
  - Logs + undo for supported actions (e.g., undo created share links).

- **Library (v1 seeds):**  
  - Inbound NDA → Save → Sign → Share.  
  - Aging Proposals → reminder/bump.  
  - Receipt detected → create expense doc → file to Accounts.

Mono assists with design and explanation, but users approve and enable. No fully autonomous “run wild” automations.

### 6.5 Share Hub — External Surface

- Share Center for secure share links (passwords, expiries, download controls).  
- Smart Share Page so external guests see everything relevant in one place.  
- Basic **Guest Spaces** to cluster related docs and simplify guest access.  
- E-signatures via **Documenso** (with room for other providers later).  

### 6.6 Insights — Brain Telemetry

- Activity Log records all meaningful events:  
  - generate, analyze, save_to_vault, share_link_created, envelope status changes, playbook_run, Mono queries, etc.  
- Dashboards show:  
  - Time saved (Playbooks, Mono actions).  
  - Bottlenecks (stalled docs, long approval chains).  
  - Share/sign performance and risk hotspots.  
- Export to CSV/PDF and (later) scheduled reports.

### 6.7 Task Hub — Tasks & SLAs (GA+)

- Two-way calendar + tasks sync (Google/Outlook).  
- Tie documents and Playbooks to deadlines and owners.  
- SLAs and simple escalation for Teams tier.

### 6.8 Mono — AI Operator

- Lives in a right-hand pane plus global “Ask Mono” entrypoint.  
- Page-aware with **context chips** (route, selection, filters, doc status).  
- Per module:
  - **Workbench:** analyzes docs, suggests actions, organizes queues.  
  - **Builder:** drafts contracts, clauses, decks; explains risks and changes.  
  - **Vault:** explains status, suggests tags/owners, surfaces gaps.  
  - **Playbooks:** helps design and explain triggers/conditions/actions.  
  - **Share Hub:** suggests permissions/protections and next steps.  
  - **Insights/Activity:** explains what the audit trail is telling you.

Mono is a **copilot**, not an autonomous agent:
- It **proposes** drafts and optimizations.  
- You **approve** changes to Playbooks, permissions, and critical workflows.

---

## 7. Storage, Import & Plan Caps

### 7.1 Storage & Metering

- Meter by **Vault storage (GB) only**. External docs are references and don’t count.  
- Heavy media should stay as references where possible.  
- Per-file size caps:
  - Free: **25 MB**  
  - Starter: **100 MB**  
  - Pro: **250 MB**  
  - Team: **500 MB**

### 7.2 Import Windows

- Default import window = **YTD**.  
- Presets: **12m / 36m / custom**, with progressive backfill on demand.  
- Goal: avoid importing 10k low-value docs and blowing up Vault or UX on day one.

### 7.3 Email & Receipts

- Email/receipts are parsed into lightweight records.  
- Attachments are stored as Vault files **only when the user chooses** (“Save to Vault”).  
- Keeps storage cheap and the Vault clean.

---

## 8. Integrations (GA Direction)

**Storage & Docs**  
- Google Drive, OneDrive, Box, Dropbox.  
- Google Docs/Sheets/Slides; Microsoft 365; Canva (RO); Adobe (RO).

**Email**  
- Gmail and Outlook — **multi-account** per workspace.

**Comms/PM/CRM**  
- Slack, Notion, Asana, Trello, ClickUp.  
- Salesforce/HubSpot files (RO).

**Legal & Sign**  
- Documenso (primary sign provider).  
- DocuSign / Adobe Sign (RO surfacing of envelopes/status).

**Finance**  
- QuickBooks/Xero exports (RO).  
- Long-term: map receipts and docs to accounting entries via Accounts Studio.

---

## 9. Pricing & Plans

Pricing is designed so **Free drives virality**, and paid plans buy more docs, more automations, more AI, and more history.

- **Free** – $0  
  - 100 MB Vault  
  - 30 AI actions / month  
  - 10 share links  
  - 5 signatures / month  
  - 2 built-in Playbooks/week, 1 rebuild/week  
  - Limited Activity history

- **Starter** – $30/seat/month  
  - 2 GB Vault  
  - 300 AI actions / month  
  - 50 share links  
  - 50 signatures / month  

- **Pro** – $60/seat/month  
  - 10 GB Vault  
  - 2,000 AI actions / month  
  - 200 share links  
  - 300 signatures / month  

- **Team** – $200/month for 3 seats (+$50/additional seat)  
  - 100 GB pooled Vault  
  - 10,000 AI actions / month  
  - 1,000 share links  
  - 1,000 signatures / month  

**Annual**: ~20% discount.

Upgrade nudges kick in around **80% of limits** (storage, AI actions, links, signatures).

---

## 10. 18-Week Delivery Plan (W1 → W18)

**Beta target:** end of **Week 6** (hit).  
**GA window:** **Weeks 14–18** (final polish + launch ops).

High-level week focus:

- **W1 – Repo & Auth Foundations**  
  - Next.js app, Supabase auth, base layout, healthcheck. ✅

- **W2 – Vault & Builder v0**  
  - Vault schema, basic doc model, first contract templates & generation. ✅

- **W3 – Generate → Save → Share v0**  
  - Builder → Vault → Share flow, Documenso POC, initial ActivityLog. ✅

- **W4 – Wiring & Telemetry**  
  - Single Analyze path, ActivityLog events, debug routes, error handling. ✅

- **W5 – New UI + Mono + Nav**  
  - Bolt UI migrated; Mono pane on core pages; shells for Playbooks/Share/Activity. ✅

- **W6 – Beta Hardening & Release**  
  - Feature flags; onboarding doc; closed beta; fixes from feedback. ✅

- **W7 – Playbooks Engine v1**  
  - Deterministic engine (Triggers/Conditions/Actions/Wait/Retry), seed library, logs/undo, dry-run guardrails.

- **W8 – Insights & Activity v1**  
  - Filters, simple dashboards (time saved, bottlenecks), CSV/PDF export; tie to ActivityLog.

- **W9 – Connectors v1**  
  - Harden Drive; optional Gmail import; connector error states & backoff.

- **W10 – Share Hub & Guest Spaces v1**  
  - Smart Share Page (un/branded by plan), basic Guest Spaces; link management polish.

- **W11 – Builder Expansion**  
  - Studios scaffolds for Decks & Accounts; bundle flows (hire packet, board pack).

- **W12 – Playbooks v2 & Automation UX**  
  - Better editor; more triggers/actions; Mono-assisted playbook design.

- **W13 – Pricing & Plan Caps**  
  - Enforce plan-based limits (docs, AI actions, links, signatures, GB storage) with 80% nudges.

- **W14 – Onboarding & Stability**  
  - Setup flows, in-app tours, error UX, performance tuning; GA dress rehearsal.

- **W15 – Federated Search GA**  
  - Keyword across connectors; Saved Views; semantic/full-text on Vault only.

- **W16 – Task Hub (Two-Way)**  
  - Google/Outlook two-way calendar & tasks; SLAs for Teams.

- **W17 – Governance & Storage UI**  
  - Branding/allowlists; retention (Teams); GB metering UI (Vault bytes only).

- **W18 – GA Ops & Launch**  
  - Perf polish, a11y AA, security, docs; pricing/caps enforcement; launch ops.

---

## 11. Telemetry & KPIs

### 11.1 KPIs

- **Activation**  
  - Connect ≥1 integration **and** run ≥1 Playbook in first 7 days.

- **Time-to-Value**  
  - Minutes to first “Saved to Vault” doc and first signature sent.

- **Weekly Active Workspaces**  
  - ≥3 meaningful actions/week (generate, share, sign, playbook run, etc.).

- **Automation Impact**  
  - Time saved via Playbooks and Mono (per workspace).  
  - Signature conversion rate.  
  - Share link engagement.

- **Upgrade Triggers**  
  - Users hitting 80% of storage, AI actions, links, signatures.

### 11.2 Telemetry (PostHog Event IDs)

- workbench_view  
- search_federated_query  
- import_started / import_completed  
- vault_doc_created  
- version_pruned  
- ai_analyze_completed  
- builder_generate  
- share_link_created  
- guest_signup  
- envelope_status_changed  
- playbook_run  
- storage_warning_shown  
- upgrade_nudge_clicked  

Coverage target: **≥95%** of key flows by GA.

---

## 12. Non-Goals (Next 12–18 Months)

- No heavy enterprise ECM/DMS bloat.  
- No generic “chat-over-everything” agent that quietly rewires workflows.  
- No wiki / knowledge base focus; we care about **docs that move money or risk**  
  (contracts, proposals, board packs, investor updates, statements).  
- No marketplace sprawl before core flows are rock-solid.

---

## 13. Definition of Done (GA) vs Win

### 13.1 Definition of Done (Product/Engineering)

By GA:

- All GA nav routes live and stable: Dashboard, Workbench, Builder, Vault, Playbooks, Share Hub, Integrations, Insights, Task Hub, Settings.  
- Playbooks and Guest Spaces production-ready with guardrails (dry-run, logs, undo).  
- Vault GB metering and per-file limits enforced **with visible UI**.  
- ClauseGraph and Decks/Accounts exports stable.  
- Telemetry coverage ≥95%, alerting wired.  
- Runbooks in place:  
  - Incident response  
  - Data export/delete  
  - Support SLAs

### 13.2 Definition of “Win” for This Phase (Customer/Market)

By the end of this 18-week cycle:

- **5–10 active teams** using Monolyth weekly for real contract/proposal/deck flows.  
- At least **2–3 workflows** where Playbooks + Mono clearly save **hours per week**.  
- Clear usage patterns that justify going deeper on:
  - Playbooks (automation)  
  - Share Hub / Guest Spaces (external workflows)  
  - or both.

If founders and small teams can honestly say:

> “I finally know what’s happening across all my docs,  
> and I don’t have to search other apps or chase people for next steps,”

then this North Star is on track.

