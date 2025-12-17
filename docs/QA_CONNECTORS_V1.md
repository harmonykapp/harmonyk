# QA – Connectors v1 (Drive + Gmail)

Version: v0.10.0  
Scope: Google Drive + Gmail metadata-first connectors, /integrations UI, Activity logging.

---

## 0. Pre-flight

Environment:

- App running locally on http://localhost:3000 with `npm run dev`

- Supabase project ref: `uibtjqhyklrwvjclbmdy`

- Migrations applied, tables exist:

  - `connector_accounts`

  - `connector_jobs`

  - `connector_files`

  - `activity_log`

- Env vars set in `.env.local`:

  - `NEXT_PUBLIC_SUPABASE_URL`

  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

  - `SUPABASE_SERVICE_ROLE_KEY`

  - `GOOGLE_OAUTH_CLIENT_ID`

  - `GOOGLE_OAUTH_CLIENT_SECRET`

Google Cloud:

- OAuth consent screen is configured and **published**

- Drive + Gmail APIs are enabled

- Authorized redirect URI includes:

  - `http://localhost:3000/api/connectors/drive/callback`

  - `http://localhost:3000/api/connectors/gmail/callback` (if used)

---

## 1. Google Drive – first connect

1. Go to **/integrations**.

2. In the **Google Drive** card, click **Reconnect Google Drive** (or Connect).

3. Complete the Google OAuth flow and return to the app.

Expected:

- /integrations shows status badge: **Connected**

- "Last sync" text is present (may be "—" until first sync)

- In Supabase:

  - `connector_accounts` has **one** row with `provider = 'google_drive'` and `status = 'connected'`

  - No duplicate rows for the same provider

---

## 2. Google Drive – manual sync

1. On **/integrations**, in the Drive card, click **Sync now**.

2. Wait for the status text at the bottom of the card to update.

Expected in UI:

- Status text shows a success message, e.g.  
  `Import completed. file_count = N`

- "Last sync" timestamp updates to the current time.

Expected in Supabase:

- `connector_jobs`:

  - New row with `provider = 'google_drive'`

  - `status = 'completed'`

  - `attempts >= 1`

  - `last_error` is null

  - `meta_json` includes file count

- `connector_files`:

  - ≥ 1 row exists for `provider = 'google_drive'`

  - Includes recent Docs/Sheets/Slides/PDFs within the per-run limits

- `activity_log`:

  - New rows with `type = 'connector_sync_started'` and `type = 'connector_sync_completed'`

  - `context` contains `{ "provider": "google_drive", ... }`

---

## 3. Google Drive – auth failure + recovery

Goal: confirm that Drive failures are surfaced but do not crash the app.

Option A (recommended, manual revoke):

1. In your Google Account → Security → Third-party access, remove the Harmonyk app.

2. Back in **/integrations**, click **Sync now** in the Drive card.

Expected:

- Drive card shows an error message in the "Last error" area, e.g. `401 Unauthorized` / `Invalid Credentials`.

- Status text changes to a readable error line (not a crash / blank).

- `connector_jobs` has a new row with:

  - `status = 'failed'`

  - `last_error` populated with the Google API error

- `activity_log` has a new row with:

  - `type = 'connector_sync_failed'`

  - `context.error_code` and `context.error_msg` populated.

Recovery:

1. Click **Reconnect Google Drive**.

2. Complete the OAuth flow again.

3. Click **Sync now**.

Expected:

- Drive card returns to **Connected** state.

- Last error text is either cleared or shows the previous error with a new successful sync underneath.

- New `connector_sync_started` / `connector_sync_completed` rows appear in `activity_log`.

---

## 4. Gmail – first connect

1. On **/integrations**, in the **Gmail** card, click **Reconnect Gmail** (or Connect).

2. Complete the Gmail OAuth flow and return to the app.

Expected:

- Gmail card shows status badge: **Connected**

- "Last sync" text appears after first import.

- Supabase `connector_accounts`:

  - Row with `provider = 'gmail'`, `status = 'connected'`

  - No more than one row for `provider = 'gmail'`

---

## 5. Gmail – manual sync

1. On **/integrations**, click **Sync again** in the Gmail card.

Expected in UI:

- Status line updates to: `Import completed. message_count = N`

- "Last sync" timestamp updates.

Expected in Supabase:

- `connector_jobs`:

  - New row with `provider = 'gmail'`, `status = 'completed'`

  - `meta_json` includes counts for messages and attachments

- `connector_files` (if Gmail metadata is stored there) **or** Gmail-specific table:

  - Metadata rows present for the imported messages / attachments

- `activity_log`:

  - New rows with `type = 'connector_sync_started'` / `connector_sync_completed'`

  - `context.provider = 'gmail'`

Notes:

- Gmail import is **metadata only**: headers + attachment metadata. Bodies are not stored.

- Implementation may be restricted to a specific label (e.g. "Contracts") and a small recent slice.

---

## 6. Gmail – error + recovery

Optional but recommended.

1. As with Drive, revoke the app in your Google Account or change scopes to trigger a 401/403 on the next sync.

2. Click **Sync again** on the Gmail card.

Expected:

- Gmail card shows a readable error snippet (auth error or rate limit).

- `connector_jobs` row with `status = 'failed'`, `last_error` populated.

- `activity_log` row with `type = 'connector_sync_failed'` and `context.provider = 'gmail'`.

Recovery:

1. Click **Reconnect Gmail** and complete OAuth again.

2. Click **Sync again**.

Expected:

- Card returns to **Connected** state.

- A new successful job & `connector_sync_completed` entry appear.

---

## 7. Limits & safety checks

Confirm the following behaviours:

1. **One account per provider**

   - Repeated "Reconnect Google Drive" or "Reconnect Gmail" does **not** create new rows.

   - `connector_accounts` has at most:

     - 1 `google_drive` row

     - 1 `gmail` row

2. **Per-run item limits**

   - Drive sync only pulls a small recent slice of files (honours `MAX_FILES_PER_RUN` and `MAX_FILE_SIZE_MB`).

   - Gmail sync only pulls a small recent batch of threads/messages (honours `MAX_GMAIL_MESSAGES_PER_RUN` or equivalent constant).

3. **UI resilience**

   - Errors never crash the /integrations page.

   - Sync buttons stay usable after errors.

---

## 8. Smoke test checklist (Connectors slice)

- [ ] /integrations loads with both Drive + Gmail cards.

- [ ] Google Drive connect + reconnect flow works.

- [ ] Drive manual sync imports recent files and shows success status.

- [ ] Gmail connect + reconnect flow works.

- [ ] Gmail manual sync imports recent metadata and shows success status.

- [ ] `connector_accounts`, `connector_jobs`, and `connector_files` show consistent data.

- [ ] `activity_log` contains `connector_sync_started`, `connector_sync_completed`, and `connector_sync_failed` rows with context for both providers.

- [ ] /activity page loads without errors (connector events may still display under generic labels – known issue for later Insights work).

