# Week 13 Summary — Decks Builder v1 (Fundraising & Investor Update)

**Theme:** Decks Builder v1 (Fundraising & Investor Update)  
**Status:** Completed  
**Version:** v0.13.0 (locked for Week 14)

---

## Overview

Week 13 delivered the **Decks Builder v1**, a Maestro-powered document builder for creating investor-facing presentations. The builder supports two deck types (Fundraising and Investor Update), includes outline-first editing, AI-powered content generation, and full integration with Vault and export.

---

## Key Outcomes

- ✅ **Decks Data Model**
  - `deck_type` enum: `'fundraising'` | `'investor_update'`
  - `deck_templates` table with canonical templates
  - `deck_sections` table defining outline structure
  - Initial seeds: 2 canonical templates with 10 and 7 sections respectively

- ✅ **Builder: Decks Tab**
  - Template picker sidebar with canonical templates
  - Outline editor with enable/disable, rename, reorder, and custom section support
  - Company & Round Info form (companyName, stage, roundSize, keyMetrics)
  - Minimum enabled sections enforcement (`MIN_ENABLED_SECTIONS = 5`)

- ✅ **AI Integration**
  - Maestro-powered deck generation via `/api/ai/generate-deck`
  - Single-pass generation for all enabled sections
  - Prompt engineering for deck type, company info, and outline context

- ✅ **Vault Integration**
  - Decks saved as first-class documents with `kind: "deck"`
  - Rich metadata embedded in document content (HTML comment format)
  - Deck badges in Vault UI ("Deck: Fundraising", "Deck: Investor Update")
  - Rehydration: Opening deck from Vault restores Builder state

- ✅ **Export**
  - `/api/decks/[docId]/export` HTML export route
  - Print-friendly HTML with markdown rendering
  - Export actions in Builder and Vault
  - Browser print → PDF support

- ✅ **Telemetry**
  - `deck_generated` event (deck_type, section_count, content_length, has_key_metrics)
  - `deck_saved` event (same metadata)
  - `deck_exported` event (deck_type, doc_id, source)

- ✅ **Playbooks Spec**
  - Conceptual Playbooks documented: "Fundraising Deck → Outreach Tasks" and "Investor Update Deck → Update Distribution Tasks"
  - Metadata structure designed to enable future Playbooks integration

---

## Files Touched

### Schema & Migrations

- `supabase/migrations/202512010900_decks_library_v1.sql`
  - Defines `deck_type` enum
  - Creates `deck_templates` and `deck_sections` tables
  - Seeds 2 canonical templates with sections
  - Indexes and triggers

### API Routes

- `app/api/ai/generate-deck/route.ts`
  - POST endpoint for AI deck generation
  - OpenAI integration with structured prompt
  - JSON response parsing

- `app/api/decks/[docId]/export/route.ts`
  - GET endpoint for HTML export
  - Authentication and ownership verification
  - Markdown to HTML conversion

- `app/api/documents/versions/route.ts`
  - Extended to support `kind: "deck"`
  - Stores deck metadata in document record

### Builder UI

- `app/(protected)/builder/page.tsx`
  - Server-side template loading
  - Passes `deckTemplates` to client
  - Handles `docId` query param for rehydration

- `components/builder/builder-client.tsx`
  - Decks tab implementation (sidebar + main panel)
  - Outline editor with all interactions
  - Company info form
  - AI generation flow
  - Save to Vault flow
  - Export handler
  - Rehydration logic from Vault documents

### Vault Integration

- `app/(protected)/vault/page.tsx`
  - Deck badges in document grid and detail view
  - Export action for deck documents
  - Deck document opening (routes to Builder)

### Telemetry

- `lib/telemetry/builder.ts`
  - Added `deck_generated`, `deck_saved`, `deck_exported` events

### Documentation

- `docs/DECKS_LIBRARY_MODEL.md`
  - Library schema documentation
  - Template and section structure

- `docs/DECKS_PLAYBOOKS_NOTES.md`
  - Playbooks integration specification
  - Future automation flows

- `docs/DECKS_BUILDER_V1.md` (Week 13 Day 7)
  - Architecture and user flow documentation

- `docs/WEEK13_DECKS_BUILDER_V1_SUMMARY.md` (this file)
  - Week 13 summary

---

## Known Limitations / Next Steps

### Intentional Limitations (v1)

