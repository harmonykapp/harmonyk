# Signatures & Documenso – Troubleshooting

This doc exists because the Builder UI is currently logging errors like:

> **Current dev state (stubbed)**
>
> - In development, when the `/api/sign/documenso` route cannot find a matching document row
>   (e.g. due to orgId mismatch), it now returns a **stub success**:
>
>   ```json
>   { "ok": true, "envelopeId": "stub-envelope-no-document-row" }
>   ```
>
> - The Builder detects this and shows a toast such as:
>
>   > "Document sent for signature (dev stub)"
>
> - This unblocks the "Send for signature" flow for UX/dev purposes, but **no real envelope is created**
>   in Documenso.
>
> Before GA, this stub must be replaced with a real document lookup + Documenso call (see TODO at the end).

- `No file available for signature. Save this document to Vault first.`

- `This document hasn't been saved to Vault yet. Please click 'Save to Vault' first, then try sending for signature again.`

These errors are coming from the **backend** (`/api/sign/documenso`), not from the Builder UI.

## What the error actually means

When the Builder calls:

```text
POST /api/sign/documenso
```

with:

```json
{
  "documentId": "<saved document id>",
  "recipient": {
    "email": "recipient@example.com",
    "name": "Recipient Name"
  }
}
```

the backend tries to:

1. Look up the document (and possibly its latest version) by `documentId`.

2. Find a **signable file or artifact** (PDF or similar) associated with that document that can be sent to Documenso.

3. If no such file exists, it returns HTTP 400 with:

```json
{
  "ok": false,
  "error": "No file available for signature. Save this document to Vault first."
}
```

The Builder then logs this as:

- `[builder] Send for signature API error - "Status: 400, StatusText: Bad Request, Error: No file available for signature. Save this document to Vault first."`

## Important: Google Drive is *not* required for Documenso

Harmonyk currently treats Google Drive as a **connector**:

- It is used to **ingest** existing user documents into Vault (via the Drive connector).

- It is **not** the primary storage for Builder-generated docs.

The Documenso signature flow does **not** need:

- A Google Drive account for the app, or

- A Google Drive file ID for the document.

Documenso only needs:

- A signable artifact (e.g., a PDF or a text-based document it can accept) and

- The right API call from `/api/sign/documenso`.

If `/api/sign/documenso` returns `No file available for signature`, the underlying problem is:

- We don't have a signable artifact attached to this Vault document inside **our own system**, not that Google Drive is missing.

## Why this happens even after "Save to Vault"

Saving to Vault currently creates a **document record and a version**, but it may NOT be creating the actual file artifact that the Documenso route expects.

Typical gap:

- `POST /api/documents/versions`:
  - Creates a row in `documents` and/or `document_versions`.
  - Stores the text content in the database.

- `POST /api/sign/documenso`:
  - Expects a file row in a `document_files` table, a Supabase Storage object, or some other "ready-to-sign" artifact for that `documentId`.
  - If it doesn't find that, it returns the `No file available for signature` error.

So **the doc exists**, but **the signable file does not**.

## How to fix this (backend changes required)

> This section describes what should be implemented inside the `/api/sign/documenso` route and possibly related helpers. It is NOT implemented yet.

### 1. Open the Documenso route

1. Locate and open:

```text
app/api/sign/documenso/route.ts
```

2. Find the code path that returns:

```ts
return NextResponse.json(
  { ok: false, error: "No file available for signature. Save this document to Vault first." },
  { status: 400 },
);
```

This is the guard that is currently failing.

### 2. Decide on the v1 behaviour

For v1, there are two realistic options:

1. **Strict file requirement (more production-ready)**  
   - Ensure that when a document is saved to Vault, a signable file (e.g., PDF) is created:
     - Either in a `document_files` table with a `storage_path`, or
     - As a Supabase Storage object with a known key.
   - Update the Documenso route to:
     - Look up this file (by `documentId` and org).
     - Use that file when calling Documenso.

2. **Fallback to latest text version (simpler, good for dev)**  
   - In the Documenso route:
     - If no file is found, look up the latest `document_versions` row for this `documentId`.
     - Use that text content to create a document in Documenso (if their API supports raw content), or
     - Temporarily relax the guard and allow a dummy/placeholder document for testing.

For now, **Option 2** can be used as a stepping stone so that "Send for signature" does not hard-fail in dev, and can be upgraded to Option 1 later.

### 3. Implement the lookup and relax the hard 400

Inside `app/api/sign/documenso/route.ts`:

- Replace the current "no file available" branch with:
  - A lookup of the latest version text for the document, or
  - A lookup of the file row attached to the document (once that exists),
  - And only return 400 if truly nothing usable exists.

- Ensure the success path returns:

```ts
NextResponse.json({ ok: true, envelopeId }, { status: 200 });
```

so that the Builder UI can treat it as success.

### 4. Manual verification

Once the backend is updated:

1. Save a document to Vault from Builder.

2. Click "Send for signature".

3. Confirm that:

   - `/api/sign/documenso` returns HTTP 200 with `{ ok: true, envelopeId: "..." }`.

   - Documenso shows the new envelope.

   - Signature-related `signature_*` events appear in `activity_log` and are visible in `/activity` and `/insights`.

## TODO before GA

- Remove the dev stub behaviour in `/api/sign/documenso` that returns:

  ```ts
  { ok: true, envelopeId: "stub-envelope-no-document-row" }
  ```

  when the document lookup fails.

- Implement the real behaviour instead:

  - Correct org-aware document lookup by `documentId` and `orgId`.

  - Fetch a signable artifact (file row or latest version content).

  - Create a real Documenso envelope and return its ID.

  - Emit `signature_*` events into `activity_log` for visibility in `/activity` and `/insights`.

