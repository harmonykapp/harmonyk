# Documenso Integration

Last updated: 2025-11-28 (Week 12 Day 2)

## Overview

Monolyth integrates with [Documenso](https://documenso.com) to enable sending documents for electronic signature. This integration allows users to send documents from Builder or Vault directly to Documenso for signature collection.

## Architecture

### Components

1. **API Route**: `app/api/sign/documenso/route.ts`
   - Handles POST requests to send documents for signature
   - Accepts both `documentId` (from Builder) and `unifiedItemId` (from Workbench)
   - Creates Documenso envelopes and logs activity events

2. **Documenso Client**: `lib/documenso-client.ts`
   - Wraps Documenso API calls
   - Handles authentication and error handling
   - Uses centralized config from `lib/env.ts`

3. **Configuration**: `lib/env.ts`
   - Centralized Documenso configuration
   - Environment variable validation
   - Backward compatibility with multiple env var names

### Flow

1. User clicks "Send for Signature" in Builder or Workbench
2. UI calls `POST /api/sign/documenso` with document ID and recipient info
3. API validates request and fetches document content from database
4. API calls Documenso to create envelope
5. API creates envelope record in database
6. API logs `send_for_signature` activity event
7. API returns success response with envelope ID

## Environment Variables

### Required

- **`DOCUMENSO_API_TOKEN`** (or `DOCUMENSO_API_KEY` for backward compatibility)
  - Your Documenso API token
  - Format: `api_xxxxxxxxxxxxxxxx`
  - Required in production, optional in development (will log warning)

### Optional

- **`DOCUMENSO_BASE_URL`** (or `DOCUMENSO_API_URL` for backward compatibility)
  - Base URL for Documenso API
  - Default: `https://app.documenso.com`
  - Only needed if using self-hosted Documenso

### Example `.env.local`

```bash
# Documenso Integration
DOCUMENSO_API_TOKEN=api_xxxxxxxxxxxxxxxx
DOCUMENSO_BASE_URL=https://app.documenso.com
```

## Setup Instructions

### 1. Get Documenso API Token

1. Sign up for a Documenso account at https://documenso.com
2. Navigate to your account settings → API
3. Generate an API token
4. Copy the token (format: `api_xxxxxxxxxxxxxxxx`)

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
DOCUMENSO_API_TOKEN=api_xxxxxxxxxxxxxxxx
```

If using self-hosted Documenso:

```bash
DOCUMENSO_API_TOKEN=api_xxxxxxxxxxxxxxxx
DOCUMENSO_BASE_URL=https://your-documenso-instance.com
```

### 3. Verify Configuration

The API route validates configuration on each request. In development, missing tokens will log warnings. In production, missing tokens will cause requests to fail with clear error messages.

## API Usage

### Endpoint

`POST /api/sign/documenso`

### Request Body

**From Builder:**
```json
{
  "documentId": "uuid",
  "recipient": {
    "email": "signer@example.com",
    "name": "John Doe"
  }
}
```

**From Workbench:**
```json
{
  "unifiedItemId": "uuid",
  "recipient": {
    "email": "signer@example.com",
    "name": "John Doe"
  }
}
```

### Response

**Success (200):**
```json
{
  "ok": true,
  "envelopeId": "uuid",
  "providerEnvelopeId": "string"
}
```

**Error (400/500/502):**
```json
{
  "ok": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Activity Events

### `send_for_signature`

Logged when a document is successfully sent for signature.

**Context:**
```json
{
  "provider": "documenso",
  "envelope_id": "uuid",
  "provider_envelope_id": "string",
  "recipient_email": "signer@example.com",
  "recipient_name": "John Doe",
  "documenso_response": {...}
}
```

**Visibility:**
- Appears in `/activity` page (filter by "Signatures" group)
- Counted in `/insights` page ("Signatures completed" tile)

## Manual Testing

### Prerequisites

1. Documenso account with API token configured
2. At least one document saved to Vault
3. Valid recipient email address

### Test Steps

#### From Builder

1. Navigate to `/builder`
2. Select a template and generate content
3. Click "Save to Vault" (or "Save Draft")
4. Click "Send for Signature" button
5. Fill in recipient name and email
6. Click "Send"
7. **Expected:** Success toast, modal closes, envelope created in Documenso

#### From Workbench

1. Navigate to `/workbench`
2. Select a document from Vault
3. Click "Send for signature" (if available)
4. Fill in recipient info
5. Click "Send"
6. **Expected:** Success response, envelope created

### Verification

1. **Check Activity Log:**
   - Navigate to `/activity`
   - Filter by "Signatures" group
   - Should see `send_for_signature` event

2. **Check Insights:**
   - Navigate to `/insights`
   - "Signatures completed" tile should show count (if any completed)

3. **Check Documenso:**
   - Log into Documenso dashboard
   - Should see new envelope with recipient
   - Recipient should receive email notification

4. **Check Database:**
   ```sql
   SELECT * FROM envelope 
   WHERE provider = 'documenso' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## Error Handling

### Common Errors

1. **"Documenso is not properly configured"**
   - **Cause:** Missing `DOCUMENSO_API_TOKEN`
   - **Fix:** Add token to `.env.local` and restart dev server

2. **"Failed to create envelope in Documenso"**
   - **Cause:** Documenso API error (invalid token, network issue, etc.)
   - **Fix:** Check token validity, network connectivity, Documenso service status

3. **"No file available for signature"**
   - **Cause:** Document not saved to Vault or missing content
   - **Fix:** Save document to Vault first, ensure version has content

4. **"Unified item not found"** (Workbench only)
   - **Cause:** Invalid `unifiedItemId` or item doesn't exist
   - **Fix:** Ensure document exists in Workbench

### Error Logging

All errors are logged with `[sign/documenso]` prefix and include:
- Error message
- Status code (if applicable)
- Document ID
- Recipient email (sanitized)
- Full error context

Check server logs for detailed error information.

## Troubleshooting

### Envelope Not Created in Documenso

1. Verify API token is correct and active
2. Check Documenso service status
3. Verify network connectivity to Documenso API
4. Check server logs for detailed error messages

### Activity Event Not Logged

1. Check database connection
2. Verify `activity_log` table exists and is accessible
3. Check server logs for activity logging errors (non-fatal)

### Recipient Not Receiving Email

1. Verify email address is correct
2. Check Documenso dashboard for envelope status
3. Check spam/junk folder
4. Verify Documenso email delivery settings

## Future Enhancements

- [ ] Webhook integration for `signature_completed` events
- [ ] Support for multiple recipients
- [ ] Support for CC recipients
- [ ] Custom signing order
- [ ] Document templates in Documenso
- [ ] Status polling for envelope completion
- [ ] Integration with `/signatures` page to show envelope status

## Related Documentation

- `docs/AUDIT_SIGNATURE_FLOW_W12_D1.md` - Day 1 audit findings
- `docs/ACTIVITY_EVENTS.md` - Activity event types
- `docs/INSTRUCTIONS_W12.md` - Week 12 task plan