1. **Export Layout**
   - Simple HTML export, not slide-perfect
   - No Google Slides integration (planned for Week 14+)
   - Users rely on browser print/PDF

2. **Rehydration Heuristics**
   - Depends on `outline_sections` metadata
   - Manual edits outside builder may not rehydrate correctly

3. **Deck Types**
   - Only two types: Fundraising and Investor Update
   - No sales decks or custom templates (future)

4. **AI Generation**
   - Single-pass generation (no iterative refinement)
   - No section-by-section generation

5. **Outline Editor**
   - Manual reordering (no drag-and-drop)
   - No bulk operations

### Week 14 Assumptions (Accounts Builder)

Decks Builder v1 is **locked and stable**. Week 14 can assume:

- ✅ `kind: "deck"` and deck metadata shape is stable
- ✅ Decks appear in Vault & Workbench consistently
- ✅ Export & re-open from Vault are reliable
- ✅ Deck docs serve as inputs for future Playbooks
- ✅ Metadata fields (`deck_type`, `company_name`, `stage`, `round_size`) are consistent

---

## Day-by-Day Breakdown

### Day 1 — Decks Data Model

- Created migration for `deck_type` enum, `deck_templates`, `deck_sections` tables
- Seeded 2 canonical templates (Fundraising with 10 sections, Investor Update with 7 sections)
- Added `docs/DECKS_LIBRARY_MODEL.md`

### Day 2 — Builder UI Shell

- Wired deck templates into Builder page (server-side loading)
- Built Decks tab sidebar with template picker
- Added main panel with empty state and template summary
- State management for `selectedDeckTemplateId`

### Day 3 — Outline Editor

- Loaded sections for selected template
- Built outline editor UI (enable/disable, rename, reorder)
- Added custom section support (add/delete)
- Enforced `MIN_ENABLED_SECTIONS = 5`
- Fixed reordering bug (React immutability)

### Day 4 — AI Generation

- Added Company & Round Info form
- Implemented `/api/ai/generate-deck` endpoint
- Wired "Generate Deck with Maestro" button
- Built Review Draft area with editable textareas
- Added telemetry for generation

### Day 5 — Save to Vault

- Extended document model to support `kind: "deck"`
- Built deck narrative and metadata helpers
- Implemented "Save Deck to Vault" flow
- Added deck badges and labels in Vault UI
- Implemented rehydration from Vault documents
- Fixed authentication issue in save handler

### Day 6 — Export & Playbooks Spec

- Created `/api/decks/[docId]/export` route
- Added Export button to Builder and Vault
- Added `deck_exported` telemetry
- Created `docs/DECKS_PLAYBOOKS_NOTES.md`
- Fixed export authentication (fetch with credentials)
- Fixed false positive error (window.open handling)

### Day 7 — QA, Docs & Lock

- Full QA sweep (Contracts + Decks regression checks)
- Created `docs/DECKS_BUILDER_V1.md` (architecture & user flow)
- Created `docs/WEEK13_DECKS_BUILDER_V1_SUMMARY.md` (this file)
- Updated `docs/NORTH_STAR.md` to lock Decks v1 spec

---

## Testing Status

### Manual Testing Completed

- ✅ Contracts tab: Templates load, generation/saving works, no regressions
- ✅ Decks tab (Fundraising): Full flow (template → outline → generate → save → export)
- ✅ Decks tab (Investor Update): Full flow verified
- ✅ Vault: Deck badges, export, re-open from Vault
- ✅ Export: HTML export opens in new tab, print/PDF works

### Build & Lint Status

- ✅ `npm run lint` — Passes with no errors
- ✅ `npm run build` — Successful compilation
- ✅ TypeScript checks — All type errors resolved

---

## Summary Statistics

- **Days Completed:** 7/7
- **Files Created:** 6 (1 migration, 2 API routes, 3 docs)
- **Files Modified:** 5 (Builder, Vault, telemetry, documents API, NORTH_STAR)
- **Database Migrations:** 1
- **New Features:** 1 (Decks Builder v1)
- **Documentation Files:** 4
- **Build Status:** ✅ Passing
- **Lint Status:** ✅ Passing

---

## Next Steps (Week 14)

- Accounts Builder v1 (SaaS Pack + Investor Snapshot)
- Build on stable Decks foundation
- Leverage deck metadata for Accounts → Deck workflows (future)

---

**Week 13 completed on:** 2025-12-01  
**Version:** v0.13.0 (locked for Week 14)

