## PGW1_OFFICE_SKIN_AND_DOCSAFE_NOTES.md
_Design notes for using Microsoft Office as an "editing skin" and positioning DocSafe._

Last updated: 2025-12-22

---

## 1. Core Principles

1. **Harmonyk is the brain; Office is the skin.**
   - Harmonyk owns:
     - Doc graph, structure, and metadata.
     - Maestro scores and direction.
     - Tasks, playbooks, and timelines.
   - Microsoft Office (Word, PowerPoint, Excel) is an **optional editing surface**.

2. **Harmonyk Vault vs DocSafe Drive/Sentinel**
   - **Harmonyk Vault**:
     - Semantic / logical vault inside Harmonyk (doc graph and workspaces).
   - **DocSafe Drive**:
     - Secure, sharded multi-cloud storage layer for "record-of-truth" docs.
   - **DocSafe Sentinel**:
     - Audit and monitoring layer, including on-chain anchoring of key events.

3. **2026 sequencing**
   - PGv1: Harmonyk DocOS with Builder packs + scoring.
   - PGv1.5–PGv2: "Office skin" for power users, still Harmonyk-centric.
   - PGv2: DocSafe Drive/Sentinel as infra under Harmonyk.

---

## 2. Phase 1 – Office as a Light "Skin" (PGv1 / PGW1+)

Scope: support Microsoft Word as a preferred editor for key document types without full 2-way sync or add-ins.

### 2.1 Primary UX

- For Builder packs that suit Word:
  - Contracts / legal docs.
  - White papers.
  - Patent drafts (provisional and non-provisional).

Add a secondary action:

- `Build in Word (beta)`

Flow:

1. User selects a template in Builder.
2. Harmonyk:
   - Runs the normal template + AI generation flow.
   - Generates structured content (sections JSON).
   - Creates a `.docx` in OneDrive/SharePoint via Microsoft Graph.
   - Stores:
     - External file ID (`ms_file_id`).
     - Editing mode: `office_mode = "office_skin"`.
     - Initial `maestro_confidence_pct` / `maestro_clarity_pct`.
3. The user edits in Word Web / desktop; the Harmonyk doc entry remains the system of record.

### 2.2 Sync behaviour (version-based, not full 2-way)

- Provide a "Sync latest from Word" action in Harmonyk:
  - Fetch latest `.docx`.
  - Treat the content as a new version.
  - Run Maestro diff / scoring.
- Do **not** attempt:
  - Deep structural merges.
  - Full fidelity round-tripping of every formatting nuance.

This is explicitly a **version-based integration**, not an attempt to replicate Office.

---

## 3. Phase 2 – Deeper Office Integration (PGv2+)

Scope: Word (and possibly PowerPoint) add-ins for power users, tightly integrated with Maestro and DocSafe.

### 3.1 Word add-in with Maestro panel

Within Word:

- Harmonyk add-in with:
  - Maestro side panel.
  - Actions:
    - Insert clause / section from Builder templates.
    - Rewrite selected text.
    - Run risk / consistency checks.
    - View current Maestro scores.
    - "Mark as ready" and push to **DocSafe Drive** + **DocSafe Sentinel**.

Harmonyk remains:

- Source of truth for:
  - Doc metadata, linkages, and scores.
  - Event history and doc trails.

### 3.2 Optional PowerPoint and Excel follow-ups

- PowerPoint:
  - For decks, offer similar Maestro tooling (slide templates, narrative checks).
- Excel:
  - For financial account packs, integrate at the level of:
    - Templates.
    - High-level checks (consistency vs. narrative docs).
  - Avoid deeply re-implementing spreadsheet logic.

These should be **PGv2+ only** and done only if PGv1 usage shows strong demand from Office-heavy users.

---

## 4. DocSafe Integration – Behavioural Notes

When a doc becomes a **record of truth** (e.g. final signed contract, final white paper, final patent draft, key compliance docs):

1. Harmonyk marks it as `is_record_of_truth = true`.
2. Harmonyk triggers:
   - Upload / store in **DocSafe Drive**.
   - Anchor via **DocSafe Sentinel** where appropriate (hash + metadata + timestamp on-chain).
3. The Harmonyk history remains:
   - All iterative drafts.
   - Maestro scores and user ratings along the way.
   - Task / playbook actions taken on that doc.

DocSafe is the long-term storage + audit rail; Harmonyk is the operational history and interface.

---

## 5. Non-Goals (for PGv1 / PGW1)

To protect PGv1 / PGW1 timelines:

- No full 2-way structural sync with Word/PPT/Excel.
- No requirement that every edit in Office is reflected as perfectly structured data in Harmonyk.
- No blockchain anchoring of all events:
  - Only critical "record-of-truth" events should eventually be anchored via DocSafe Sentinel.

The priority is to:

- Make Harmonyk Builder and Maestro the **default path**.
- Use Office as a **comfort layer and polishing tool**, not the primary experience.

