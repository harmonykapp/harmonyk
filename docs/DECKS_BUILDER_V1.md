# Decks Builder v1 — Architecture & User Flow

**Version:** v1 (Week 13)  
**Status:** GA-ready, locked for Week 14 (Accounts Builder)

---

## Overview

Decks Builder v1 is a Maestro-powered document builder for creating investor-facing presentations. It supports two deck types:

- **Fundraising Deck (Seed/Pre-Seed)** — For pitching investors during seed and pre-seed fundraising rounds
- **Investor Update Deck** — For regular updates to existing investors (monthly, quarterly, etc.)

The builder follows an **outline-first** approach:
1. User selects a deck template
2. Customizes the outline (sections, titles, order)
3. Enters company information
4. Maestro generates slide content in one pass
5. User reviews, edits, saves to Vault, and exports

---

## Data Model

### `deck_type` Enum

```sql
public.deck_type:
  - 'fundraising'
  - 'investor_update'
```

The `deck_type` enum categorizes decks by their primary purpose.

### `deck_templates` Table

Canonical templates with metadata:

- `id` — UUID primary key
- `name` — Human-readable name (e.g., "Fundraising Deck (Seed/Pre-Seed)")
- `deck_type` — Enum value (`fundraising` | `investor_update`)
- `is_canonical` — Boolean flag for the recommended template per type
- `description` — Optional description
- `tags` — Array of strings for filtering/search
- `default_outline` — JSONB array of section keys (for reference)

### `deck_sections` Table

Canonical sections that define the outline structure:

- `id` — UUID primary key
- `template_id` — Foreign key to `deck_templates`
- `section_key` — Stable snake_case identifier (e.g., `'problem'`, `'solution'`)
- `title` — Human-readable title (e.g., "Problem", "Executive Summary")
- `order_idx` — Sequential ordering (starting from 1)
- `default_prompt` — Optional prompt template for Maestro to guide generation
- `is_required` — Boolean flag (affects UI validation)

### Deck Document Metadata

When a deck is saved to Vault, metadata is embedded in the document content as an HTML comment:

```html
<!-- MONO_DECK_METADATA:{"doc_type":"deck","deck_type":"fundraising",...} -->
```

The metadata object includes:

- `doc_type: "deck"`
- `deck_type: "fundraising" | "investor_update"`
- `company_name: string`
- `stage?: string` (optional, e.g., "Seed", "Pre-Seed", "Series A")
- `round_size?: string` (optional, e.g., "$500k")
- `has_key_metrics: boolean`
- `outline_sections: Array<{sectionKey, title, order, preview?}>`

The document table also stores:
- `kind: "deck"` (matches `doc_type`)
- `metadata` JSONB field (mirrors the HTML comment for querying)

---

## Builder Flow

### 1. Select Deck Template

- User navigates to `/builder` and switches to the **Decks** tab
- Sidebar lists canonical deck templates (where `is_canonical = true`)
- Templates are grouped by `deck_type` and ordered by name
- Clicking a template selects it and loads its canonical sections

### 2. Customize Outline

The outline editor allows users to:

- **Enable/disable sections**
  - Minimum of 5 enabled sections required (`MIN_ENABLED_SECTIONS = 5`)
  - Disabling below the minimum shows a warning toast
  - Required sections (per `is_required` flag) cannot be disabled

- **Rename section titles**
  - User can edit the `title` field for any section
  - Custom sections auto-update their `sectionKey` based on the title

- **Reorder sections**
  - Up/Down buttons swap adjacent sections
  - Order is persisted in state and used for generation

- **Add custom sections**
  - "Add Section" button creates new custom sections
  - Custom sections have auto-generated `sectionKey` values
  - Can be deleted (subject to `MIN_ENABLED_SECTIONS`)

- **Delete custom sections**
  - Delete button appears on custom sections only
  - Deletion blocked if it would reduce enabled count below minimum

### 3. Enter Company & Round Info

Form fields:

- `companyName` (required) — Used in deck title and metadata
- `stage` (optional) — Funding stage (e.g., "Seed", "Pre-Seed", "Series A")
- `roundSize` (optional) — Round size (e.g., "$500k", "$2M")
- `keyMetrics` (optional) — Key metrics/numbers to include

### 4. Generate with Maestro

- Button: **"Generate Deck with Maestro"**
- Enabled only when:
  - Template is selected
  - Sections are loaded
  - At least `MIN_ENABLED_SECTIONS` sections are enabled
  - `companyName` is non-empty
- On click:
  - Calls `/api/ai/generate-deck` (POST)
  - Request payload:
    ```typescript
    {
      deckType: "fundraising" | "investor_update",
      outline: Array<{sectionKey, title, order}> (enabled sections only, sorted),
      companyInfo: {companyName, stage?, roundSize?, keyMetrics?}
    }
    ```
  - AI prompt includes:
    - Deck type and purpose
    - Company info
    - Section titles and default prompts
    - Instructions to return JSON with `sections[]` array
  - Response parsed into `DeckGenerationResult`:
    ```typescript
    {
      sections: Array<{
        sectionKey: string,
        title: string,
        content: string
      }>
    }
    ```
- Loading state: Button disabled, "Generating..." text
- Success: Generated content stored in state, Review Draft area populated
- Error: Toast notification, no state changes

### 5. Review & Edit

- **Review Draft** area shows one textarea per enabled section
- Each textarea displays generated `content` for that section
- User edits are stored in `editingDeckSectionContent` state
- Edits persist across outline changes (user can tweak outline and re-generate)
- Placeholder for missing content: "Add your talking points for this section..."

