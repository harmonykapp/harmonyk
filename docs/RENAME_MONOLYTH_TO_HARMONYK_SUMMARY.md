# Rename Summary — Monolyth → Harmonyk (Complete)
_SSOT doc for cross-thread updates (PRODUCT / TASKS / ASSETS)._
_Updated: 2025-12-18_

---

## What changed (final brand)

- **Product name:** Harmonyk
- **AI assistant name:** Maestro
- **Primary domain:** harmonyk.ai
- **Brand assets folder:** `public/brand/`
- **Repo:** `harmonykapp/harmonyk`

---

## Repo + codebase changes completed

### 1) Brand assets
- New logo + favicon + PWA assets created and committed under:
  - `public/brand/` (source of truth)
  - Bolt UI kept in sync via:
    - `scripts/sync-brand-assets.ps1` (syncs `public/brand` → `bolt_ui/public/brand`)
- App metadata configured to use `public/brand` paths (favicon, apple touch icon, og image, manifest).

### 2) App UI references updated
- Sidebar/header logo paths updated to new `public/brand/*` assets
  - `components/navigation/Sidebar.tsx`
  - `bolt_ui/components/Sidebar.tsx`
- Any legacy logo filenames removed from references.

### 3) Branding constants
- Product + assistant naming centralized via `lib/brand` usage in app surfaces (where applicable).
- Legacy name checks kept as an explicit audit step:
  - `scripts/brand-audit.mjs` (allowed legacy references only in docs / audit script itself)

### 4) Build + security compatibility
- Next.js upgraded to address Vercel vulnerability gate (CVE warning).
- Build errors fixed (calendar component typings) so:
  - `npm run build` passes locally
  - Vercel production build passes

### 5) Git hygiene
- Rename work performed on a dedicated branch, merged via PR, then branch deleted.
- `main` is now the source of truth for Harmonyk naming and assets.

---

## External services updates completed

### GitHub
- Repo and primary remote confirmed:
  - `origin https://github.com/harmonykapp/harmonyk.git`
- PR merged and cleanup done.

### Vercel
- Project connected to `harmonykapp/harmonyk` (main branch)
- Production deploy confirmed on latest commit
- Domains:
  - `harmonyk.ai` (production)
  - `www.harmonyk.ai` → redirect to `harmonyk.ai`
- Vercel env vars set for build/runtime (including Google OAuth vars required for build).

### Supabase (Auth URL config)
- Dev-mode retained:
  - Site URL remains `http://localhost:3000`
  - Redirect URL includes `http://localhost:3000/*`
- Production URL update deferred until real launch window.

### Google OAuth (Console)
- OAuth app updated to match Harmonyk project + domain
- Client ID/secret added to Vercel env vars to satisfy build-time checks.

---

## Intentionally deferred items (known + accepted)

### 1) Supabase production Site URL
- Not switching Site URL to `https://harmonyk.ai` yet (dev-mode continues).
- Action later: set Site URL + add redirect URLs for production + preview deployments.

### 2) Documenso
- Account/API setup deferred (free account expired due to inactivity).
- Signing workflow not yet fully wired; Documenso API keys not present in `.env.local`.
- Action later: recreate Documenso project + keys + enable signing flow end-to-end.

### 3) PostHog
- Analytics deferred by choice.
- Code is expected to no-op when PostHog key isn't configured.

---

## Quick verification checklist (run anytime)

### Local
```bash
rg -n "Monolyth|Monologo|\\bMono\\b" .
npm run lint
npm run build
npm run dev
```

### Production smoke tests
- `https://harmonyk.ai/` loads (correct brand)
- `https://harmonyk.ai/brand/favicon.ico` loads
- Sign-in route loads
- No build-time env-var failures on Vercel

---

## Copy/paste block for other threads

**Rename is complete. New SSOT: Product = Harmonyk, Assistant = Maestro, Domain = harmonyk.ai, Brand assets under public/brand, Repo = harmonykapp/harmonyk, Vercel project updated + deployed, Google OAuth updated + env vars set, Supabase kept in localhost dev-mode (prod URL deferred), Documenso + PostHog intentionally deferred.**

