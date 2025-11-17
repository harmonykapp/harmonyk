# Monolyth — North Star (SSOT)  
**Version:** 2025-11-16 • **Owner:** Adam • **Tagline:** *All your docs. One brain.*  
**Positioning:** Document-first business task organizer with **Mono**, your AI operator.  
**Promise:** Find → Act → Automate → Store — across Drive/Inbox/Chat/Sign — in one app.

---

## 1) The Why (brutal reality)
- People drown in docs, email, chats, and signature tools. They can’t find, decide, or move.
- Suite copilots help **inside** a suite, not **across** suites. Search tools find but don’t act.
- Monolyth solves the whole loop with a **single Workbench**, **AI triage**, and **Playbooks** that actually do work.

---

## 2) Product North Star
**Make non-trivial document work complete itself.**  
- **Mono** flags what matters, then **executes** Playbooks (e.g., Inbound NDA → Save→Sign→Share).  
- **Guest Spaces** turn every share into a viral on-ramp.  
- **Vault** becomes the truth (versioning, lineage, dedupe, search that cites sources).

**10-minute aha (day-1):**
1) Connect Google.  
2) Mono surfaces: “3 unsigned NDAs, 9 stale proposals, 2 risky links. Fix all?”  
3) Run Playbook → files organized, envelopes sent, links patched, Ops Brief generated.

---

## 3) Strategy (approved)
1) **Integrate broadly** (metadata-first; no background content fetch).  
2) **Show value** in Workbench (status + import on demand).  
3) **Migrate**: one-click **Rebuild in Monolyth** → our **Builders** (Contracts now; Decks/Statements at GA).  
4) **Automate** with **Playbooks** (Flow renamed).  
5) **Grow virally** via **Guest Spaces + Smart Share Page** (AI brief teaser → CTA to Free).

---

## 4) Scope by Milestone
### Beta (end of Week 6)
- **Mono (lite)**: per-item Analyze (summary, entities, dates, nextAction); inline tips; one-click actions.
- **Workbench**: unified items (Gmail, Google Drive, Slack, Notion; + Outlook/OneDrive if ready); **Import** on demand; bulk Save/Share/Send.
- **Builder (Contracts)**: prompt → templates/clauses → **Version 1** → Save to **Vault** (15 templates).
- **Vault**: Google Drive app-folder RW; version history.
- **Share Center**: links (passcode, watermark, revoke) + basic analytics.
- **Signatures**: Documenso send (order, reminders); webhook → CSV/PDF audit into Vault; **Insights** timeline + CSV/PDF.
- **Search**: metadata filters + Vault keyword.
- **Calendar/Tasks Lite**: local view + reminders.
- **Perf/Obs**: Workbench p50 <1.5s; preview <1.0s; PostHog/Sentry.
- **Security**: least-privilege scopes; **no background content ingestion**.

### GA (end of Week 15)
- **Mono (full)**: batch triage; cross-signals (expiring links, pending sigs, meetings); **Autopilot Playbooks**; NL commands.
- **Playbooks Library** (`/playbooks`, alias of `/flow`): Suggested/My/Org; Run/Schedule/Edit/Logs; dry-run + Undo.
- **Builders**: Contracts + **Decks** + **Statements**; 45+ templates; redlining; custom prompts; team libraries.
- **Search**: **Federated keyword across connectors** + AI re-rank; **Vault semantic/full-text** with citations.
- **Vault**: version diff; AI-guided foldering; retention rules (Teams); **bulk import**; **semantic dedupe** + lineage.
- **Share & Growth**: **Guest Spaces** (View/Comment/Fill&Sign/Limited Edit), passcode/expiry/watermark; **Smart Share Page** (AI brief teaser + CTA to Free); advanced link analytics.
- **E-sig RO**: DocuSign/Adobe/Dropbox Sign status + executed PDFs in Workbench/Vault (sending stays on Documenso).
- **Connectors (30–40)**: Google Workspace; Microsoft 365 (Outlook/OneDrive/**SharePoint/Teams**); Slack; Notion; **Box**; **Dropbox**; **Confluence/Jira**; **Asana/Trello/ClickUp**; **Canva (export RO)**; **Salesforce/HubSpot files RO**; **QuickBooks/Xero exports RO**; Google/Outlook Calendar.  
  *Multi-account; **scheduled metadata refresh** (no background content ingestion).*
- **Calendar/Tasks**: Starter = RO import; **Pro = two-way sync & AI due dates**; **Teams = org boards & SLAs**.
- **Extensions**: Chrome Save+Brief; Gmail/Outlook add-ins (Save/Analyze/Send).
- **Onboarding**: 3-step wizard (connect → choose 2 Playbooks → *Run now*) + Win Screen.
- **Compliance/Perf**: a11y AA; pen test; pricing/caps enforcement.

---

## 5) Pricing (unchanged) + Free plan tuned for virality
- **Free** (1 seat) • **Starter** $30/seat/mo • **Pro** $60/seat/mo • **Teams** $200/mo (3 seats incl.) + $50/extra seat • **−20% annual**.
- **Free plan levers**:  
  - Guest Spaces ON (counts to owner’s caps).  
  - Smart Share Page + AI brief **teaser**; CTA to Free.  
  - 2 **built-in** Playbooks/week (manual; ≤5 items/run).  
  - 1 **Rebuild in Monolyth**/week (watermarked).  
  - 10 active links; 30 AI analyses/mo; 2 sources; Vault keyword only; Monolyth branding.  
- **Gates**: Federated search (Starter+). Semantic/full-text + batch triage (Pro+). Custom Playbooks (Starter 1; Pro/Teams unlimited). Multi-account, scheduled refresh, remove branding (Pro/Teams). Governance/retention (Teams).

---

## 6) Routes & Naming
- **Routes:** `/dashboard · /workbench · /playbooks · /vault · /share · /signatures · /integrations · /insights · /settings · /billing`  
  *(Playbooks was Flow; keep `/flow` route for compatibility, alias `/playbooks`.)*
- **Auth:** Email magic link + Google SSO (no wallets pre-GA).
- **Tables (Supabase):** User, Org, Member, SourceAccount, UnifiedItem, AttachmentLink, Document, Version, ShareLink, Envelope, ActivityLog, Template, Clause, BillingPlan, Invoice.
- **Key events (PostHog):** `ai_analyze_completed`, `builder_generate`, `version_saved`, `share_link_created`, `envelope_status_changed`, `guest_view`, `guest_sign`, `playbook_run`, `search_federated_query`.

---

## 7) Guardrails (non-negotiable)
- **Metadata-first ingestion**; fetch **file content only** on Preview / Save-to-Vault / Send-for-Signature.  
- **Vault is the only semantic index.** Providers remain federated **keyword** search.  
- Every AI action is **logged and undoable**; show **“Why this?”** with signals (who/what/when).  
- **Guest tokens**: doc-scoped, TTL 7–14d, watermark, optional passcode; rate-limited; audit all actions.  
- **Privacy**: Opt-in **Learning Library** (org + per-doc consent); PII scrubbing; hashed IDs; never shared externally.

---

## 8) KPIs (prove PMF)
- **TTV < 10 min** to first Playbook run.  
- **Mono action rate ≥ 25%** by week 2.  
- **Guest → Free = 5–10%**.  
- **Search success ≥ 70%** on first query (Vault + federated).  
- **Time-to-sign −30–50%** vs baseline for NDAs/proposals.

---

## 9) “Holy-shit” workflows (ship and demo)
1) **Inbound NDA → Save→Sign→Share** in <30s (AI brief, watermark, audit).  
2) **Aging proposals → nudge + schedule follow-up**, tracked in Calendar.  
3) **Risky links** (public/expiring) → fix/kill in one click.  
4) **Weekly Ops Brief** auto-generated from last 7 days.

