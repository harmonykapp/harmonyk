# Contracts Clauses Model — Week 12 Day 3

This document describes the **Contracts clause catalog** and how clauses are linked to templates and contracts.

It covers:

- `contract_clauses` — global clause catalog

- `contract_template_clauses` — mapping of templates to clauses

- `contract_metadata.clauses` — latest clause selection per contract

---

## Goals

- Provide a structured **clause library** that:

  - Supports ClauseGraph v1 (structured side panel).

  - Allows Mono to explain and suggest clauses.

  - Can scale as we add more variants and jurisdictions.

- Allow templates to declare:

  - Which clauses they include by default.

  - The order and required-ness of each clause.

- Track, per contract, which clauses are currently selected.

---

## `contract_clauses` Table

Defined in `supabase/migrations/202511300920_contracts_clauses_v1.sql`.

```text
public.contract_clauses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  body text not null,
  alt_group text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### Key Fields

- `name`

  - Human-friendly label for the clause.

  - Example: `"Confidentiality (Mutual)"`, `"Term & Termination (Standard)"`.

- `slug`

  - Stable identifier used by the app and AI.

  - Example: `confidentiality_mutual`, `term_termination_standard`.

- `category`

  - High-level grouping used by ClauseGraph and UI filters:

    - `core_business`

    - `risk_liability`

    - `commercial_operational`

- `body`

  - The clause text (markdown/plain) used as the base for generation and explanations.

- `alt_group`

  - Groups variants of the same conceptual clause (e.g. different governing law or payment models).

  - Example: all governing law variants share `alt_group = 'governing_law_standard'`.

Indexes:

- `contract_clauses_category_idx`

- `contract_clauses_alt_group_idx`

---

## `contract_template_clauses` Table

```text
public.contract_template_clauses (
  template_id uuid not null references public.contract_templates(id) on delete cascade,
  clause_id uuid not null references public.contract_clauses(id) on delete cascade,
  order_idx integer not null default 0,
  required boolean not null default true,
  alt_group text,
  primary key (template_id, clause_id, order_idx)
)
```

### Purpose

- Defines the **default clause set** for each template.

- Provides ordering and required-ness for each clause in that template.

- Allows grouping for alternate clause sets via `alt_group`.

### Key Fields

- `template_id`

  - References a row in `contract_templates`.

  - Indicates which template this clause belongs to.

- `clause_id`

  - References a row in `contract_clauses`.

- `order_idx`

  - Controls the ordering of the clauses when rendering a template-driven contract.

- `required`

  - `true` if the clause is part of the default recommended set.

  - `false` if optional or alternative.

- `alt_group`

  - Allows grouping of alternate clause sets for a given template, e.g. alternate payment or governing law clauses.

Indexes:

- `contract_template_clauses_template_id_idx`

- `contract_template_clauses_clause_id_idx`

- `contract_template_clauses_alt_group_idx`

---

## `contract_metadata.clauses` Column

The `contract_metadata` table (introduced in Week 12 Day 1) is extended with:

- `clauses jsonb not null default '[]'::jsonb`

### Purpose

- Stores the **latest selected clause set** for a given contract.

- ClauseGraph v1 will read and write this field as the user:

  - Adds/removes clauses.

  - Switches between variants (same `alt_group`).

### Expected Shape

The exact JSON shape can evolve but is expected to at least include:

- Clause IDs in order.

- Optionally, alt variant selections.

Example (illustrative only):

```json
[
  { "clause_id": "30000000-0000-0000-0000-000000000007", "order": 30, "required": true },
  { "clause_id": "30000000-0000-0000-0000-000000000016", "order": 40, "required": true }
]
```

Later, when versioning flows are wired, this field can be copied into per-version metadata to support clause-aware diffs.

