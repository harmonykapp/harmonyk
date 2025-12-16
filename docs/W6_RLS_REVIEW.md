# Week 6 – RLS Review

This document summarizes the current Supabase Row-Level Security (RLS) policies for the main Harmonyk document tables.  
Purpose: confirm that a logged-in user can only see their own/org data, and note any gaps to address in later weeks.

---

## 1. unified_item

- **RLS enabled:** YES

- **Policies:**

  - SELECT:
    - Policy name: `unified_item_org_members_select`
    - Condition: User must be a member of the org that owns the unified_item (via `member` table lookup using `auth.uid()`)

  - INSERT:
    - Policy name: `unified_item_org_members_mod`
    - Condition: User must be a member of the org specified in the new row (via `member` table lookup)

  - UPDATE:
    - Policy name: `unified_item_org_members_mod`
    - Condition: User must be a member of the org that owns the unified_item (via `member` table lookup)

  - DELETE:
    - Policy name: `unified_item_org_members_mod`
    - Condition: User must be a member of the org that owns the unified_item (via `member` table lookup)

### Notes

- Access is scoped by `org_id` and org membership via the `member` table.
- All operations (SELECT, INSERT, UPDATE, DELETE) use the same policy pattern: check that `auth.uid()` exists in `member` table for the row's `org_id`.
- The `unified_item` table links to `document` via `document_id`, so RLS on `document` also affects visibility of related unified items.

---

## 2. document

- **RLS enabled:** YES

- **Policies:**

  - SELECT:
    - Policy name: `document_org_members_select`
    - Condition: User must be a member of the org that owns the document (via `member` table lookup using `auth.uid()`)

  - INSERT:
    - Policy name: `document_org_members_mod`
    - Condition: User must be a member of the org specified in the new row (via `member` table lookup)

  - UPDATE:
    - Policy name: `document_org_members_mod`
    - Condition: User must be a member of the org that owns the document (via `member` table lookup)

  - DELETE:
    - Policy name: `document_org_members_mod`
    - Condition: User must be a member of the org that owns the document (via `member` table lookup)

### Notes

- Access is scoped by `org_id` and org membership via the `member` table.
- All operations use the same policy pattern: check that `auth.uid()` exists in `member` table for the row's `org_id`.
- The `document` table has an `owner_id` field that references `auth.users(id)`, but RLS policies are based on org membership, not direct ownership. This means any member of the org can see/modify documents in that org.
- Related tables (`version`, `share_link`, `envelope`) also have RLS enabled and follow the same org-membership pattern.

---

## 3. activity_log

- **RLS enabled:** YES

- **Policies:**

  - SELECT:
    - Policy name: `activity_log_org_members_select`
    - Condition: User must be a member of the org that owns the activity_log entry (via `member` table lookup using `auth.uid()`)

  - INSERT:
    - Policy name: none (no explicit INSERT policy found)
    - Condition: INSERT operations likely rely on service-role client access or are handled via API routes with service-role permissions

  - UPDATE:
    - Policy name: none (no explicit UPDATE policy found)
    - Condition: UPDATE operations likely rely on service-role client access or are handled via API routes with service-role permissions

  - DELETE:
    - Policy name: none (no explicit DELETE policy found)
    - Condition: DELETE operations likely rely on service-role client access or are handled via API routes with service-role permissions

### Notes

- SELECT is scoped by `org_id` and org membership via the `member` table.
- INSERT/UPDATE/DELETE operations are not directly exposed to users via RLS policies. The `activity_log` table is primarily written to by server-side code using service-role credentials (via `createServerSupabaseClient()`), which bypasses RLS.
- This is appropriate for an audit log: users can read their org's activity, but only the system can write entries.

---

## Summary & Follow-ups

- All three tables (`unified_item`, `document`, `activity_log`) are consistently scoped by `org_id` + org membership via the `member` table lookup pattern.
- All SELECT operations require org membership, ensuring users only see data from orgs they belong to.
- `activity_log` INSERT/UPDATE/DELETE operations rely on service-role access, which is appropriate for audit logging.
- The RLS policies use a consistent pattern: `EXISTS (SELECT 1 FROM public.member m WHERE m.org_id = <table>.org_id AND m.user_id = auth.uid())`.
- **Potential gap to revisit in Week 7+**: Consider whether `document` should have additional owner-based restrictions (e.g., only the `owner_id` can delete, or only owners can modify certain fields), or if org-level access is sufficient for the Beta phase.

