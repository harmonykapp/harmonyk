# PG-W1 — AppShell Contract & Layout Notes

Monolyth — Post-GA 26-Week Build  
Week: **PG-W1 – Responsive App Shell + Infra Enablers**

This document defines the **single AppShell contract** for all protected routes and captures the current audit of layout / header / mobile issues before refactors.

It should be treated as the **source of truth** for:

- AppShell structure (desktop + mobile)
- Page layout constraints (width, gutters, scrolling)
- Standard `PageHeader` + `PageBody` usage
- Known layout / responsive issues to fix and re-test

---

## 1. Routes in Scope for AppShell

All **protected** routes should eventually sit inside one unified AppShell.

- `/` (Dashboard / default Workbench landing)
- `/workbench`
- `/vault`
- `/builder/contracts`
- `/builder/decks`
- `/builder/accounts` (if present)
- `/share` and `/share/*`
- `/signatures`
- `/contacts`
- `/insights`
- `/tasks`
- `/calendar`
- `/playbooks`
- `/settings`
- `/integrations`

> TODO (PG-W1 Day 1): Confirm the exact list of protected routes in the current codebase and tick them off as they are verified to use the unified AppShell.

---

## 2. AppShell Contract (Target Design)

### 2.1 Desktop Behaviour

- **Fixed left sidebar** with:
  - App logo / home
  - Primary nav items (Dashboard/Workbench, Builder, Vault, Share Hub, Insights, Tasks, Playbooks, Integrations, Settings, etc.)
  - Optional "secondary" / utility items at the bottom (account, org, help).
- **Top header strip** at the top of the content area that can host:
  - Global breadcrumbs / context (optional)
  - Org/user info and quick actions (optional)
- **Main content column** where each page renders:
  - `PageHeader` (title + optional subtitle + actions)
  - `PageBody` (scrollable content area)

### 2.2 Mobile / Tablet Behaviour

- **Top bar** replaces the fixed left sidebar:
  - Left: hamburger button to open navigation drawer
  - Center: app name or current section
  - Right: user/org avatar + quick actions (optional)
- **Slide-out nav drawer**:
  - Reuses the same nav config as desktop sidebar
  - Opens from the left, covers content, dismissible by:
    - Tapping outside
    - ESC key
    - Close button / icon
- **Content area**:
  - Scrolls independently
  - Not hidden behind fixed headers or drawers

> Decision: **Breakpoint** where desktop vs mobile kicks in (e.g. `md` or `lg`) will be implemented in PG-W1 Day 3, but the conceptual contract is defined here.

---

## 3. Layout Constraints (Width, Gutters, Scrolling)

Target layout rules:

- **Max content width**: equivalent of `max-w-6xl mx-auto`.
- **Horizontal padding**: at least `px-4` on small screens, `px-6` on larger screens.
- **Vertical rhythm**:
  - `PageHeader` separated from `PageBody` by consistent spacing (e.g. `mb-6`).
  - Within `PageBody`, use consistent `space-y-4` / `space-y-6` stacks.
- **Scrolling**:
  - Sidebar + header may be fixed or sticky, but **content must scroll** without being cut off.
  - No horizontal scrollbars in normal usage; horizontal scroll only for intentional overflow (tables, code blocks, etc.).

> TODO (PG-W1 Day 1–3): Confirm actual Tailwind classes chosen and update this section with the final canonical layout tokens.

---

## 4. PageHeader & PageBody Contract

### 4.1 PageHeader

All major pages should use a shared `PageHeader` component with this contract:

- Props:
  - `title: string`
  - `subtitle?: string`
  - `actions?: React.ReactNode` (e.g. primary/secondary buttons, filters)
- Semantics:
  - Exactly one `<h1>` per page (usually rendered from `title`).
  - Optional supporting text rendered as paragraph or `<p>` under the title.
- Layout:
  - Responsive layout where `title + subtitle` stack on small screens and sit left of `actions` on larger screens.

### 4.2 PageBody

`PageBody` (or equivalent) should:

- Provide consistent top padding under `PageHeader`.
- Use a standard `max-w-6xl mx-auto` pattern where appropriate.
- Manage vertical spacing between sections via `space-y-*` utilities.

> TODO (PG-W1 Day 4): Once components are implemented, add a short example snippet of how routes should use `PageHeader` + `PageBody`.

---

## 5. Current Layout Entry Points (As-Is)

> TODO (PG-W1 Day 1): Fill this in during the audit.

- Protected layout file:
  - Likely `app/(protected)/layout.tsx` (confirm exact path and structure).
- Existing shell / nav components:
  - `AppShell`?
  - `Sidebar`?
  - Any per-page layout wrappers that need to be removed or normalised?
- Notes:
  - Document any surprising layout hacks, inline flexbox/grid constructs in pages, or duplicated shell code that should be consolidated in PG-W1.

---

## 6. Mobile Problems & "Must Retest" Pages

> TODO (PG-W1 Day 1): As you walk the app at narrow viewports, list issues here.

For each route, capture:

- Route path
- Symptom(s) (e.g. sidebar covering content, filters clipping, horizontal scroll, modals off-screen)
- Severity (P0, P1, P2)
- Mark as **"must retest"** once the unified AppShell and responsive behaviour is wired.

Example format:

- `/workbench` — P1
  - Sidebar overlaps filters on mobile
  - Horizontal scroll due to wide cards
- `/vault` — P0
  - Table overflows screen, no padding

---

## 7. Initial A11y / Semantics Checklist

> TODO (PG-W1 Day 1–4): Fill out as you discover issues and fix them.

- [ ] Exactly one `<h1>` per page.
- [ ] Logical heading order (`h2`/`h3`).
- [ ] Focus outlines visible for nav items, buttons, drawer trigger & close.
- [ ] ESC closes the mobile nav drawer.
- [ ] No critical actions hidden off-screen on mobile.

---

## 8. Open Questions / Parking Lot

Use this section for anything not yet decided in PG-W1 but discovered during the audit (e.g. "Should Insights have a wide layout variant?", "Do we need a full-width mode for tables?").

- [ ] ...

When decisions are made, summarise them here and, if necessary, update `NORTH_STAR.md` or dedicated design docs.

