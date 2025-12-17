# Harmonyk – Core UI Spec

This document is the visual/UX source of truth for the core app screens.  
Code must follow this document whenever there is a conflict.

## 1. Theme

We support two themes: **light** and **dark**. Both use the same brand purple and the same layout; only surfaces and text colors change.

### 1.1 Light theme

- Background: `#F3F4F6` (page background)
- Surface: `#FFFFFF` (cards, main panels)
- Text primary: `#020617` (slate-950)
- Text secondary: `#4B5563` (slate-600)
- Border: `#E5E7EB`
- Primary accent: `#AA80FF` (lavender purple - matches Harmonyk logo)
- Accent soft: `#AA80FF`
- Link: use primary accent

### 1.2 Dark theme

- Background: `#020617` (near-black)
- Surface: `#020617` / `#0B1120` (cards, sidebar)
- Text primary: `#E5E7EB`
- Text secondary: `#9CA3AF`
- Border: `#1F2933`
- Primary accent: `#AA80FF` (lavender purple - matches Harmonyk logo)
- Accent soft: `#AA80FF`
- Link: use primary accent

### 1.3 Logos

- Light theme:
  - Use `/ui/logo_light_horizontal.png`
  - Suitable on white / very light backgrounds.
- Dark theme:
  - Use `/ui/logo_dark_horizontal.png`
  - Suitable on black / deep navy backgrounds.

### 1.4 Theme toggle behavior

- A toggle in the top navigation bar switches between **light** and **dark**.
- When toggled:
  - We add/remove the `dark` class on `<html>` using Tailwind’s dark mode support.
  - We persist the choice in `localStorage` under `harmonyk-theme`.
  - We switch between the light and dark logo assets.
- Default behavior:
  - On first load, use `localStorage` if present.
  - Otherwise use `prefers-color-scheme` (dark vs light).
  - Fallback to **light** if detection fails.

## 2. Layout System

- Max width container: `max-w-6xl mx-auto`
- Global page padding: `px-6 py-8` on main content wrapper
- Typography:
  - Use Tailwind `font-sans`
  - Headings: `text-2xl`/`text-3xl` for main titles
- Global layout:
  - Left sidebar nav (fixed) with logo + section links
  - Main content area on the right with top header and page content.
- Top header:
  - Left: page title or context
  - Center: search bar (where relevant)
  - Right: primary actions (e.g. “New Doc”, “Upload”) + **theme toggle**.

## 3. Reference Wireframes (PNGs)

These are visual references only; code should follow the written spec.

- `/ui/workbench_light.png` – Light Workbench view
- `/ui/workbench_dark.png` – Dark Workbench view
- `/ui/logo_light_horizontal.png` – Light logo
- `/ui/logo_dark_horizontal.png` – Dark logo

## 4. Screen Specs

### 4.1 Workbench (`/workbench` or equivalent)

Goal: Single pane of glass showing “Today” – shortcuts, active docs, signatures, insights.

Layout:

- Sidebar with sections: Inbox, Workbench, Builder, Vault, Signatures, Insights.
- Main header:
  - Left: “Workbench / Today”
  - Right: primary buttons “New Doc” + “Upload” and theme toggle.
- Content grid (desktop):
  - Left column:
    - “What do you want to do?” quick chips
    - “Today’s work” list of docs
  - Right column:
    - Live signatures
    - Recently opened
    - Insights

Use the light/dark screenshots as reference but keep components simple and consistent.

### 4.2 Builder (`/builder`)

Goal: Let the user pick a template, fill key fields, click Generate, and see a formatted preview.

Layout:

- Wrapper: `max-w-6xl mx-auto px-6 py-8`
- Header row:
  - Left: “Builder”
  - Right: button “Save to Vault”
- Main:
  - Desktop: `lg:grid lg:grid-cols-[2fr,3fr] lg:gap-6`
  - Left column:
    - Template picker
    - Inputs stacked with `space-y-4`
    - “Generate” button at bottom
  - Right column:
    - Card with preview:
      - `prose prose-slate max-w-none`
      - Scrollable for long docs.

### 4.3 Vault (`/vault`)

Goal: Table of documents with version counts and quick actions.

Layout:

- Same wrapper as Builder.
- Header:
  - Title “Vault”
  - Right: “New from Builder” button → `/builder`
- Card containing a table:
  - Columns: Title | Template | Updated | Versions | Actions

Actions:

- “Open in Builder” → loads doc in Builder.
- “Share” → creates share link or opens existing share view.

### 4.4 Share View (`/share/[id]`)

Goal: Read-only view of a shared document with optional passcode gate.

Layout:

- Centered card: `max-w-3xl mx-auto px-6 py-10`
- Passcode required:
  - Card with title “Enter passcode”
  - Input + primary button “View document”
- Unlocked:
  - Card with:
    - Title
    - Subtitle (template name or date)
    - Content: `prose` with scroll for long docs.

### 4.5 Signatures Stub (`/signatures`)

Goal: Placeholder for Week 4 signatures feature (Documenso integration arrives Week 4).

Layout:

- Centered Card:
  - Title “Signatures coming soon”
  - Body text mentioning Documenso integration
  - Button “Back to Vault”.

## 5. Responsiveness

- On mobile:
  - Sidebar collapses or becomes top nav.
  - Tables may stack or use simpler list layouts.
  - Builder columns stack vertically.

## 6. Implementation Notes

- Tailwind dark mode should be configured using `class` strategy (`dark` class on `<html>`).
- All core screens (Workbench, Builder, Vault, Share, Signatures) must respect light/dark colors and typography defined here.
- Any new UI component that introduces a new color or style must be reflected back into this document.

