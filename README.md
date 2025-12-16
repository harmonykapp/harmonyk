# Harmonyk

## Product SSOT (Specs & Pricing)

The single source of truth for the GA (20-week, Google-first) build lives in:

- [`docs/NORTH_STAR.md`](docs/NORTH_STAR.md) — vision, guardrails, GA definition of done

- [`docs/PRODUCT/PLAN_SPECS_TABLE.md`](docs/PRODUCT/PLAN_SPECS_TABLE.md) — GA product spec table

- [`docs/PRODUCT/PRICING_TABLE.md`](docs/PRODUCT/PRICING_TABLE.md) — plans & pricing table

### Post-GA (read-only during GA)

- [`docs/NORTH_STAR_POST_GA.md`](docs/NORTH_STAR_POST_GA.md) — post-GA vision & integration plan (do not implement before GA)

> Scope is frozen until GA: only Google Drive + Gmail connectors ship; internal Tasks and built-in Playbooks only.

---

- Next.js 16 (App Router, Turbopack)
- Supabase (Auth + DB)
- OpenAI (AI triage)
- Documenso stub (Signatures CSV export)
- PostHog (client init; no-op if no key)

> Current milestone: **Week 3 functional draft** — run through `docs/SMOKE_WEEK3.md`
> whenever validating a branch before merge.

## Quick Start
```bash
npm i
cp env.example .env.local   # edit with your Supabase / API keys
npm run dev
# http://localhost:3000
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment variables
1. Copy `env.example` to `.env.local`.
2. If you are using the Supabase CLI, run `supabase start` and keep the default URL/keys from the example file.
3. If you are pointing at a hosted Supabase project, replace the URL/anon/service keys with the values from your project settings.
4. Restart `npm run dev` whenever you change environment variables.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Dev Tips

- `npm run dev` – local development server (default on port 3000).
- `npm run build` – production build.
- `npm run preview` – run the built app locally via `next start -p 3000`.
- `npm run clean` – remove `.next` and `build` artifacts.
- Dev-only API routes live under `/api/dev/...` (e.g. share renders, sign stub, insights export).
- Day 7 smoke path (should stay green):
  - Builder → Generate preview.
  - Vault → Sign (stub flow).
  - Insights → Download CSV.
  - Share → Open public link.

## Current status

> Updated for **end of Week 4**. This is a realistic snapshot, not the ideal plan.

- **OpenAI wired for Analyze.**
  - `/api/ai/analyze` exists and is used by the Workbench Analyze drawer.
  - Responses are validated via Zod and presented as Summary / Entities / Dates / Next Action.

- **Workbench Analyze drawer live.**
  - Per-item Analyze actions are available on the Workbench.
  - Errors are surfaced gracefully; the page does not crash.

- **Supabase core schema & helpers in place.**
  - Core tables: `user`, `org`, `member`, `source_account`, `unified_item`,
    `document`, `version`, `share_link`, `envelope`, `activity_log`,
    `template`, `clause`.
  - Server and browser Supabase clients exist and are used in key flows.

- **Templates & Clauses powered Builder (Contracts Builder V1).**
  - `/builder` loads Templates and Clauses from Supabase.
  - Contracts Builder V1 flow:
    - Step 1: choose Template.
    - Step 2: choose Clauses.
    - Step 3: enter instructions.
    - Step 4: **Generate Version 1** → currently generates a structured **stub draft** on the client.
  - A **Save Version 1** button exists but is intentionally a stub; it does not yet
    persist to Vault or Versions.

- **Vault & Share flows.**
  - Existing Save → Vault → Share flows (from earlier weeks) still work and are
    Supabase-backed for at least one document path.

- **Telemetry & ActivityLog – partially wired.**
  - Telemetry stubs exist for `builder_generate` and related events.
  - `activity_log` table is present but not yet reliably populated for:
    - `analyze_completed`
    - `version_saved`
  - Full wiring of Analyze/Builder to ActivityLog is explicitly scheduled as a
    **Week 5 task** to avoid blocking progress.

This means Harmonyk now has:

- A functional Workbench with AI analysis.
- A functional Contracts Builder V1 UX using real Templates and Clauses.
- A Supabase-backed schema ready for proper logging and versioning in Week 5.
