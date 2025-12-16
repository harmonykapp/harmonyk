# Harmonyk — GA (20-week, frozen) — Full Product Spec — v2025-11-28 rev C

| Area | What ships at GA | Notes / Guardrails |
|---|---|---|
| **Audience & Stack** | Early-stage founders on **Google Workspace**. | Google-first; others "Coming Soon." |
| **Navigation** | **Dashboard · Workbench · Builder · Vault · Playbooks · Share · Integrations · Insights · Settings** | Builder tabs: **Contracts · Decks · Accounts**. |
| **Contracts Builder (Hero)** | **≈45 canonical templates** across 3 categories (Operational & HR; Corporate & Finance; Commercial & Dealmaking). **Clause editor**, **ClauseGraph v1** (grouped list + variants), **compare/diff**, **send for signature**, **status pipeline** (`draft → in_review → approved → signed → active → expired`). | Single canonical per type; alts visible to Mono via RAG. |
| **Mono in Contracts** | **Explain clause** (with "Why this?"), **suggest standard terms**, **compare drafts** (risk-oriented deltas). | Human-in-the-loop; never auto-applies. |
| **Decks Builder (B+)** | **Fundraising Deck** & **Investor Update Deck**. AI outline → **Slides/PDF** via Google APIs. Mono rewrites; RAG pulls latest metrics from Vault/Vaulted CSVs. | Two flows only at GA. |
| **Accounts Builder (rev GA)** | **Flows:** 1) **SaaS Financial Pack**, 2) **Investor Snapshot**, 3) **Cash Runway Planner**, 4) **KPI Notebook**. **Inputs:** CSV upload + manual fields (Sheets live pull post-GA). **Features:** metric dictionary (MRR/ARR, churn, CAC/LTV, burn, runway), validation checks, monthly/quarterly presets, **scenario toggles (best/base/worst)**, charts, one-click **"Push to Deck"** blocks. | GA remains **CSV/manual** only; no QuickBooks/Xero, no live Sheets. |
| **Workbench** | Cards: **Recent Activity**, **Open Tasks**, **Active Deals & Rounds**; quick actions (New Contract/Deck/Accounts, Resume Drafts, Analyze, Send for Signature); page-aware Mono side panel. | Home screen. |
| **Vault** | Builder outputs + explicit Google imports (Drive files, Gmail attachments/links). Metadata: **type, parties, dates (signed/effective/renewal), amounts, status, links, Deal/Round tag**. **Version history + diffs** (contracts). | **RAG source**; external Google items are keyword-indexed refs. |
| **Search** | **Semantic search over Vault**; Drive/Gmail refs remain keyword-searchable. | Vault-only semantics. |
| **Tasks (internal)** | First-class tasks (title, due, status, linked docs/deal tags). Created by Playbooks or manually. In-app + email reminders. | No external task/calendar sync at GA. |
| **Playbooks v1 (built-ins)** | Deterministic; read Vault/Activity/limited RAG; actions: create/update tasks, send basic emails. Built-ins: **Contract Signed → Renewal Task**, **Fundraising Deck → Outreach Task**, **Investor Snapshot → Update Task**, **Runway < X months → Alert Task**. | Simulate/dry-run + confirm before apply (W16). |
| **Share & Sign** | Secure share links (password/expiry/watermark); **Documenso** send; track **sent/viewed/signed**; follow-ups via Playbooks/Tasks. | Full audit entries. |
| **Integrations (GA)** | **Google Drive** (selected folders) + **Gmail** (attachments/links) → **Vault** → **RAG**. | All others post-GA. |
| **AI & Vendors** | **OpenAI only**; Google APIs for Slides/PDF. **Mono Memory** (tone/risk/jurisdiction/locale) per request. Template usage telemetry recorded (UI later). | Explainability + Undo everywhere. |
| **RAG** | Chunk/embed **Vaulted** docs + selected Google imports; grounds contract suggestions, deck narratives, snapshot checks. | No embeddings on external refs by default. |
| **Import Policy & Storage** | Default **YTD** horizon (12/36m/custom). **Copy-to-Vault is explicit** with **GB impact**; heavy media = **reference-only**. | Metadata-first ingestion. |
| **Metering & Caps** | **Vault GB** metering; **per-file caps**; version diffs; nudges at thresholds; clear paywall copy (W18). | Transparent meters. |
| **Insights** | Activity timeline; lean dashboards (sent/viewed/signed, tasks due/completed, decks created/sent); CSV export; weekly summary email (time-permitting). | Deep analytics post-GA. |
| **Security** | Least-privilege Google scopes; org-scoped RLS; watermark/redaction; full audit; "Why this?"; **security pass + runbooks**. | GA blocker. |
| **KPIs (L+90d)** | Time-to-first Save/Sign; connect Google + ≥1 Playbook in 7d; WAU workspaces; task follow-through; Signed→Renewal automation; upgrades at ≥80% caps. | Telemetry ≥95% critical paths. |
| **Delivery (W12–W20)** | W12–13 Contracts GA; W14 Decks v1; **W15 Accounts v1 (rev)**; W16 Playbooks GA + Tasks v1.5 + Workbench Cards + Vault Diff UI; W17 hardening; W18 pricing/caps; W19 onboarding/docs; W20 launch + telemetry. | W1–11 done; scope freeze holds. |