---

## 10) 15-Week Plan (at a glance)
- **W1–W3:** Scaffold, ingest, **Analyze**, Contracts Builder MVP, Documenso audit, Insights.  
- **W4–W6:** Calendar Lite, errors/caps, perf polish, **Beta freeze & testers**.  
- **W7–W9:** **Federated search**, RO e-sig, Box/Confluence/Asana/Trello/ClickUp, SharePoint/Teams/Dropbox, Saved Views.  
- **W10–W11:** Builders to 45+ templates; **Mono full + Playbooks Library** (nav appears).  
- **W12–W13:** Two-way calendar, Insights cohorts/reports; Vault diff/foldering/retention; **semantic dedupe + lineage**.  
- **W14:** **Guest Spaces + Smart Share Page**, Chrome/Gmail/Outlook extensions.  
- **W15:** GA hardening, flags freeze, security, tours, launch.

---

## 11) Risks & Mitigations
- **API/rate limits:** cache metadata; progressive import; backoff; connector watchlist.  
- **Latency:** stream responses; precompute only cheap signals; p50 search <1.5s.  
- **Permission fatigue:** minimal scopes; per-action pulls; explicit “no background fetch” pledge.  
- **Over-promising AI:** guardrails + dry-run/undo; cite sources; clear limits.

---

## 12) Decisions Log (snapshot)
- **DEC-20251029-ROUTES-V1** — Routes & naming — **APPROVED**  
- **DEC-20251029-AUTH-V1** — Email magic link + Google SSO pre-GA — **APPROVED**  
- **DEC-20251029-BUILDER-STUDIOS-V1** — Studios (Contracts/Decks/Statements) — **APPROVED** (Decks/Statements at GA)  
- **DEC-20251116-PLAYBOOKS-NAV-V1** — Flow → **Playbooks**; nav between Workbench and Vault — **APPROVED**  
- **DEC-20251116-SHARE-GUEST-V1** — **Guest Spaces** + Smart Share Page + Free upsell — **APPROVED**

---

## 13) Demo Path (must always work)
**Connect sources → Workbench shows mixed items → pick email attachment → Save to Vault → Send for Signature → see events in Insights → share with Guest → guest signs → recipient upsell to Free.**

---

## 14) Out of Scope (pre-GA)
- Wallet auth/linking; on-chain logs.  
- Box write; SharePoint write; arbitrary background content crawls.  
- Full desktop sync.  
- Anything that violates guardrails above.

---

## 15) Glossary
- **Guest Space:** No-signup, link-scoped workspace (View/Comment/Fill&Sign/Limited Edit).  
- **Playbook:** Multi-step, AI-assisted routine (manual/scheduled/event).  
- **Vault:** App-folder storage + metadata; only place we build embeddings.  
- **Federated search:** Keyword across external providers (no embeddings).  
- **Semantic search:** Embeddings over **Vaulted** docs only.

---

## 16) Appendix: Plan gates by tier (GA)
- **Free:** 2 sources, Vault keyword only, 10 links, 30 AI analyses/mo, 2 built-in Playbooks/week (manual), 1 watermarked rebuild/week.  
- **Starter ($30):** 5 sources, **federated search**, 1 custom Playbook (+schedule), basic multi-account, remove branding, share analytics basic.  
- **Pro ($60):** 10 sources, multi-account + scheduled metadata refresh, **semantic/full-text**, batch triage, unlimited Playbooks, two-way calendar, Chrome/Gmail/Outlook extensions, advanced link analytics.  
- **Teams ($200 incl. 3 seats):** 20 pooled sources, org Playbooks/permissions, retention rules, governance, SLAs, scheduled reports.

---
