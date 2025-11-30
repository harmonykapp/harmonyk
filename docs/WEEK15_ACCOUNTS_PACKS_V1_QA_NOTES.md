# Week 15 QA — Accounts Packs v1

Lightweight QA checklist for SaaS Expenses Pack and Investor Accounts Snapshot.

## 1. Smoke tests — API

### 1.1 Authenticated happy path

- [ ] Sign in to the app locally.

- [ ] From browser console on `/builder`, run:

  - `await fetch("/api/accounts/packs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "saas_monthly_expenses" }) }).then(r => r.json())`

- [ ] Confirm:

  - [ ] `ok: true`

  - [ ] `pack` is present (even if fields are empty / zeroed)

  - [ ] `requestId` is a UUID-ish string.

- [ ] Repeat with:

  - `type: "investor_accounts_snapshot"`

  - Expect same shape.

### 1.2 Unauthenticated / wrong user

- [ ] From a **signed-out** tab, call the endpoint via console:

  - Expect `ok: false` + HTTP `401` or a clear "Authentication required" error.

- [ ] Verify terminal logs show a matching `accounts_pack_failure` event.

### 1.3 Missing or invalid type

- [ ] POST with `{}` body:

  - Expect `ok: false` with a clear error about `type` being required / invalid.

---

## 2. Builder UI — Accounts Inbox

- [ ] Switch to **Builder → Accounts → Inbox**.

- [ ] If you have seed rows in `financial_documents`:

  - [ ] Rows render without errors.

  - [ ] Vendor / provider / type labels look sane.

  - [ ] Amount and period formats look correct (no `NaN` or raw ISO strings).

- [ ] If you have no rows:

  - [ ] Empty state copy appears ("No financial documents yet") and layout is stable.

- [ ] Search:

  - [ ] Typing a known vendor filters the list correctly.

  - [ ] Clearing the search resets to the full list.

---

## 3. Builder UI — Accounts Packs

### 3.1 SaaS Expenses Pack

- [ ] Switch to **Accounts → Packs**.

- [ ] Click **Run pack** on "Monthly SaaS Expenses Pack".

- [ ] Expected:

  - [ ] Button shows a loading state.

  - [ ] No duplicate console errors.

  - [ ] Dialog opens with:

    - [ ] Either a JSON `pack` payload

    - [ ] Or a clear error message if data is missing.

- [ ] Sanity-check JSON:

  - [ ] Contains a top-level summary / meta section.

  - [ ] Contains a list of vendors (can be empty).

### 3.2 Investor Accounts Snapshot

- [ ] Click **Run pack** on "Investor Accounts Snapshot".

- [ ] Expected:

  - [ ] Same loading behaviour as SaaS pack.

  - [ ] JSON includes a clear "headline metrics" area and a list of highlight bullets, even if values are stubbed or zero.

### 3.3 Error scenarios

- [ ] Temporarily break data (e.g. remove or rename a key column in a local branch) and confirm:

  - [ ] Packs fail with `ok: false`.

  - [ ] UI shows a toast + inline error in the dialog.

  - [ ] Terminal logs show `[accounts] pack generation failed` with the thrown error.

---

## 4. ActivityLog / Insights wiring

- [ ] While running a few pack requests, watch the dev terminal:

  - [ ] Each successful run logs `activity_log_write` with `accounts_pack_success`.

  - [ ] Each failed run logs `activity_log_write` with `accounts_pack_failure`.

- [ ] Confirm there are no unhandled promise rejections or stack traces from the ActivityLog layer.

---

## 5. Regression checks (Builder + Auth)

- [ ] Contracts Builder still works:

  - [ ] Template selection, stub generation, "Save to Vault", and "Send for Signature" behave as before.

- [ ] Decks Builder still works:

  - [ ] Template load, outline editing, deck generation, "Save to Vault", and "Export" behave as before.

- [ ] Auth:

  - [ ] No new 401/403 spam in Network tab when browsing Builder / Vault / Activity / Insights.

---

## Summary

- If all boxes above are ticked without unexpected errors, Week 15's scope

  (Accounts Packs v1 — read-only, API + Builder wiring + ActivityLog) is

  considered complete.

