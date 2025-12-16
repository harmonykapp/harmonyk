# Harmonyk Beta – Onboarding & Golden Path

This document describes the intended first-run experience for Beta users and the core "golden path" we want them to test.

---

## First-run experience

When a new user logs in for the first time:

- The **Dashboard** shows a "Welcome to Harmonyk Beta" card.

- The card explains the golden path in 5 steps:

  1. Go to **Workbench** and analyze a document.

  2. Use **Builder** to generate a Version 1 draft.

  3. **Save to Vault** so it becomes a tracked asset.

  4. Open **Activity** to see what happened.

  5. Ask **Maestro** questions about your docs.

The card can be dismissed. Dismissal is stored in localStorage (per user/browser) so returning users are not spammed.

The Dashboard also includes a short explanation of what each main nav item does:

- **Workbench** – analyze and compare your documents.

- **Builder** – generate and edit new drafts with AI.

- **Vault** – the single source of truth for saved docs.

- **Activity** – a timeline of what has happened to your docs.

- **Maestro** – an AI operator for asking questions and running deeper analysis.

---

## Workbench empty state & demo document

For new users with no documents in Vault:

- The **Workbench** page shows a clearly labeled "Demo NDA (sample only)" section.

- It explains that:

  - The user has no documents yet.

  - They can still test analysis using a sample NDA.

  - Real workflows will use their own documents from Vault or external connectors.

Optionally, a button may be provided to analyze a short sample NDA text. The sample should be clearly marked as demo content and must not be logged as sensitive data.

---

## Golden path for Beta testers

We want Beta users to walk through this flow at least once:

1. **Analyze** a document on Workbench (real doc or sample).

2. **Generate V1** in Builder and make at least one edit.

3. **Save to Vault** so it appears as a tracked asset.

4. **Review Activity** to confirm events are logged and visible.

5. **Use Maestro** to ask simple questions about the doc.

Feedback we want:

- Is the golden path obvious from the UI and onboarding copy?

- Do they understand where to start?

- Do they understand what Vault and Activity are doing?

- Are there any dead ends or confusing states?

---

## Notes for future refinement

- For GA, first-run onboarding may evolve into a richer guided tour.

- Demo content should remain clearly flagged and separate from real customer data.

- If we add org/team onboarding later, this flow may need variants for owners vs members.

