# Cursor Rules — Harmonyk

## Scope
- Harmonyk is a Next.js 16 + TypeScript app (App Router).
- No Web3/tokenomics. No new npm deps unless explicitly asked.
- Keep code compiling, lint-clean, and production-buildable.

## Style & Constraints
- Modules: `app/*`, `components/*`, `lib/*`, `data/*`.
- Types: avoid `any`. Use narrow types and discriminated unions.
- Client vs Server:
  - Server files: Route handlers in `app/api/**/route.ts`.
  - Client files: Components that use hooks or browser APIs. Add `"use client"`.
- Errors: Fail soft. Return small JSON `{ ok: true }` for logging stubs.

## What NOT to change
- Don’t change package.json scripts.
- Don’t add libraries.
- Don’t invent new routes; use `lib/routes.ts` (see North Star).

## Testing
- Must pass `npm run lint`, `npm run build`, and local `npm run dev`.
- No red squiggles in Cursor for changed files.

## When uncertain
- Prefer stubs that compile over complex scaffolds.
- Ask in code comments what you need (short, specific).
