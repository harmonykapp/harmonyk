# Monolyth — North Star (Internal, GA-only)

**SSOT for scope, guardrails, routes, and milestones.**  
Audience: internal team + Cursor.  
Version: 2025-11-13

---

## What Monolyth Is
A unified “single pane of glass” for working documents: draft, review, share, sign, and track in one place.

### GA Promise
- Draft business/legal documents with lightweight, reliable AI assist.
- Keep files organized in Vault with versions + minimal metadata.
- Share securely (passcode, watermark) and track engagement.
- Send for e-signature via Documenso.
- See essentials fast: recent files, triage badges, brief summaries.

### Post-GA Direction (not in GA)
- Deck Builder for pitch decks (PPTX/PDF) with templates + AI copy.
- Financial/Reports Builder for spreadsheets (XLSX/CSV) + narrative summaries/charts.
- Rich search; deeper intelligence; more storage/identity providers.

---

## GA Scope

### Modules
1. **Dashboard** – recent activity, “what changed” summaries.  
2. **Workbench** – unified recent list (Drive/Gmail RO), triage badges, short summaries.  
3. **Builder (Contracts Basic)** – template → form → preview → save to Vault.  
4. **Vault** – list, simple filters, versions, actions (share, download, delete).  
5. **Share Center** – public link, optional passcode/watermark; track views/scroll.  
6. **Signatures** – Documenso create/send/manage.  
7. **Insights (Lite)** – CSV/PDF export of share views, signer status, simple counts.  
8. **Calendar & Tasks (Lite)** – read upcoming dates/reminders (no deep editing).  
9. **Integrations Hub** – connect Gmail (RO), Google Drive (RW app-folder + RO recent), Documenso; show status.  
10. **Settings** – profile, org name/logo, telemetry opt-out, legal pages.  
11. **Billing shell** – present but nonfunctional.

### Integrations (GA)
- **Google Drive**: App-folder RW; external “Recent” RO in Workbench.  
- **Gmail**: RO “Recent” signals into Workbench; no send.  
- **Documenso**: e-signature create/send/manage.

### Auth
- Email magic link + Google login.  
- Org → users with simple roles (owner, editor, viewer).

### Telemetry
- **PostHog**: `view_open`, `share_open`, `scroll_33/66/95`, `sign_send`, `sign_complete`.  
- **Sentry**: client + server error capture.

---

## Non-Goals (GA)
- No pricing.    
- No full-text content search.  
- No Box/Dropbox write; Outlook/OneDrive write is post-GA.  
- No Deck/Financial Builders (direction only).  
- No complex approvals beyond basic sign order.

---

## Routes (Authoritative)
- / -> Landing (signed-in: Dashboard)
- /workbench -> Recent signals + triage + summaries
- /builder -> Template picker → form → preview → save
- /builder/draft -> Optional isolated draft
- /vault -> Library with versions + actions
- /share/[id] -> Public viewer (passcode, watermark, scroll tracking)
- /signatures -> Documenso sender + status
- /insights -> Lite exports (CSV/PDF)
- /integrations -> Connectors (Drive, Gmail, Documenso)
- /calendar -> Lite read-view of dates & reminders
- /tasks -> Lite checklist/reminders
- /settings -> Profile, org, telemetry
- /billing -> Shell only


---

## Architecture (High-Level)
- Next.js (App Router) + TypeScript + React 19  
- shadcn/ui for UI primitives  
- Server Actions for mutations; RSC for data where useful  
- Adapters:
  - `lib/storage/GoogleDriveAdapter.ts`
  - `lib/signing/DocumensoAdapter.ts`
  - `lib/connectors/GmailAdapter.ts` (RO)
  - `lib/audit/AuditLog.ts`
- DB: orgs, users, documents, versions, shares, signatures, events.

---

## Data Model (Minimum)
- **Organization**: id, name, domain, created_at  
- **User**: id, org_id, email, role, created_at  
- **Document**: id, org_id, title, kind(`contract|pdf|pptx|xlsx|other`), source(`builder|upload|drive`), drive_file_id?, latest_version_id, created_by, created_at  
- **Version**: id, document_id, number, bytes, mime, checksum, created_at  
- **Share**: id, document_id, passcode_required, watermark, views_count, created_by, created_at  
- **ShareEvent**: id, share_id, kind(`open|scroll_33|scroll_66|scroll_95`), ts, ip_hash  
- **Signature**: id, document_id, provider(`documenso`), status, recipients[], created_at

PII minimal; hash sensitive telemetry; never log raw IP.

---

## Acceptance Criteria
- `npm run lint` → 0 errors.  
- `npm run build` → passes.  
- Smoke path: sign in → Builder → Preview → Save to Vault → Share → View → Send for signature → track status.  
- Performance (target): LCP < 2.5s typical; Workbench initial fetch ≤ ~500ms (mock OK early).

---

## Milestones
- **Week 2 (Day 6–7)**: Cursor adheres to this file. Workbench/Builder/Share stable. Documenso flow verified.
- **Weeks 3–4**: Vault versions, Share passcode/watermark polish, Insights Lite export, Calendar/Tasks Lite.
- **Gate to GA**: Smoke path green, Sentry P0 clean, telemetry dashboard shows core events.

---

## Post-GA (Directional Only)
- Deck Builder (slides + brand kit).
- Financial/Reports Builder (tables/charts + narrative; Sheets/Excel export).
- Semantic search & recs; more integrations; lightweight approvals.
