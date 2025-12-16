# ENV_GA_REFERENCE

This document describes the environment variables required for running the Harmonyk **GA surface**.

It is a reference for:

- Local development in a **GA-like** configuration.

- Staging / production deployments that are limited to the GA feature set.

---

## 1. Core App / Supabase

| Key                               | Example                                 | Required (GA) | Notes                                      |
|-----------------------------------|-----------------------------------------|---------------|--------------------------------------------|
| NEXT_PUBLIC_SUPABASE_URL         | https://xyzcompany.supabase.co         | Yes           | Supabase project URL                       |
| NEXT_PUBLIC_SUPABASE_ANON_KEY    | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…` | Yes           | Public anon key for client                 |
| SUPABASE_SERVICE_ROLE_KEY        | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…` | No (recommended) | For server-side jobs / maintenance only    |
| NEXTAUTH_SECRET / AUTH_SECRET\*  | `super-secret-string`                  | Yes           | Session / auth secret (framework-specific) |

\* Use the appropriate key name for the auth library in this repo.

---

## 2. OpenAI / LLM

| Key              | Example    | Required (GA) | Notes                                             |
|------------------|------------|---------------|---------------------------------------------------|
| OPENAI_API_KEY   | `sk-...`   | Yes           | Used by Maestro, Builder generators, Packs, etc.     |

---

## 3. Documenso (Signatures)

| Key                    | Example                          | Required (GA) | Notes                                                         |
|------------------------|----------------------------------|---------------|---------------------------------------------------------------|
| DOCUMENSO_API_URL      | https://app.documenso.com/api   | Yes           | Base API URL                                                  |
| DOCUMENSO_API_TOKEN    | `dcm_...`                        | Yes           | Used for send-for-signature flows                            |

> GA note: Webhook parity may be partial. See GA caveats in `docs/WEEK20_GA_CUT_SUMMARY.md`.

---

## 4. Google (Drive / Gmail Connectors)

| Key                            | Example                                | Required (GA) | Notes                                                      |
|--------------------------------|----------------------------------------|---------------|------------------------------------------------------------|
| GOOGLE_CLIENT_ID               | `1234567890-abc.apps.googleusercontent.com` | Yes      | OAuth client ID for Workspace / user auth                  |
| GOOGLE_CLIENT_SECRET           | `GOCSPX-...`                           | Yes           | OAuth client secret                                        |
| GOOGLE_REDIRECT_URI            | `https://app.monolyth.dev/api/google/callback` | Yes    | Must match console configuration                           |

> GA note: Connectors are **Google-first** only (Drive + Gmail). Other providers remain "Coming Soon".

---

## 5. Telemetry (PostHog / Sentry or equivalent)

| Key                    | Example       | Required (GA) | Notes                                       |
|------------------------|---------------|---------------|---------------------------------------------|
| NEXT_PUBLIC_POSTHOG_KEY | `phc_...`    | No            | Optional but recommended for GA             |
| NEXT_PUBLIC_POSTHOG_HOST | `https://app.posthog.com` | No | Optional; defaults to PostHog cloud         |
| SENTRY_DSN             | `https://...@oXXXX.ingest.sentry.io/XXXX` | No | Optional; error reporting / traces          |

> GA posture: Code paths should tolerate these being unset (no crashes, just no telemetry).

---

## 6. Feature Flags (Experimental / Post-GA)

These control **non-GA** or experimental surfaces. They must be **false by default** in GA environments.

| Key                           | Example  | Required (GA) | Notes                                                                 |
|-------------------------------|----------|---------------|-----------------------------------------------------------------------|
| MONO_RAG_ENABLED              | `false`  | No            | Backend guard for Maestro RAG endpoints                                  |
| NEXT_PUBLIC_MONO_RAG_ENABLED  | `false`  | No            | Frontend guard for RAG-related UI                                    |
| NEXT_PUBLIC_SHOW_LABS         | `false`  | No            | Exposes Labs / experimental navigation / UI                          |

GA expectations:

- All of the above are `false` for GA tenants.

- RAG endpoints are treated as **dev-only** until promoted post-GA.

---

## 7. Local GA-like `.env.local` checklist

Before GA:

- Define all **Required (GA)** keys above.

- Set all experimental flags to `false`.

- Confirm:

  - `npm run lint` passes.

  - `npm run build` passes.

  - `npm run dev` boots without missing-env crashes on core routes.
