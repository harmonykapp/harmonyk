# Contracts Library Model — Week 12 Day 2

This document describes the **global Contracts library schema** used by the Contracts Builder.

It covers:

- The `contract_templates` catalog table

- How categories and tags work

- How canonical types and variants are modeled

---

## Goals

- Provide a **single source of truth** for the Contracts Builder library.

- Support:

  - 3 top-level categories under **Legal Contracts**:

    - `operational_hr` — Operational & HR

    - `corporate_finance` — Corporate & Finance

    - `commercial_dealmaking` — Commercial & Dealmaking

  - A **single canonical template per contract type** for ease of use.

  - Alternate variants (long-form, jurisdiction-specific, legacy forms) via `alt_group`.

  - Flexible search/filtering via tags and risk level.

This catalog is **global (not org-scoped)** and is safe to read for any workspace.

---

## `contract_templates` Table

Defined in `supabase/migrations/202511300910_contracts_library_v1.sql`.

```text
public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  canonical_type text not null,
  category public.contract_category not null,
  is_canonical boolean not null default true,
  alt_group text,
  tags text[] not null default '{}',
  risk public.risk_level default 'medium',
  jurisdiction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

### Key Fields

- `name`

  - Human-readable name for the template.

  - Example: `"Mutual NDA (Short)"`, `"Master Services Agreement (MSA)"`.

- `canonical_type`

  - Logical identifier for this type of contract.

  - Used by the app, AI, and Playbooks to reason about contract intent.

  - Examples:

    - `nda_mutual`

    - `nda_one_way`

    - `employment_agreement`

    - `contractor_individual`

    - `msa_services`

    - `sow_general`

    - `saas_subscription_standard`

    - `share_purchase_agreement`

    - `mou_general`

- `category` (`public.contract_category`)

  - Drives the **3-level legal tree** in the Contracts Builder:

    - `operational_hr` — Operational & HR

    - `corporate_finance` — Corporate & Finance

    - `commercial_dealmaking` — Commercial & Dealmaking

  - A contract may be **searchable via multiple categories** using tags, but has **one primary category** for navigation.

- `is_canonical`

  - `true` for the primary, recommended version for that `canonical_type`.

  - `false` for alternate variants (e.g. longer forms, jurisdiction-specific variants).

- `alt_group`

  - Used to group variants together.

  - Example:

    - All `nda_mutual` variants might share `alt_group = 'nda_mutual_standard'`.

    - Allows ClauseGraph and Mono to swap variants intelligently.

- `tags`

  - Array of strings for flexible filtering and search.

  - Examples:

    - `'{nda,confidentiality,operational_hr,commercial_dealmaking}'`

    - `'{employment,hr,operational_hr}'`

    - `'{reseller,commercial_dealmaking}'`

- `risk` (`public.risk_level`)

  - Coarse-grained assessment of how "heavyweight" or risky the contract is.

  - Enum: `'low' | 'medium' | 'high'`.

  - Used to:

    - Highlight simple vs complex templates in UI.

    - Influence Mono's guidance and warnings.

- `jurisdiction`

  - Baseline jurisdiction for the canonical template.

  - Examples: `"US-general"`, `"US-DE"`, `"EU"`, `"AU"`.

  - Mono may adjust or recommend variants depending on org preferences and deal context.

---

## Initial Seeds (Hero Templates)

The initial seed in `202511300910_contracts_library_v1.sql` defines a **hero set** of templates across the three categories, including:

- **Operational & HR**

  - Mutual NDA (Short)

  - One-way NDA

  - Employment Agreement (Standard)

  - Independent Contractor Agreement (Individual)

  - Master Services Agreement (MSA)

  - Statement of Work (SOW) – General

  - SaaS Subscription Agreement (Standard)

  - Data Processing Addendum (Short Form)

  - Online Privacy Policy

- **Corporate & Finance**

  - Share Purchase Agreement

  - Asset Purchase Agreement

  - Founders Agreement

- **Commercial & Dealmaking**

  - Memorandum of Understanding (MOU)

  - Letter of Intent (LOI)

  - Reseller Agreement

Later migrations will extend this catalog to the full ~45-template library, including HR/People Ops docs, additional corporate instruments, and more commercial deal structures.

