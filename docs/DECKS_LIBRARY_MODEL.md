# Decks Library Model — Week 13 Day 1

This document describes the **global Decks library schema** used by the Decks Builder.

It covers:

- The `deck_type` enum

- The `deck_templates` catalog table

- The `deck_sections` table that defines canonical outlines

- How templates and sections work together in the Decks Builder

---

## Goals

- Provide a **single source of truth** for the Decks Builder library.

- Support:

  - 2 deck types for GA flows:

    - `fundraising` — Seed/Pre-Seed fundraising decks

    - `investor_update` — Regular investor update decks

  - A **single canonical template per deck type** for ease of use.

  - Flexible search/filtering via tags.

  - Structured outlines via `deck_sections` that define the default slide structure for each template.

This catalog is **global (not org-scoped)** and is safe to read for any workspace.

---

## `deck_type` Enum

Defined in `supabase/migrations/202512010900_decks_library_v1.sql`.

```text
public.deck_type:
  - 'fundraising'
  - 'investor_update'
```

The `deck_type` enum categorizes decks by their primary purpose:

- `fundraising` — Used for seed, pre-seed, and other fundraising rounds to pitch investors.

- `investor_update` — Used for regular updates to existing investors (monthly, quarterly, etc.).

---

## `deck_templates` Table

Defined in `supabase/migrations/202512010900_decks_library_v1.sql`.

```text
public.deck_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  deck_type public.deck_type not null,
  is_canonical boolean not null default false,
  description text,
  tags text[] not null default '{}'::text[],
  default_outline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### Key Fields

- `name`

  - Human-readable name for the template.

  - Example: `"Fundraising Deck (Seed/Pre-Seed)"`, `"Investor Update Deck"`.

- `deck_type` (`public.deck_type`)

  - Categorizes the template by its primary purpose.

  - `fundraising` — For investor pitches and fundraising rounds.

  - `investor_update` — For regular investor communications.

- `is_canonical`

  - `true` for the primary, recommended template for that `deck_type`.

  - `false` for alternate variants or custom templates (future use).

- `description`

  - Optional description of the template's purpose and typical use cases.

- `tags`

  - Array of strings for flexible filtering and search.

  - Examples:

    - `'{seed,pre_seed,fundraising,investor_pitch}'`

    - `'{investor_update,reporting,quarterly,monthly}'`

- `default_outline`

  - JSONB array containing the default section keys for this template (in order).

  - Example: `["problem","solution","market","product","traction","business_model","go_to_market","team","financials","ask"]`

  - Used by the Decks Builder to initialize the deck structure.

---

## `deck_sections` Table

Defined in `supabase/migrations/202512010900_decks_library_v1.sql`.

```text
public.deck_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references deck_templates(id) on delete cascade,
  section_key text not null,
  title text not null,
  order_idx integer not null,
  default_prompt text,
  is_required boolean not null default true,
  created_at timestamptz not null default now()
)
```

### Key Fields

- `template_id`

  - Foreign key to the `deck_templates` table.

  - Each section belongs to exactly one template.

- `section_key`

  - Stable snake_case identifier for the section (e.g. `'problem'`, `'solution'`, `'summary'`).

  - Used in `default_outline` and as a stable reference in the builder.

- `title`

  - Human-readable title for the section (e.g. `"Problem"`, `"Executive Summary"`).

  - Displayed in the Decks Builder UI.

- `order_idx`

  - Sequential ordering of sections within the template (starting from 1).

  - Determines the default slide order.

- `default_prompt`

  - Optional prompt template for Mono to guide content generation for this section.

  - Helps the AI understand what content should go in each section.

- `is_required`

  - `true` if the section is required for the template (default).

  - `false` if the section is optional and can be removed by users.

---

## How Templates and Sections Work in the Decks Builder

- `deck_templates` defines canonical templates and metadata (tags, description, default_outline).

- `deck_sections` defines the canonical outline used by the builder for each template.

- When a user starts a new deck from a template:

  1. The builder reads the template's `default_outline` (JSONB array of section keys).

  2. For each section key in the outline, it looks up the corresponding `deck_sections` row.

  3. The builder uses the section's `title`, `default_prompt`, `order_idx`, and `is_required` to initialize the deck structure.

  4. Users can then customize content, reorder sections, or remove optional sections as needed.

- Mono uses `default_prompt` values to guide AI-assisted content generation for each section.

---

## Initial Seeds (Canonical Templates)

The initial seed in `202512010900_decks_library_v1.sql` defines **2 canonical templates**:

### Fundraising Deck (Seed/Pre-Seed)

- `deck_type`: `fundraising`

- `is_canonical`: `true`

- Sections (10 total):

  1. Problem

  2. Solution

  3. Market

  4. Product

  5. Traction

  6. Business Model

  7. Go-to-Market

  8. Team

  9. Financials

  10. Ask

### Investor Update Deck

- `deck_type`: `investor_update`

- `is_canonical`: `true`

- Sections (7 total):

  1. Executive Summary

  2. Key Highlights

  3. Product Updates

  4. Growth & Sales

  5. Key Metrics

  6. Roadmap

  7. Asks

Later migrations may extend this catalog with additional deck types (e.g. sales decks, internal updates) or alternate variants of existing types.

