# Monolyth (Week-1 local MVP)

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

### Week 3 status

- Status: Functional draft (run `docs/SMOKE_WEEK3.md` before merging).
- Builder: AI generate, manual fallback, save to Vault versions, load via docId.
- Vault: Supabase-backed docs table with version counts + open-in-builder.
- Share: Render endpoint + passcode prompts, scroll telemetry.
- Global light/dark theme, header sidebar logo, PostHog events for generate/save/share.