### 6. Save to Vault

- Button: **"Save Deck to Vault"**
- Enabled only when:
  - Generated content exists (`generatedDeckSections.length > 0`)
  - `companyName` is non-empty
  - Not currently saving
- On click:
  - Builds deck narrative (markdown) from enabled sections:
    ```
    # {Section Title}

    {Section Content}

    ```
  - Builds metadata object (see "Deck Document Metadata" above)
  - Prepends metadata as HTML comment to content
  - Calls `/api/documents/versions` (POST) with:
    ```typescript
    {
      title: "{companyName} — {Deck Type Label}",
      content: "<!-- MONO_DECK_METADATA:{...} -->\n\n{markdown}",
      kind: "deck",
      metadata: {...}
    }
    ```
  - On success:
    - Stores `documentId` in state (`savedDeckDocumentId`)
    - Shows success toast
    - "Export Deck" button becomes available
  - On error: Toast notification, state unchanged

### 7. Export

- Button: **"Export Deck"** (in Builder and Vault)
- Enabled only when: Deck is saved (`documentId` exists)
- On click:
  - Calls `/api/decks/[docId]/export` (GET) with credentials
  - Server:
    - Authenticates user and verifies document ownership
    - Loads latest version
    - Strips metadata comment
    - Converts markdown to HTML using `renderContent`
    - Returns full HTML document with styling
  - Client:
    - Fetches HTML as blob
    - Creates blob URL
    - Opens in new tab (`window.open()`)
    - Cleans up blob URL after a delay
- Export HTML is print-friendly (browser "Print → Save as PDF" works)

---

## Rehydration

When a deck document is opened from Vault (via `/builder?docId=...`):

1. Builder detects `docId` in URL search params
2. Loads document and latest version from database
3. Parses metadata from HTML comment:
   ```javascript
   const metadataMatch = content.match(/<!-- MONO_DECK_METADATA:({.*?}) -->/s);
   const metadata = JSON.parse(metadataMatch[1]);
   ```
4. Reconstructs state:
   - **deckType** — from `metadata.deck_type`
   - **selectedTemplate** — matches `deck_type` to canonical template
   - **companyInfo** — from `metadata.company_name`, `stage`, `round_size`, `has_key_metrics`
   - **outline** — from `metadata.outline_sections` (sectionKey, title, order)
   - **content** — parsed from markdown body (sections separated by `# {Title}` headers)
5. Switches to Decks tab, pre-selects template, populates Review Draft area

**Limitations:**
- Rehydration depends on `outline_sections` metadata; custom edits outside the builder may not map correctly
- Section content is matched by header titles; mismatches may cause issues

---

## Integration Points

### Telemetry

Three events are logged via `lib/telemetry/builder.ts`:

- **`deck_generated`** — Fired on successful AI generation
  - Metadata: `deck_type`, `section_count`, `content_length`, `has_key_metrics`
- **`deck_saved`** — Fired on successful save to Vault
  - Metadata: `deck_type`, `section_count`, `content_length`, `has_key_metrics`
- **`deck_exported`** — Fired on export action
  - Metadata: `deck_type`, `doc_id`, `source` ("builder" | "vault")

### Playbooks

Future Playbooks integration is documented in `docs/DECKS_PLAYBOOKS_NOTES.md`.

Metadata fields enable:
- **"Fundraising Deck → Outreach Tasks"** — Creates investor outreach tasks when a fundraising deck is saved
- **"Investor Update Deck → Update Distribution Tasks"** — Creates distribution tasks when an investor update deck is saved

Key metadata fields used:
- `deck_type` — Determines Playbook pattern
- `company_name` — Used in task descriptions
- `stage` & `round_size` — Filters for fundraising workflows
- `outline_sections` — Provides context without full body

---

## Known Limitations (v1)

1. **Export Layout**
   - Export is simple HTML, not slide-perfect
   - No Google Slides integration yet (Week 14+)
   - Users must use browser print/PDF for final output

2. **Rehydration Heuristics**
   - Depends on `outline_sections` metadata
   - Manual edits to saved deck content may not rehydrate correctly
   - Custom sections added in builder are preserved, but external edits may be lost

3. **Deck Types**
   - Only two deck types supported: Fundraising and Investor Update
   - No support for sales decks, internal updates, or custom templates (future)

4. **AI Generation**
   - Single-pass generation (no iterative refinement)
   - No section-by-section generation option
   - No template-based styling or formatting

5. **Outline Editor**
   - Reordering is manual (Up/Down buttons)
   - No drag-and-drop
   - No bulk operations (enable/disable multiple sections)

---

## Files Reference

### Schema
- `supabase/migrations/202512010900_decks_library_v1.sql` — Database schema and seeds

### API Routes
- `app/api/ai/generate-deck/route.ts` — AI generation endpoint
- `app/api/decks/[docId]/export/route.ts` — Export endpoint

### UI Components
- `components/builder/builder-client.tsx` — Main Builder client (Decks tab implementation)
- `app/(protected)/builder/page.tsx` — Builder server page (loads templates)

### Vault Integration
- `app/(protected)/vault/page.tsx` — Vault UI (deck badges, export action)

### Utilities
- `lib/telemetry/builder.ts` — Telemetry events
- `lib/render.ts` — Markdown to HTML conversion (used in export)

### Documentation
- `docs/DECKS_LIBRARY_MODEL.md` — Library schema documentation
- `docs/DECKS_PLAYBOOKS_NOTES.md` — Playbooks integration spec

---

**Decks Builder v1 is locked and stable for Week 14 (Accounts Builder) development.**

