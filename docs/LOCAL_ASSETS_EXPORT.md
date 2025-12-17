# LOCAL_ASSETS_EXPORT.md — Harmonyk

This file documents **local / external assets** that back the Harmonyk product (legal templates, wireframes, feedback docs) and how they map into the repo and product features.

Use this as the source of truth when:

- Syncing with Google Drive.
- Updating seed data (contracts, clauses).
- Regenerating demo content.

---

## 1. Legal Templates Library (Contracts Builder GA)

**Purpose:**  
Back the **≈45-template Contracts library** for the Contracts Builder.

**Primary local source:**

- Google Drive path (author's machine):

  - `G:\My Drive\Harmonyk\Product Dev\Assets\LEGAL TEMPLATES`

- Local zip snapshot used in development:

  - `LEGAL_TEMPLATES.zip` (original upload in this project)

**Intended canonical structure at GA:**

- All contract templates mapped into:

  1. **Operational & HR**  
     - NDAs (mutual, one-way)  
     - Employment agreements (variants)  
     - Offer, intern, severance, termination, performance review, promotion, transfer, reference letters  
     - Contractor / consulting agreements  
     - MSAs / SOWs  
     - Employee confidentiality  
     - Website operations (T&Cs/Privacy where available)  

  2. **Corporate & Finance**  
     - Founders / shareholders agreements  
     - Share Purchase / Asset Purchase agreements  
     - Loan / lease / investor-related contracts  
     - JV, partnership, corporate structure documents  

  3. **Commercial & Dealmaking**  
     - MOU, LOI  
     - Reseller, distribution, franchise  
     - Licensing, supply, manufacturing  
     - Referral, commercial MSA, NCND, etc.

**Repo usage:**

- Seeded into DB tables (e.g. `legal_templates`, `contract_templates`), **not** stored as full DOCX/PDF in the public repo.
- For each template:

  - `canonical_type`
  - `category` (`operational_hr` / `corporate_finance` / `commercial_dealmaking`)
  - `tags` (nda, msa, hr, equity, etc.)
  - `is_canonical` + `alt_group` (for variants).

**Action items when refreshing templates:**

1. Update the source docs in Google Drive (not in Git).
2. Update the **template catalog seed data** in the repo.
3. Regenerate any demo contracts if needed.

---

## 2. Clause Library (Contracts Builder GA)

**Purpose:**  
Back the **≈20 clause docs** used by ClauseGraph v1 and Maestro for Contracts.

**Local source:**

- Clause docs extracted from `LEGAL_TEMPLATES.zip` and curated into:
  - `Harmonyk_Clause_XXX_*.docx` (various clause categories)

**Repo usage:**

- Represented as **seed rows** in `contract_clauses` / `clauses` table.
- Each clause has:

  - `name`
  - `slug`
  - `category` (`core_business`, `risk_liability`, `commercial_operational`)
  - `body` (text/markdown)
  - Optional `alt_group` (for variant wording).

**Variants:**

- Files with suffix `(1)` (e.g. alternative Payment Terms, Waiver) are modeled as:
  - Same `canonical_type` or `slug`.
  - Same `alt_group`.
  - One `is_canonical = true`, others available for AI/RAG.

---

## 3. Beta Feedback Docs

**File:**  
`Harmonyk Beta Test Feedback for Builder page.pdf`

**Location:**  
Originally uploaded via ChatGPT project; should be stored under a project docs folder - not stored in the repo.

**Usage:**

- Input into:

  - Builder UX choices (3-level tree, tabbed Builder, two entry modes).
  - Contracts-first sequencing (Weeks 12–13).
  - Library and clause expectations.

**Do not** ship this in public-facing builds; it's internal product research.

---

## 4. Wireframes & Workflow PDFs

**Files:**

- `AI App Wireframe & Workflow_draft1.pdf`
- `Wireframe_draft2.pdf`

**Suggested repo path:**

- `docs/wireframes/AI_App_Wireframe_Workflow_draft1.pdf`
- `docs/wireframes/Wireframe_draft2.pdf`

**Usage:**

- Visual reference for:

  - Overall dashboard/workbench layout.
  - Builder panel structure.
  - Navigation patterns and card designs.

At GA, Figma (or similar) will be the live design source. These PDFs are historical references and should be treated as **non-authoritative** once Figma is up to date.

---

## 5. Token / External Whitepapers (Non-GA)

These are **not** part of Harmonyk GA, but exist in the project for reference:

- `DBIT_Payments_3.pdf`
- `Cryptyk_Technology_White_Paper.pdf`
- `Docubit White Paper.pdf`

Suggested path:

- `docs/archive/tokens/DBIT_Payments_3.pdf`
- `docs/archive/tokens/Cryptyk_Technology_White_Paper.pdf`
- `docs/archive/tokens/Docubit_White_Paper.pdf`

**Usage:**

- Historical context on Web3/token work.
- Not used in GA scope for Harmonyk.
- Should not influence GA roadmap or messaging.

---

## 6. Sync Guidelines

When setting up a new machine or refreshing assets:

1. **Clone repo** as usual.
2. **Sync Google Drive folders**:

   - `Harmonyk/Product Dev/Assets/LEGAL TEMPLATES`
   - Any `/Design` or `/Wireframes` folders used by the team.

3. Ensure:

   - LEGAL TEMPLATES match the catalog seed data in DB.
   - Clause docs align with clause seeds.
   - Wireframes and feedback PDFs are in the documented paths.

This keeps local assets and repo expectations in sync without dumping large binaries into Git.

