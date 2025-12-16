# TELEMETRY_GA_RUNBOOK

This runbook defines how Harmonyk should behave for **telemetry and error surfacing at GA**.

It is written so you can sanity-check behaviour with a GA-like environment and a PostHog /

Sentry configuration, but the app must still work if those keys are unset.

---

## 1. Critical GA flows

For GA we care most about the following user flows:

1. **Sign-in / sign-up**

2. **Generate contract** in Builder, then save to Vault

3. **Send for signature** (Documenso)

4. **Generate deck** in Builder, then save/export

5. **Run an Accounts Pack** (e.g. SaaS Expenses / Investor Snapshot)

6. **Share a doc** (Share Hub link)

7. **Workbench query** (analyze a doc or ask Maestro about a doc)

8. **Run a Playbook** (dry-run is fine)

These flows must:

- Emit **at least one telemetry event** each when they are successfully triggered

  (UI-level event or API-level event, not both, unless clearly differentiated).

- Surface **clear, user-facing errors** when something fails (toast or inline error).

- Avoid noisy console logging that would scare a non-technical founder.

---

## 2. Event naming & semantics (target)

Event names should be:

- **Action-oriented** (what the user just did).

- **Stable** over time for dashboards.

- **Scoped** with enough metadata to debug issues (org, user, route, IDs).

Recommended (or equivalent) event IDs for GA flows:

- `flow_auth_sign_in` — User completes sign-in or sign-up.

- `flow_builder_generate_contract` — Contract generation requested from Builder.

- `flow_builder_generate_deck` — Deck generation requested from Builder.

- `flow_vault_saved_from_external` — Document saved to Vault from Workbench / Builder.

- `flow_sign_send_for_signature` — Send-for-signature call successfully initiated.

- `flow_accounts_pack_run` — Accounts Pack run started (includes pack type).

- `flow_share_link_created` — Share link created for a Vault document.

- `flow_playbook_run_started` — Playbook run (or dry-run) started.

- `flow_workbench_analyze` — Workbench document analysis started.

For each event, attach (where available):

- `org_id`

- `user_id`

- `route` (e.g. `/builder`, `/workbench`)

- `source` (e.g. `builder_contracts`, `workbench`)

- Any **key IDs** (document ID, template ID, pack ID, playbook ID, envelope ID).

> If an existing implementation uses slightly different event IDs, prefer **updating

> dashboards / docs** rather than renaming events at the last minute, unless the name

> is obviously misleading.

---

## 3. Error handling expectations

For GA, error handling should follow these rules:

1. **All user-facing API failures** should route through the central helper

   (`handleApiError` or equivalent) rather than ad-hoc `alert()` or bare `console.error`.

2. User sees **one clear message**:

   - Toast or inline error with:

     - A short, human description (e.g. "Couldn't save to Vault").

     - Optional hint for next step ("Try again or contact support if this repeats.").

3. Console logging:

   - Only log **structured context** for debugging (status code, endpoint, IDs).

   - Avoid dumping full stack traces or entire response bodies unless behind a clearly

     gated `if (process.env.NODE_ENV !== "production")` or similar.

4. Telemetry on error:

   - If PostHog / Sentry are wired, emit a **single error event** per failure with:

     - Error message

     - Status code

     - Endpoint / route

     - Context (e.g. `context: "workbench"`, `context: "builder_contracts"`)

   - The absence of telemetry keys must **not** break flows; errors should still be shown

     and the app must not crash.

---

## 4. GA smoke-check procedure

Run this with a **GA-like `.env.local`** where:

- All required GA env vars are set (see `ENV_GA_REFERENCE.md`).

- Experimental flags (RAG, Labs, etc.) are **disabled** by default.

- PostHog / Sentry keys are either:

  - Real keys (preferred for staging), or

  - Omitted entirely (for "no-telemetry" mode).

### 4.1. With telemetry enabled (staging / local)

Assuming `NEXT_PUBLIC_POSTHOG_KEY` is configured:

1. Start dev server:

   ```bash
   npm run dev
   ```

2. Open the app and complete each critical flow:

   - Sign in.

   - Generate a **contract**, save to Vault, and (optionally) send for signature.

   - Generate a **deck** and save/export.

   - Run an **Accounts Pack**.

   - Create a **Share Hub link** for a Vault doc.

   - In **Workbench**, analyze a sample doc.

   - Run a **Playbook** (dry run is fine).

3. For each flow, verify:

   - Exactly **one event** is emitted per user action (no obvious double-fires).

   - Event carries route + org + user + relevant IDs where possible.

   - Errors (e.g. intentionally breaking a flow by revoking a token) produce:

     - A clear toast or inline error.

     - A single error event in telemetry (if configured).

Record any missing events or duplicate events in a temporary checklist and either:

- Add the missing `phCapture` / telemetry call for that flow, or

- Remove redundant duplicates if both UI and API are logging the same action.

### 4.2. With telemetry disabled

Repeat the same flows with **no telemetry keys set**:

- App **must still work**.

- No runtime crashes due to undefined telemetry clients.

- Errors still surface correctly via toasts / inline messages.

---

## 5. Console hygiene checklist

While running the flows above:

1. Keep the browser console open.

2. For each flow, confirm:

   - No repeated noisy warnings on every render.

   - No obvious leaked stack traces from libraries.

   - No raw Supabase / HTTP response dumps when things succeed.

3. When an error is intentionally triggered (e.g. revoke Drive access and hit Workbench):

   - One concise log with:

     - Endpoint / context

     - Status code

     - Short message

   - No endless loops of the same error.

If you see noisy logs:

- Either downgrade them to debug-level logs guarded by `NODE_ENV`, or

- Remove them once the underlying issue is stable.

---

## 6. GA sign-off criteria

Telemetry & error surfacing are **GA-ready** when:

- [ ] Each critical flow emits at least one stable event (or equivalent observability).

- [ ] All user-visible API failures route through the central error helper.

- [ ] No flow crashes when telemetry keys are missing.

- [ ] Console logs are free of obviously scary noise during normal usage.

- [ ] A founder can run through the GA walkthrough (see `OPS_GA_RUNBOOK.md`) and,

      if telemetry is enabled, see a sensible set of events for their actions.

Capture any remaining TODOs in `docs/POST_GA_BACKLOG.md` under a

**Telemetry & Error Surfacing** section so it is clear what can be safely shipped

post-GA without surprising users.

