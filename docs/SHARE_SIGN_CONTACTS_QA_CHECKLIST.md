# Share / Signatures / Contacts — QA Checklist

This checklist covers **manual smoke tests** for the new Share Hub, Signatures Center, and Contacts surfaces, plus the Vault "Send for signature" flow.

Use this in combination with the main `GA_CHECKLIST.md` when running pre-GA QA.

---

## Pre-requisites

1. **Environment**

   - Local dev or staging with:

     - `NODE_ENV=development` (or non-production) so demo data is visible.

     - Supabase running and migrations applied.

   - Feature flags:

     - `FEATURE_SHARE_ACTIONS` **enabled** for testing actions.

     - `FEATURE_SIGNATURE_ACTIONS` **enabled** for signatures actions.

2. **Test user**

   - Sign in via Supabase magic link.

   - Ensure you can access:

     - `/builder`

     - `/vault`

     - `/workbench`

3. **Seed docs**

   - From **Builder**, generate at least one:

     - Contract (e.g. NDA / MSA) and **Save to Vault**.

     - Deck (optional, for consistency).

---

## A. Vault — Share & Signature Flows

1. **Share link from Vault**

   - Go to `/vault`.

   - Confirm your newly saved document appears.

   - Click a document, open the right-hand **Actions** panel.

   - Click **Share**:

     - Expect:

       - No crash.

       - A new share page opens in a new tab (or equivalent).

       - No 500 errors in the browser console.

2. **Passcode link from Vault**

   - From the same document, click **Passcode link**.

   - Enter a test passcode when prompted.

   - Expect:

       - No errors surfaced to the user beyond normal validation.

       - A link opens (or the user is clearly informed if this is stub-only).

3. **Send for Signature (Documenso stub)**

   - In the same Actions panel, click **Send for signature**.

   - Enter:

     - Recipient name.

     - Recipient email (use a real test inbox).

   - Click **Send**.

   - Expect:

     - Success toast: "Signature request sent (demo)" or equivalent.

     - No unhandled errors in the browser console.

     - In non-production: **it's OK** if no real Documenso email arrives, but server logs should show a stub call, not a 500.

---

## B. Share Hub — Overview & Links

1. **Overview tab**

   - Visit `/share`.

   - Confirm:

     - Heading: "Share Hub".

     - Tagline: "Right documents. Right people. Right now."

     - Summary cards (Active Links, Total Views, Protected Links, Guest Signups) show **demo numbers**.

     - "You currently have X active links…" text reflects demo count.

   - Check console:

     - No React errors.

     - No failed network calls for this page.

2. **Links table (Overview)**

   - On `/share`, scroll to **Active Share Links** section.

   - Confirm:

     - Demo rows render (doc title, permission, protection, views, last viewed, expires).

   - Test actions (with `FEATURE_SHARE_ACTIONS` enabled):

     - **Open link** → new tab opens with a demo URL.

     - **Copy link** → clipboard contains URL, success toast shows.

     - **Revoke** → row disappears from the table (demo-only).

3. **Share Links tab**

   - Click the **Share Links** tab (or `/share/links`).

   - Confirm:

     - Table layout matches the Overview table.

     - Behaviour of actions is identical (open / copy / revoke).

---

## C. Signatures Center

1. **Page render**

   - Visit `/signatures`.

   - Confirm:

     - Heading: "Signatures".

     - Tagline: "Keep deals moving with signature-ready documents."

     - Summary cards show counts for Pending, Completed, Attention Needed, Avg Turnaround.

     - Demo envelope rows appear in the table (NDA, MSA, etc.).

2. **Status & dates**

   - Confirm status badges:

     - Pending → amber "Pending" with clock icon.

     - Completed → green "Completed" with check icon.

     - Declined → red "Declined" with warning icon.

     - Expired → grey "Expired".

   - Dates:

     - "Sent" shows a calendar-style date.

     - "Last Activity" shows time-ago (e.g. "2 days ago").

3. **Row actions (demo)**

   - With `FEATURE_SIGNATURE_ACTIONS` enabled:

     - **Open envelope** → opens demo `/sign/demo/{id}` URL in new tab.

     - **Copy link** → copies demo URL; success toast.

     - **Resend** → shows reminder toast and updates `lastActivityAt` to "a few seconds ago".

     - **Cancel** → marks envelope as `expired`, status badge updates, and shows cancellation toast.

   - With `FEATURE_SIGNATURE_ACTIONS` disabled:

     - All four actions show a "coming soon / use document-level Sign buttons" toast, and **no state changes** occur.

---

## D. Contacts Surface

1. **Page render**

   - Visit `/share/contacts`.

   - Confirm:

     - Heading and summary cards show demo counts (Total Contacts, Warm, Signed, Investors).

     - Table shows demo contacts with roles, orgs, tags, last activity, and last shared documents.

2. **Actions behaviour**

   - With `FEATURE_SHARE_ACTIONS` enabled:

     - Row-level actions (view, share, notes, etc. if present) should show demo toasts and **must not** throw errors.

   - With `FEATURE_SHARE_ACTIONS` disabled:

     - Actions show "coming soon" or are visually disabled; no state changes happen.

---

## E. Non-Goals / Known Limitations (GA)

- Share Hub, Signatures, and Contacts are **demo-backed** dashboards in non-production:

  - They do **not** yet list real share links or Documenso envelopes.

- All "destructive" actions (revoke link, cancel envelope) operate on **local demo state only** at GA.

- Real-time analytics (per-contact, per-link funnels) are post-GA and not required to pass this checklist.

If all sections (A–D) pass without 500s or unhandled errors, the Share / Signature / Contacts surfaces are in an acceptable state for GA.

