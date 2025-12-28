# ACCESSIBILITY_BASELINE — Harmonyk (PG-W1 Day 2)

Baseline accessibility state of the Harmonyk app as of **PG-W1 Day 2** for the post-GA build.

Purpose:
- Capture the current state for headings, labels, focus, contrast, and basic a11y.
- Record what was actually verified and fixed during PG-W1 Day 2.
- Create a short, realistic backlog for future weeks (especially PG-W26 – Security & Accessibility Hardening).

---

## 1. Scope

Pages sampled for this baseline:

- `/` (Dashboard)
- `/workbench`
- `/vault`
- `/builder` (main Builder experience)
- `/share`
- `/insights`
- `/tasks`
- `/calendar`
- `/playbooks`
- `/settings`
- `/integrations`

Environments:

- Local dev: `npm run dev` (Harmonyk repo).
- Browser: Chrome + DevTools (incl. Lighthouse for accessibility).

This is not a full audit, just a representative baseline.

---

## 2. Headings & Semantics

**Target standard**

- Exactly **one `<h1>` per page**, rendered by the main page heading (future `PageHeader`).
- Subsections use logical heading hierarchy (`<h2>` for primary sections, `<h3>` inside those sections, etc.).

**Current state (PG-W1 Day 2)**

- Verified that the main protected pages each present a single primary page heading:
  - `/dashboard` — “Dashboard”
  - `/workbench` — “Workbench”
  - `/vault` — “Vault”
  - `/share` — “Share Hub”
  - `/insights` — “Insights”
  - `/tasks` — “Task Hub”
  - `/calendar` — “Task Calendar”
  - `/playbooks` — “Playbooks”
  - `/settings` — “Settings”
  - `/integrations` — “Integrations`
- Builder page:
  - Confirmed **one** main page-level heading (“Builder”) acts as the `<h1>`.
  - Sub-headings such as “New Document” and “Financial Inbox / Accounts Packs” have been demoted to `<h2>` to keep hierarchy clean.

There are still some HTML-export templates and dev-only pages that contain their own `<h1>` inside a separate HTML `<body>` (e.g. export routes, error pages, admin tools). These are treated as **standalone documents**, not the main app shell, and are acceptable for now.

**Fixes completed on PG-W1 Day 2**

- Cleaned up Builder hierarchy:
  - “New Document” and “Financial Inbox / Accounts Packs” changed from `<h1>` to `<h2>` in `components/builder/builder-client.tsx`.
  - Main “Builder” heading retained as the single `<h1>` for that page.
- Verified that all key app routes listed above effectively show only one primary page heading.

**Backlog**

- Introduce and adopt a shared `PageHeader` component that always renders the single `<h1>` per route and standardises subtitle/action layout.
- Do a second-pass heading check once the new visual widgets are added (some widgets may introduce new headings that need to be `<h2>/<h3>` instead of `<h1>`).

---

## 3. Labels, ARIA & Accessible Names

**Target standard**

- Icon-only buttons must have an accessible name (`aria-label` or visually hidden text).
- Primary inputs (search, filters, forms) must have a proper `<label>` or descriptive `aria-label`.

**Current state (PG-W1 Day 2)**

- The main pages use text labels for primary actions (buttons with visible text), so most important controls are already self-describing.
- Icon-only controls are rare. The obvious one on Dashboard (welcome/onboarding card close button) has been reviewed.

**Fixes completed on PG-W1 Day 2**

- Dashboard onboarding card close button:
  - Confirmed as labelled with an `aria-label` describing its purpose (dismisses the welcome/onboarding message).
- No other icon-only buttons were found on the sampled routes that required ARIA labels at this time.

**Backlog**

- As new widgets and modals are added:
  - Ensure any new icon-only buttons (filters, menu toggles, close icons) include meaningful `aria-label`s.
- Later audit should explicitly re-check:
  - Any search bars or filters that might still rely on placeholder text instead of proper labels.

---

## 4. Keyboard focus & navigation

**Target standard**

- Core app must be navigable with **keyboard only**.
- Focus states must be clearly visible on links, buttons, and interactive components.
- Modals/drawers should not trap focus or drop it in an undefined place.

**Current state (PG-W1 Day 2)**

- Manual Tab / Shift+Tab checks starting from the browser URL bar:
  - Focus correctly moves through:
    - Sidebar navigation links.
    - Header / top-level page actions where present.
    - Main call-to-action buttons in the content area.
  - Focus does not “disappear” on the main routes checked; focus rings are visible enough to track.
- This behaviour was confirmed on:
  - `/dashboard`, `/workbench`, `/vault`, `/share`,
  - `/insights`, `/tasks`, `/integrations`, `/settings`.

**Fixes completed on PG-W1 Day 2**

- No major keyboard-focus rewrites were needed; baseline behaviour is acceptable for the current post-GA state.
- The heading hierarchy clean-up on Builder indirectly improves screen-reader navigation by making the primary structure clearer.

**Backlog**

- Once AppShell + widgets mature:
  - Review focus trapping and return-of-focus for any modals, drawers, and side panels.
  - Define keyboard interaction patterns for more complex UIs like kanban boards or dense tables (e.g. arrow-key navigation, shortcuts).

---

## 5. Contrast & Visual Readability

**Target standard**

- Primary and secondary buttons, links, and key labels should meet **WCAG AA** contrast where reasonably achievable.
- Status badges and pills should remain legible in both light and dark modes.

**Current state (PG-W1 Day 2)**

- Visual inspection of Dashboard and Workbench shows:
  - Primary buttons and secondary/ghost buttons are readable against their backgrounds.
  - Sidebar navigation text and main body text have adequate contrast in normal themes.
  - No obvious “light-grey on light-grey” issues in the primary flows.

**Fixes completed on PG-W1 Day 2**

- None required in this pass; contrast looked acceptable for the core components reviewed.

**Backlog**

- Re-check contrast for:
  - Secondary badges / chips.
  - Muted helper text and “hint” labels.
  - Any low-contrast elements Lighthouse flags once the new widget layer is implemented.
- Include mobile layouts in the PG-W26 contrast audit to verify contrast holds at smaller sizes and different backgrounds.

---

## 6. Automated Audit Summary (Lighthouse)

Tool used:

- Chrome DevTools **Lighthouse**, Accessibility category only.

**Pages audited**

- `/workbench`
  - Accessibility score: **90**
  - Notable findings:
    - `GET /api/playbooks/all` returns **410 (Gone)**, logged as:
      - `[workbench] Failed to load playbooks summary 410`
      - This is a **functional** issue (dead endpoint), not strictly an a11y problem.
    - Standard Lighthouse suggestions (additional ARIA/landmarks) remain for a later, deeper pass.

- `/vault`
  - Accessibility score: **91**
  - Notable findings:
    - Next.js `Image` warning for `/brand/harmonyk-logo-horizontal.png` because only one dimension was controlled.
    - Addressed by adding `width`/`height` props and `h-8 w-auto` classes in `components/navigation/Sidebar.tsx` to preserve aspect ratio.

- `/insights`
  - Accessibility score: **98**
  - Notable findings:
    - Same Next.js image aspect-ratio warning on the shared sidebar logo, resolved by the Sidebar fix.
    - No major accessibility issues flagged; effectively the current "reference" route.

- `/dashboard`
  - Accessibility score: **98**
  - Notable findings:
    - `GET /api/onboarding/status` returns **401 (Unauthorized)** in dev, logged as:
      - This is an **auth-related** issue (dev environment), not strictly an a11y problem.
    - Same Next.js image aspect-ratio warning on the shared sidebar logo, resolved by the Sidebar fix.

**Common patterns from Lighthouse**

- The main recurring issue was the sidebar logo image configuration, now fixed.
- Remaining items are generic Lighthouse suggestions (extra ARIA, landmarks, etc.) that will be best tackled when the UI is more stable and widgets are in place.

---

## 7. Next steps & PG-W26 link

**Short-term (PG-W1–PG-W6)**

- Introduce a shared `PageHeader` component and:
  - Ensure each main route uses it as the single `<h1>`.
  - Normalise title/subtitle/action layout across Dashboard, Workbench, Vault, Builder, Share, Insights, Tasks, Playbooks, Integrations, and Settings.
- As new visual widgets and modals land:
  - Maintain the “one `<h1>` per page” rule.
  - Add proper labels/ARIA to any new icon-only buttons and critical inputs.
  - Preserve or improve visible focus for all primary navigation and actions.

**Longer-term (PG-W26 – Security & Accessibility Hardening)**

- Run a full WCAG AA accessibility audit across Harmonyk:
  - All main pages plus loading/empty/error states and share/sign flows.
- Integrate automated accessibility checks (Lighthouse/axe or similar) into CI so regressions are caught during development, not manually.
- In the PG-W26 security & accessibility whitepaper:
  - Document which a11y issues have been fixed.
  - Call out any remaining limitations or justified deviations from strict AA, along with mitigation strategies where relevant.
