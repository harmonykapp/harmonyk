# Signature Flow Audit – Week 12 Day 1

Date: 2025-11-28  
Scope: Trace "Send for signature" button path from UI to API and document current state.

---

## 1. UI Flow

### 1.1 Button Location
- **File:** `components/builder/builder-client.tsx`
- **Line:** 691-698
- **Button:** "Send for Signature" (FileSignature icon)
- **State:** Disabled when `!generatedContent.trim() || !savedDocumentId`

### 1.2 Handler Function
- **Function:** `handleSendForSignature` (line 451)
- **Location:** `components/builder/builder-client.tsx`

**Flow:**
1. Validates `recipientEmail` and `recipientName` are filled
2. Validates `savedDocumentId` exists
3. Sets `sending` state to `true`
4. Makes API call to `/api/sign/documenso`
5. Handles response/errors

### 1.3 API Call Details
- **URL:** `POST /api/sign/documenso`
- **Headers:** `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "documentId": "<savedDocumentId>",
    "recipient": {
      "email": "<recipientEmail>",
      "name": "<recipientName>"
    }
  }
  ```

### 1.4 Error Handling
- Uses `handleApiError` helper for consistent error display
- Shows toast notifications for success/failure
- Logs errors to console with `[builder]` prefix

---

## 2. API Route

### 2.1 Route Location
- **File:** `app/api/sign/documenso/route.ts`
- **Method:** `POST`

### 2.2 Expected Request Body
```typescript
interface SignRequestBody {
  unifiedItemId: string;  // ⚠️ MISMATCH: UI sends "documentId"
  recipient: {
    email: string;
    name: string;
  };
}
```

### 2.3 API Flow
1. Validates request body (expects `unifiedItemId`, not `documentId`)
2. Gets user and org from cookies/auth
3. Fetches `unified_item` from database using `unifiedItemId`
4. Fetches `document` and `version` to get content
5. Calls Documenso API to create envelope
6. Creates `envelope` row in database
7. Logs activity event `send_for_signature`
8. Returns success response

### 2.4 Documenso Client
- **File:** `lib/documenso-client.ts`
- **Function:** `getDocumensoClient()`
- **Base URL:** From `getDocumensoBaseUrl()` (env: `DOCUMENSO_API_URL`)
- **API Token:** From `getDocumensoApiToken()` (env: `DOCUMENSO_API_TOKEN`)
- **Endpoint:** `POST /api/v1/envelopes`

### 2.5 Error Cases
- Missing `unifiedItemId` → 400
- Missing recipient info → 400
- No org found → 500
- Unified item not found → 404
- Document not found → 400
- No document content → 400
- Documenso API error → 502/500
- Envelope creation failed → 500

---

## 3. Critical Issue Found & Fixed

### 3.1 Payload Mismatch (FIXED)
**Problem:** UI sends `documentId` but API expected only `unifiedItemId`

- **UI sends:** `{ documentId: "...", recipient: {...} }`
- **API originally expected:** `{ unifiedItemId: "...", recipient: {...} }`

**Impact:** The API would return 400 "Missing required fields" because `unifiedItemId` was undefined.

**Fix Applied:** Updated API route to accept both `documentId` (Builder) and `unifiedItemId` (Workbench):
- If `unifiedItemId` provided: fetch unified_item, then document (Workbench path)
- If `documentId` provided: use document directly (Builder path)

**Location:**
- UI: `components/builder/builder-client.tsx:478-484`
- API: `app/api/sign/documenso/route.ts:95-185` (updated)

### 3.2 Root Cause
The builder-client saves documents to Vault and gets a `documentId`, but the API route was originally designed only for `unified_item` records (from Workbench). The fix allows both paths.

---

## 4. Current Signature Event Types

### 4.1 Events Found in Code
- `send_for_signature` - Logged in `app/api/sign/documenso/route.ts:360`
  - Emitted when envelope is created successfully
  - Context includes: provider, envelope_id, recipient info, Documenso response

### 4.2 Events Referenced but Not Found
- `signature_request_sent` - Referenced in `app/api/activity/list/route.ts:9`
- `signature_completed` - Referenced in `app/api/activity/list/route.ts:10`
- `signature_*` - Referenced in Activity/Insights filters but not all types are implemented

### 4.3 Activity Log Integration
- **File:** `lib/activity-log.ts`
- **Function:** `logActivity()` is called with:
  - `type: "send_for_signature"`
  - `documentId`, `versionId`, `envelopeId`
  - `context` with provider and recipient info

---

## 5. Error Logging Current State

### 5.1 API Route Logging
- ✅ Console errors with `[sign/documenso]` prefix
- ✅ Detailed error context objects
- ✅ Error messages in API responses

### 5.2 UI Error Handling
- ✅ Uses `handleApiError` helper
- ✅ Shows toast notifications
- ⚠️ Console errors may not surface if API returns 400 silently

### 5.3 Issues
- API validation errors (400) may not provide detailed messages
- Documenso API errors are logged but may not propagate user-friendly messages
- No validation of env vars on startup (fails at runtime)

---

## 6. Environment Variables

### 6.1 Required for Documenso
- `DOCUMENSO_API_URL` - Base URL for Documenso API
- `DOCUMENSO_API_TOKEN` - API token for authentication

### 6.2 Current Validation
- **File:** `lib/documenso-client.ts:35-39`
- Throws error if `DOCUMENSO_API_TOKEN` is missing
- No validation for `DOCUMENSO_API_URL` (may fail at fetch time)

### 6.3 Env Helper
- **File:** `lib/env.ts` (referenced but not found in search)
- Functions: `getDocumensoBaseUrl()`, `getDocumensoApiToken()`

---

## 7. Recommendations for Day 2

1. **Fix payload mismatch:**
   - Option A: Change UI to send `unifiedItemId` (requires creating unified_item records in builder)
   - Option B: Change API to accept `documentId` and look up/create unified_item if needed
   - Option C: Support both `documentId` and `unifiedItemId` in API

2. **Improve error messages:**
   - Return detailed validation errors
   - Surface Documenso API errors with user-friendly messages
   - Validate env vars on startup with clear error messages

3. **Add missing signature events:**
   - Implement `signature_completed` event logging (webhook or polling)
   - Ensure all `signature_*` events are properly logged

4. **Centralize Documenso config:**
   - Create single module for all Documenso config/helpers
   - Add env var validation on startup

---

## 8. Files Involved

### 8.1 UI
- `components/builder/builder-client.tsx` - Button and handler

### 8.2 API
- `app/api/sign/documenso/route.ts` - Main API route

### 8.3 Clients/Helpers
- `lib/documenso-client.ts` - Documenso API client
- `lib/signing/documenso.ts` - Alternative helper (server-side, file-based)
- `lib/activity-log.ts` - Activity logging
- `lib/handle-api-error.ts` - Error handling helper

### 8.4 Documentation
- `docs/ACTIVITY_EVENTS.md` - Event type documentation (needs signature events section)

---

## 9. Next Steps

1. Fix the payload mismatch (Day 2 priority)
2. Add env var validation
3. Improve error messages
4. Test end-to-end flow
5. Document signature event types

