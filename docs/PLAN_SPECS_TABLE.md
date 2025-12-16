# Plan & Specs Table — Navigation & Modules

This document tracks the status of each navigation item and module at Week 5, and what's planned for GA.

## Navigation Items

| Module | Week 5 Status | GA Plan |
|--------|---------------|---------|
| **Dashboard** | ✅ Shell + summary cards + recent activity | Enhanced insights, personalized widgets, quick actions |
| **Workbench** | ✅ Unified table + Analyze + Save to Vault + ActivityLog | Advanced filters, bulk actions, custom views |
| **Builder** | ✅ Template selection + generation + Save to Vault + ActivityLog | Decks, statements, bundles, multi-version management |
| **Playbooks** | ⏳ Shell + typed mock data + empty state | Real automation engine, triggers, conditions, actions, scheduling |
| **Vault** | ✅ Document table + versions + search/filter + links to Builder | Advanced organization, tags, folders, semantic search |
| **Share** | ⏳ Shell + typed mock data + empty state | Real link creation/revoke, passcode/watermark enforcement, Guest Spaces |
| **Signatures** | ⏳ UI shell exists | Documenso integration, envelope management, webhook handling |
| **Integrations** | ⏳ UI shell exists | Google Drive read/write, Gmail, Notion, other connectors |
| **Insights** | ⏳ UI shell exists | Time saved metrics, bottlenecks, risky docs/workflows, analytics dashboards |
| **Activity** | ✅ Real ActivityLog data + filters + links + summary cards | Advanced analytics, export, custom event types, alerts |
| **Calendar** | ⏳ UI shell exists | Document deadlines, signature reminders, playbook schedules |
| **Tasks** | ⏳ UI shell exists | Task management, document-related todos, workflow assignments |
| **Settings** | ✅ Settings UI + Billing sub-page | Team management, billing, integrations, preferences |

## Module Details

### Dashboard
- **Week 5**: Summary cards (Docs in Motion, Pending Signatures, Recent Imports, Action Required), recent activity list, active deals, Maestro entry point
- **GA**: Personalized widgets, AI-powered insights, quick action shortcuts, customizable layout

### Workbench
- **Week 5**: Unified table view, Analyze functionality, Save to Vault, source/status filters, ActivityLog integration
- **GA**: Advanced filters (tags, dates, owners), bulk actions, custom views, saved searches, export

### Builder
- **Week 5**: Template selection, clause library, document generation (V1 contracts), Save to Vault, ActivityLog integration
- **GA**: Decks, statements, bundles ("new hire packet", "fundraising packet"), multi-version management, collaboration

### Playbooks
- **Week 5**: UI shell with typed mock data, empty state, table view with status badges
- **GA**: Real automation engine (triggers + conditions + actions), prebuilt recipes, scheduling, execution logs

### Vault
- **Week 5**: Document table with version counts, search/filter, links to Builder, documents appear after Save to Vault
- **GA**: Advanced organization (tags, folders), semantic search, document relationships, archive/restore

### Share
- **Week 5**: UI shell with typed mock data, empty state, table view with permissions/protection/stats
- **GA**: Real link creation/revoke, passcode/watermark enforcement, expiry management, Guest Spaces, Smart Share Page

### Signatures
- **Week 5**: UI shell exists, placeholder content
- **GA**: Documenso integration, envelope creation/management, webhook handling, status tracking, reminders

### Integrations
- **Week 5**: UI shell exists, basic Google Drive wiring
- **GA**: Google Drive read/write, Gmail, Notion, other connectors, OAuth management, sync status

### Insights
- **Week 5**: UI shell exists, placeholder content
- **GA**: Time saved metrics, bottlenecks identification, risky docs/workflows detection, analytics dashboards, reports

### Activity
- **Week 5**: Real ActivityLog data, type/date filters, summary cards, clickable document links, empty state
- **GA**: Advanced analytics, export (CSV/JSON), custom event types, alerts, activity patterns, user behavior insights

### Calendar
- **Week 5**: UI shell exists, placeholder content
- **GA**: Document deadlines, signature reminders, playbook schedules, integration with external calendars

### Tasks
- **Week 5**: UI shell exists, placeholder content
- **GA**: Task management, document-related todos, workflow assignments, due dates, priorities

### Settings
- **Week 5**: Settings UI with tabs (General, Team, Integrations, Billing), Billing sub-page integrated
- **GA**: Team management (invites, roles, permissions), billing (plans, usage, invoices), integrations (OAuth, API keys), preferences (notifications, defaults)

## Status Legend

- ✅ **Implemented**: Feature is live and functional
- ⏳ **In Progress**: UI shell exists, backend/data layer pending
- ❌ **Not Started**: Not yet implemented

## Golden Path Status

**Week 5**: ✅ Workbench → Analyze → Builder → Save to Vault → Activity  
**GA**: ✅ Workbench → Analyze → Builder → Save to Vault → Share → Sign → Activity

