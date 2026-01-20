# Cursor Rules (Harmonyk SSOT)

These rules are the **single source of truth** for how changes are produced and applied in Cursor for the Harmonyk repo.

## 1) Patch format (non-negotiable)

- **Unified diffs only.**
- **Apply patches exactly** to existing files.
- **Do not invent, rename, or move files** unless the task explicitly asks for it.
- If a better diff depends on seeing a file, ask for the **exact file path** and I will paste its current contents.

## 2) TypeScript + code quality constraints

- TypeScript is strict: **no `any`**.
  - Prefer real types, or `unknown` + safe narrowing.
- Follow existing patterns in the repo (utilities, tokens, UI components, conventions).
- Prefer small, composable helpers over rewrites.
- Do not change configs (tsconfig/eslint/tailwind/next) unless explicitly required by the task.
- Do not add dependencies unless explicitly required by the task.

## 3) Build hygiene + verification requirements

After applying a diff, run these from **PowerShell** in the repo root:

1) `npm run lint`
2) `npm run build`
3) `npm run dev`

Then smoke-test the relevant route(s).

If anything fails:
- Report the **exact command**, **file**, **line**, and **error**.
- Provide a follow-up **unified diff** that fixes it.

## 4) Weekly + daily workflow discipline

- Each week begins with a **7-day task list**. That list is the weekly SSOT.
- You will send **one diff prompt per day**.
- Complete **only that day’s scope**, unless:
  - you explicitly expand scope, or
  - a tiny additive change has an obvious and immediate benefit without drifting the plan.
- End of day:
  - Confirm `lint`, `build`, and `dev` smoke tests passed.
  - Stop. Wait for explicit approval to move to the next day.
- End of week:
  - Summarize completed work at **file-level granularity**.
  - Provide a short list of manual smoke tests for me to run.

## 5) External/manual steps (Supabase, Vercel, env vars, secrets)

If a task requires changes outside this repo:
- Pause and output **clear, numbered instructions** for me to perform manually.
- Do not assume the external steps are done until I confirm.

## 6) Environment clarity (reduce confusion)

When giving instructions, always label the execution environment explicitly:

- **Cursor diff prompt**: the unified diff I paste into Cursor to apply changes.
- **Cursor chat**: discussion/instructions (no code changes happen until a diff is applied).
- **Codex agent panel (in Cursor)**: only when explicitly requested to use it.
- **PowerShell (local)**: commands I run (`npm`, `git`, `rg`, etc.).

Never assume which environment I’m in; always name it.

## 7) SSR/hydration safety (Next.js)

- Default to deterministic server output.
- Any `localStorage` or browser-only logic must run **after mount** (`useEffect`) to avoid hydration mismatch.
- Avoid server/client branches in render (`typeof window !== "undefined"` inside render).
- If a component is client-only, use `"use client"` and still keep first render deterministic.

## 8) Feature flags (during PGW4–PGW* scaffolding)

- Ship risky UI/behavior changes behind flags.
- Defaults should be conservative in production.
- Prefer `NEXT_PUBLIC_*` env flags for client-visible gating.

## 9) Asking for file contents (the approved workflow)

If you need more context to make a correct diff, request:
- the **file path**, and
- whether you need **the whole file** or a specific section.

I will paste the contents from:
- the repo (Cursor / local), or
- Supabase (manual copy/paste),
so we avoid drift and wrong assumptions.
