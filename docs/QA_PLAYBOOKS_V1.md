# QA – Playbooks v1 (Week 7)

This checklist is for validating the Playbooks v1 implementation before moving on to Week 8.

Focus areas:

- Engine: `/api/playbooks/run` and `/api/playbooks/undo`

- UI: `/playbooks` and Workbench integration

- Seeds: Inbound NDA, Aging Proposals, Receipt → Vault

- Events: dev test endpoint + real share/sign hooks

- Insights: time-saved card on `/insights`

---

## 1. Schema & seed sanity

1. In Supabase SQL editor, confirm tables exist:

   - `playbooks`

   - `playbook_runs`

   - `playbook_steps`

2. Check a few rows:

   ```sql
   select * from playbooks limit 10;
   select * from playbook_runs order by started_at desc limit 10;
   select * from playbook_steps order by started_at desc limit 10;
   ```

3. Run the dev seed (if needed):

   - From the repo root:

     ```sql
     -- or use the existing /api/dev/playbooks/seed endpoint
     ```

   - Confirm the three library Playbooks exist:

     - Inbound NDA

     - Aging Proposals

     - Receipt → Vault

---

## 2. /playbooks UI

1. Go to `/playbooks`.

2. Confirm:

   - Playbooks list renders without errors.

   - You can select a Playbook and see:

     - Name

     - Status (draft/enabled/disabled)

     - Scope summary

3. Run a **dry-run**:

   - Click **Run Playbook** with dry-run enabled.

   - Expect:

     - No server errors.

     - A new run appears in the "Last runs" area (if implemented).

4. If there are errors:

   - Check browser console for `/api/playbooks/run`.

   - Check server logs for Supabase errors.

---

## 3. Workbench integration

1. Go to `/workbench`.

2. Select a row in the main table.

3. Click **Run Playbook (dry-run)**.

4. Expect:

   - No errors in the UI.

   - A toast indicating the run was triggered (if implemented).

   - A new run visible on `/playbooks` for the selected Playbook.

5. If nothing happens:

   - Check network tab for `/api/playbooks/run`.

   - Confirm at least one Playbook exists and is `enabled`.

---

## 4. Dev event tester

1. Go to `/playbooks`.

2. Scroll to the bottom and find **Dev: Test Playbook Event**.

3. Choose `share_link_created` and click **Send test event**.

4. Expect:

   - A success message with `Enabled playbooks seen: X`.

   - No server crashes.

5. Repeat for `signature_completed`.

This validates the `queuePlaybooksForEvent` pipeline without touching real Share/Sign flows.

---

## 5. Real share/sign hooks (smoke tests)

1. Use the app to create a real **Share link** using the existing Share flow.

2. Confirm:

   - Share behaves as before (no regressions).

   - No new errors in server logs.

3. If possible, complete a **Documenso signature** and trigger the webhook.

4. Confirm:

   - Webhook processing still works as before.

   - No new errors in server logs.

Note: v1 does **not** show any explicit UI reaction to these events; they simply feed the Playbooks engine in the background.

---

## 6. Insights – time saved

1. Go to `/playbooks` and run at least one Playbook (dry-run is fine).

2. Go to `/insights`.

3. Confirm the **"Playbooks – Time Saved (v1)"** card:

   - Shows a non-zero total time after at least one run.

   - Shows run counts (runs with stats vs without stats).

4. If the card fails:

   - Check network tab for `/api/insights/playbooks-summary`.

   - Check server logs for `[insights] playbooks-summary` errors.

---

## 7. Definition of "done" for Week 7

- `/playbooks` loads and can run Playbooks (at least dry-run).

- Workbench can trigger a Playbook against a selection.

- Dev event tester works for `share_link_created` and `signature_completed`.

- Real Share/Sign flows are unchanged (no regressions).

- `playbook_runs` and `playbook_steps` fill correctly.

- `/insights` shows a time-saved card that updates after runs.

At this point, Week 7 Playbooks v1 is considered functionally complete and ready for Week 8 polish and editor UX.

