# Harmonyk – Week 3 Smoke Test

This checklist is for a quick manual verification of the Week 3 functional draft.

## 1. Builder

- [ ] Open `/builder`.
- [ ] Confirm the page uses the Builder layout from `docs/UI_MONOLYTH_CORE.md`.
- [ ] Select a template from the template picker (from `data/templates.ts`).
- [ ] Fill in any required fields.
- [ ] Click **Generate**.
- [ ] Confirm:
  - [ ] A success toast appears (no unhandled error).
  - [ ] The preview updates with formatted content (markdown/HTML rendered via `lib/render.ts`).
  - [ ] No TypeScript/runtime errors in the console.

## 2. Vault – Save + Versions + Open in Builder

- [ ] From `/builder`, click **Save to Vault**.
- [ ] Navigate to `/vault`.
- [ ] Confirm:
  - [ ] A new row appears with the correct title and template.
  - [ ] The **Versions** column shows `1`.
- [ ] From the same Builder doc, click **Save to Vault** again.
- [ ] Refresh `/vault`.
- [ ] Confirm:
  - [ ] The **Versions** column increments (e.g. `2`).
- [ ] Click **Open in Builder** for that doc.
- [ ] Confirm:
  - [ ] `/builder` opens with that document loaded.
  - [ ] The content and template match what you saved.

## 3. Share – Render + Passcode + Invalid Links

- [ ] From `/vault` (or Builder’s share action), create a share link for a doc.
- [ ] Open the share URL `/share/[id]` in the browser.
- [ ] If no passcode is set:
  - [ ] Document renders in a centered card as per `docs/UI_MONOLYTH_CORE.md`.
- [ ] If a passcode is set (test at least once):
  - [ ] First visit shows a passcode prompt.
  - [ ] Entering the correct passcode reveals the document.
  - [ ] Refreshing the page does **not** re-prompt for passcode (cookie/session works).
- [ ] Visit an invalid share URL like `/share/invalid-id-123`.
- [ ] Confirm:
  - [ ] You see a friendly “invalid or expired” message and a **Back to Vault** button.
  - [ ] No unhandled error or crash occurs.

## 4. Theme Toggle (Light/Dark)

- [ ] From any main page (Workbench/Builder/Vault), locate the theme toggle in the header.
- [ ] Click the toggle:
  - [ ] Background and text colors switch between light and dark themes.
  - [ ] The logo switches between the light and dark variants.
- [ ] Refresh the page:
  - [ ] The chosen theme persists (via `localStorage` and the `dark` class on `<html>`).

## 5. Insights / Downloads (if wired)

- [ ] Navigate to the Insights or Downloads area (same place used in earlier weeks).
- [ ] Trigger a CSV export (and/or PDF if implemented).
- [ ] Confirm:
  - [ ] The download starts without errors.
  - [ ] The file opens correctly.

## 6. Signatures Stub

- [ ] Visit `/signatures`.
- [ ] Confirm:
  - [ ] The page renders a centered card that clearly says “Signatures coming soon”.
  - [ ] Text mentions that Documenso integration will land in Week 4 (or similar).
  - [ ] There is a button back to the Vault.
  - [ ] No 404 or crash.

## 7. Telemetry Sanity (if PostHog is configured)

- [ ] With devtools Network tab open, repeat:
  - [ ] Generate in Builder.
  - [ ] Save to Vault.
  - [ ] Create a share.
- [ ] Confirm the following PostHog events appear (if your PostHog key is active in this env):
  - [ ] `builder_generate`
  - [ ] `vault_save`
  - [ ] `share_created`

If any step fails, fix the underlying bug before moving to Week 4.

Record any failures with route + console/network details before filing an issue.

