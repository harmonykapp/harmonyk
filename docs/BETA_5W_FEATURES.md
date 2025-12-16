# Beta 5W Features — Week 5 Status

This document lists the actual features implemented at the end of Week 5, and explicitly calls out what is **not** in Beta yet.

## ✅ Implemented (Week 5)

### Authentication
- Magic link authentication (Supabase Auth)
- Google OAuth (if configured)
- Session management via cookies
- Route-level auth helpers (`getRouteAuthContext`)

### Workbench
- Unified table view across documents
- Analyze functionality (AI analysis of documents)
- Save to Vault from Workbench
- ActivityLog integration (analyze_completed events)
- Source filtering (Drive, Gmail, etc.)
- Status filtering (signing status, etc.)

### Builder
- Template selection and categorization
- Clause library integration
- Document generation (V1 contracts)
- Save to Vault from Builder
- ActivityLog integration (doc_generated events)
- Draft management UI

### Vault
- Document table with version counts
- Filter by owner/org
- Search functionality
- Links to Builder for editing
- Documents appear after Save to Vault

### Activity Log
- Event types tracked:
  - `analyze_completed` (from Workbench Analyze)
  - `doc_generated` (from Builder)
  - `doc_saved_to_vault` (from Save to Vault)
  - `mono_query` (from Maestro pane queries)
- Activity page with:
  - Type filter (all, analyze_completed, doc_generated, doc_saved_to_vault)
  - Date range filter (24h, 7d, 30d)
  - Clickable links to documents/workbench items
  - Summary cards (Today's Activity, Active Users, Documents Touched)

### Playbooks
- UI shell with typed view models
- Mock data (4 example playbooks)
- Empty state with CTAs
- Table view with status badges
- Maestro entry point

### Share
- UI shell with typed view models
- Mock data (4 example share links)
- Empty state with CTA
- Table view with permissions, protection, stats
- Maestro entry point

### Maestro (AI Operator)
- Maestro pane mounted on all core pages (Dashboard, Workbench, Builder, Vault, Playbooks, Share, Activity)
- Context-aware (route, selectedDocumentId, selectedUnifiedItemId, filters)
- `/api/mono` backend route with:
  - Authentication via `getRouteAuthContext`
  - ActivityLog integration (mono_query events)
  - Stubbed responses (ready for OpenAI integration)
- Quick actions per page context

### UI Shell
- Sidebar navigation with active route highlighting
- TopBar with search, theme toggle, user menu
- Maestro pane (slide-in from right)
- Consistent spacing and layout (`p-8 max-w-[1600px] mx-auto`)
- Dark/light theme support
- Responsive design

## ⏳ Not in Beta Yet (Explicitly Out of Scope)

### Playbooks Engine
- Real automation engine (triggers + conditions + actions)
- Prebuilt recipes for NDAs/proposals
- Playbook execution and scheduling
- **Status**: UI shell exists, engine implementation pending

### Share Link Management
- Real share link creation/revoke
- Passcode generation and validation
- Watermark application
- Expiry enforcement
- **Status**: UI shell exists, backend implementation pending

### Guest Spaces
- External guest accounts
- Smart Share Page (aggregated view for guests)
- Guest permissions and access control
- **Status**: Not started

### External Connectors
- Google Drive full integration (read/write)
- Gmail integration
- Other connectors (Notion, etc.)
- **Status**: Base wiring exists for Drive, needs hardening

### Signatures
- Documenso integration
- Envelope creation and management
- Webhook handling for status updates
- **Status**: UI shell exists, integration pending

### Insights Dashboards
- Time saved metrics
- Bottleneck identification
- Risky docs/workflows detection
- **Status**: Not started

### Advanced Maestro Features
- Real OpenAI integration (currently stubbed)
- Cross-page context awareness
- Autonomous workflow suggestions
- **Status**: Stub + logging exists, AI integration pending

## Beta Readiness Checklist

- ✅ Core golden path works: Workbench → Analyze → Builder → Save to Vault
- ✅ ActivityLog tracks key events
- ✅ Maestro pane accessible on all pages
- ⏳ Share link creation/management (UI ready, backend pending)
- ⏳ Signatures integration (UI ready, Documenso pending)
- ⏳ Playbooks engine (UI ready, engine pending)
- ❌ Guest Spaces
- ❌ Insights dashboards
- ❌ Advanced connectors

## Known Limitations

1. **Save-to-Vault owner/org mapping**: Assumptions about owner_id/org_id that may need hardening for multi-org scenarios.
2. **Maestro replies**: Mostly stubbed responses, not yet "smart" across all flows.
3. **Playbooks/Share data**: Using typed mock data, not yet backed by Supabase.
4. **Error states**: Some error handling could be more robust.
5. **Onboarding**: No first-run experience or guided setup yet.

