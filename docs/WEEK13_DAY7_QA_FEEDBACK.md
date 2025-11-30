# Week 13 Day 7 — QA Feedback & Known Issues

**Date:** 2025-12-01  
**Status:** Documented for Week 14 prioritization

---

## Summary

Manual smoke tests revealed several pre-existing issues in the Builder and Vault UI that are **not specific to Decks Builder v1**. These issues affect the Contracts Builder and general Vault/Workbench functionality.

---

## Issues Found

### A. Save to Draft — Missing Drafts Page Functionality

**Issue:**
- "Save to Draft" button in Contracts Builder saves documents to Vault with `status="draft"`, but the `/builder/draft` page is a stub that doesn't filter or display draft documents.
- Users cannot see their saved drafts.

**Root Cause:**
- `handleSaveToDrafts()` just calls `handleSaveToVault()`.
- Both operations save with `status="draft"` (hardcoded in `/api/documents/versions`).
- The `/builder/draft` page doesn't query documents with `status="draft"`.

**Fix Required:**
1. Implement `/builder/draft` page to query and display documents where `status="draft"`.
2. Optionally: Differentiate "Save to Draft" vs "Save to Vault" by passing a parameter or using a different status.

**Priority:** Medium (affects Contracts Builder UX, not Decks)

**Week 13 Scope:** Out of scope (Contracts Builder issue)

---

### B. Quick Actions Buttons — Not Implemented

**Issue:**
- Four Quick Actions buttons in Contracts Builder have no onClick handlers:
  - "Review & Tighten Language"
  - "Add Missing Clauses"
  - "Check for Legal Issues"
  - "Simplify Complex Terms"

**Root Cause:**
- Buttons are UI stubs without implementation.

**Fix Required:**
- Implement handlers that call Mono/AI endpoints for each action.
- Each action should:
  1. Send current document content to AI
  2. Return suggestions/edits
  3. Display results in UI

**Priority:** Low (nice-to-have features, not blocking)

**Week 13 Scope:** Out of scope (future enhancement)

---

### D. Vault Document Viewing — Raw Markdown Instead of HTML

**Issue:**
- Clicking a document in `/vault` opens raw markdown text in a new tab (not rendered HTML).
- Download saves as `.md` file (should respect document kind/type).
- Share link creation works but passcode link produces errors.

**Root Cause:**
- `onView()` creates a markdown blob and opens it directly:
  ```typescript
  const blob = new Blob([r.latestVersion.content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  ```
- Should use `/api/shares/render` or similar to render HTML.

**Fix Required:**
1. Update `onView()` to render markdown as HTML (use `/api/shares/render` or `renderContent` utility).
2. Fix download to respect document kind (decks → HTML, contracts → markdown or PDF).
3. Debug passcode link creation errors.

**Priority:** High (affects user experience for viewing documents)

**Week 13 Scope:** Out of scope (pre-existing Vault issue), but should be fixed in Week 14

---

### E. Workbench — Missing Activity & Deck Information

**Issue:**
- `/workbench` page shows only Drive/Gmail items (from connectors).
- Doesn't display:
  - Recent activity (from `activity_log`)
  - Vault documents (contracts, decks)
  - Deck-specific information

**Root Cause:**
- Workbench is focused on external connector items.
- Activity log integration is missing.
- Vault documents aren't included in Workbench view.

**Fix Required:**
1. Add "Recent Activity" card to Workbench (similar to TaskReminders).
2. Add "Recent Vault Documents" card showing contracts and decks.
3. Integrate activity log queries.

**Priority:** Medium (affects Workbench completeness)

**Week 13 Scope:** Out of scope (Workbench enhancement), but planned for Week 16

---

## Recommendations

### Fix in Week 14 (High Priority)

1. **Vault Document Viewing (Issue D)**
   - Critical for user experience
   - Affects all document types (contracts, decks)
   - Should render HTML for proper viewing

### Fix in Week 14-15 (Medium Priority)

2. **Save to Draft / Drafts Page (Issue A)**
   - Important for Contracts Builder UX
   - Straightforward implementation

3. **Workbench Activity Integration (Issue E)**
   - Part of Week 16 scope per NORTH_STAR.md
   - Can be done earlier if time permits

### Future Enhancements (Low Priority)

4. **Quick Actions Buttons (Issue B)**
   - Nice-to-have Mono features
   - Can be implemented incrementally

---

## Files That Need Changes

### Issue A (Drafts Page)
- `app/(protected)/builder/draft/page.tsx` — Implement query for `status="draft"` documents
- `components/builder/builder-client.tsx` — Optionally differentiate save operations

### Issue B (Quick Actions)
- `components/builder/builder-client.tsx` — Add onClick handlers and AI integration

### Issue D (Vault Viewing)
- `app/(protected)/vault/page.tsx` — Update `onView()` to render HTML
- `app/(protected)/vault/page.tsx` — Fix download to respect document kind
- `app/(protected)/vault/page.tsx` — Debug passcode link creation

### Issue E (Workbench)
- `app/(protected)/workbench/page.tsx` — Add activity log integration
- `app/(protected)/workbench/page.tsx` — Add Vault documents card

---

## Testing Notes

- All issues are **pre-existing** and not introduced by Decks Builder v1.
- Decks Builder v1 functionality (generate, save, export, re-open) works correctly.
- These issues affect Contracts Builder and general Vault/Workbench UX.

---

## Status

- ✅ Documented
- ⏳ Pending Week 14 prioritization
- 🔒 Decks Builder v1 remains locked and stable

