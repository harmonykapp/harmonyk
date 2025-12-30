# Week 20 — Share Hub, Signatures & Contacts Surfaces

## Objectives

- Land GA-ready shells for:

  - **Share Hub** (Overview + Links)

  - **Signatures Center**

  - **Share Contacts**

- Wire them into the existing **Share / Sign** flows:

  - Vault "Send for signature" (Documenso-backed)

  - Vault / Workbench share-link creation

- Make the GA posture explicit:

  - Dashboards are **read-only + demo-backed** in non-production

  - Real link / envelope listing is **post-GA**

  - All destructive or heavy actions are gated behind feature flags

---

## What Was Delivered

### 1) Share Hub — Overview & Links

**Files:**

- `app/(protected)/share/page.tsx`

- `app/(protected)/share/links/page.tsx`

**GA behaviour:**

- Uses **demo share-link data** in non-production via `DEMO_SHARE_LINKS`.

- Surfaced metrics on `/share`:

  - Active links

  - Total views

  - Protected links (passcode / watermark)

  - Guest signups (demo count)

- "Active Share Links" table (both Overview + Links tabs) shows:

  - Document title, permission, protection, views, last viewed, expiry

  - Row actions: open, copy, revoke

- Row actions are wired to:

  - Construct a share URL for the demo id

  - Open in a new tab, copy to clipboard, or remove from local state

- **Feature flag:** `FEATURE_SHARE_ACTIONS`

  - When **disabled**: actions show "coming soon" toasts.

  - When **enabled**: demo actions behave (open/copy/revoke) but remain **local-only**.

**Post-GA intent:**

- Replace demo data with real **Share Links** table backed by:

  - `public.share_link` for share-link metadata (canonical)
    - Note: legacy snapshot tables like `public.shares/public.documents/public.versions`
      are archived under `docs/legacy/` only and must not be used by Harmonyk code.

  - Aggregated events for views/downloads.

- Add bulk revoke controls and richer analytics.

---

### 2) Signatures Center

**File:**

- `app/(protected)/signatures/page.tsx`

**GA behaviour:**

- Uses **demo envelope data** in non-production:

  - Pending, completed, declined, expired states

  - Tracks `sentAt`, `lastActivityAt`, `completedAt`, and `source`.

- Summary cards:

  - Pending signatures

  - Completed

  - Attention needed (declined + expired)

  - Average turnaround (send → complete)

- Signature table:

  - Document, signer, status badge, sent date, last activity, source, actions.

- Row actions:

  - Open envelope (demo URL)

  - Copy envelope link

  - Resend (updates last activity, demo only)

  - Cancel (marks as expired, demo only)

- **Feature flag:** `FEATURE_SIGNATURE_ACTIONS`

  - When **disabled**: all row actions show a "coming soon / use document-level Sign" toast.

  - When **enabled**: demo-only behaviour for local state; no real Documenso calls are made from this dashboard.

**Post-GA intent:**

- Back table with real **Documenso envelopes** (or equivalent):

  - Per-envelope status, signer, timestamps.

- Wire actions to real Documenso:

  - Void / cancel, resend, open envelope link.

---

### 3) Share Contacts

**File:**

- `app/(protected)/share/contacts/page.tsx`

**GA behaviour:**

- Demo-backed contacts table (non-production) with:

  - Name, email, role, org, tags, last activity, last shared document.

- Summary cards:

  - Total contacts

  - Warm contacts

  - Contacts who have signed

  - Investors (or other key segment)

- Actions (view contact, share, note-taking) are **gated** behind `FEATURE_SHARE_ACTIONS` and surface "coming soon" behaviour.

**Post-GA intent:**

- Backed by a real **contacts source of truth**:

  - Google Contacts sync and/or Harmonyk contacts table.

  - Allow users to add/edit contacts and associate them with share links and signatures.

---

## Dev Notes & Limitations (GA)

- **Dashboards are shells**:

  - `/share`, `/share/links`, `/signatures`, `/share/contacts` all render and are navigable.

  - In non-production they show **demo data** only.

- **No real listing yet**:

  - Share links: real links are created from Vault / Builder but are not yet surfaced in Share Hub.

  - Signatures: `Send for signature` (Vault) is wired via `/api/sign/documenso` stub, but envelopes are **not** yet backfilled into the Signatures dashboard.

- **Feature flag posture**:

  - `FEATURE_SHARE_ACTIONS` and `FEATURE_SIGNATURE_ACTIONS` are used to gate interactive behaviour.

  - GA tenant experience: dashboards are safe, read-only overviews with "coming soon" copy for heavy actions.

---

## Next Steps (Post-GA)

1. **Backfill real data into Share Hub**

   - Connect to share-link storage and event logs.

   - Replace `DEMO_SHARE_LINKS` with real query logic.

2. **Wire Signatures Center to Documenso**

   - Persist envelopes from Vault / Workbench "Send for signature."

   - Hydrate `/signatures` table from real envelope metadata.

3. **Contacts as a first-class object**

   - Add a contacts table, with optional Google Contacts import.

   - Link contacts to share links and signatures for per-person histories.

4. **Tighten analytics**

   - Enrich PostHog events for share / sign flows so these dashboards can show real metrics.

For GA, these surfaces are intentionally conservative: they make the model visible and demo-friendly without risking real tenant data or heavy workflows.

