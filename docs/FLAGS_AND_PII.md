# FLAGS_AND_PII — Harmonyk (PG-W1 Day 5)

This document describes the **feature flag** and **PII registry** foundations
for the post-GA Harmonyk build. It is intentionally simple for PG-W1 and will
be expanded in later PG weeks.

---

## 1. Feature Flag Registry (`lib/flags.ts`)

Source of truth:
- File: `lib/flags.ts`
- Type: `FeatureFlagName`
- Helper: `isFeatureEnabled({ flag, orgId?, userId? })`

### 1.1 Flags defined

- `FEATURE_VISUAL_ASSISTANT`
  - Scope: `env`
  - Default: `false`
  - Owner: `product/ai`
  - Purpose: Gate the **Visual Deck Assistant** (slide visuals generation).
  - Expected usage: Deck Builder UI + Maestro visual actions (PG-W11+).

- `FEATURE_PII_EXPORT`
  - Scope: `org`
  - Default: `false`
  - Owner: `product/security`
  - Purpose: Control access to self-service **PII export** tools
    (contacts, engagement, email logs).
  - Expected usage: future `/settings/privacy` UI + export endpoints
    (PG-W19+, PG-W26).

- `FEATURE_PII_ERASURE`
  - Scope: `org`
  - Default: `false`
  - Owner: `product/security`
  - Purpose: Control access to **PII erasure** flows (right-to-be-forgotten
    style operations).
  - Expected usage: admin-only flows and/or support tools for erasure
    (PG-W19+, PG-W26).

- `FEATURE_CONNECTORS_BETA`
  - Scope: `env`
  - Default: `true`
  - Owner: `product/connectors`
  - Purpose: Gate early/beta connectors (Drive, Gmail, Slack, etc.).
  - Expected usage: `/integrations` UI and connector setup flows
    (PG-W21+, PG-W22).

### 1.2 How evaluation works (PG-W1)

- Environment-first:
  - Reads `process.env.NEXT_PUBLIC_<FLAG>` or `<FLAG>`.
  - Accepted truthy values: `1`, `true`, `yes` (case-insensitive).
  - Accepted falsy values: `0`, `false`, `no`.
- If no env override is present, falls back to the **registry default**.
- `orgId` / `userId` parameters are accepted but **not used yet**. They exist
  to avoid refactors when org/user-scoped overrides are added later.

Helper shape:

```ts
isFeatureEnabled({
  flag: "FEATURE_VISUAL_ASSISTANT",
  orgId,
  userId,
});
```

There is also a convenience helper for simple env-wide checks:

```ts
isFeatureEnabledForEnv("FEATURE_CONNECTORS_BETA");
```

### 1.3 Planned evolutions (later PG weeks)

- Add a small `feature_flags_overrides` table (org/user overrides).
- Allow per-org flag toggling in Settings (admin-only).
- Add `/dev/feature-flags` internal view showing all flags, defaults,
  and effective values per org.

---

## 2. PII Registry (`lib/pii.ts`)

Source of truth:
- File: `lib/pii.ts`
- Types: `PiiFieldDefinition`, `PiiCategory`
- Helpers:
  - `listAllPiiFields()`
  - `getPiiFieldsForModel(model)`
  - `getPiiFieldById(id)`

The registry is a **static map** of which models/columns are considered PII,
along with whether they can be exported or erased.

### 2.1 Fields included in PG-W1

Initial focus is on the data structures we know will hold user PII:

- `contacts`:
  - `name`, `email`, `company`
  - Category: `contact`
  - Export: `true`
  - Erase: `true`

- `contact_engagement`:
  - `last_viewed_at`, `view_count`
  - Category: `engagement`
  - Export: `true`
  - Erase: `true`

- `email_logs`:
  - `to_address`
  - Category: `email`
  - Export: `true`
  - Erase: `true` (subject to retention/audit constraints)

- `tasks`:
  - `assignee_id`
  - Category: `task`
  - Export: `true`
  - Erase: `false` (handled via user-level anonymisation instead)

### 2.2 Planned usage

Later PG weeks will use this registry to:

- Power **PII export** tooling (subject access requests).
- Power **PII erasure** tooling (delete or anonymise).
- Feed documentation/privacy pages so we can say exactly which fields are
  covered and how they are treated.

The registry will be extended as new features land:
Connectors (PG-W21/22), email expansion (PG-W19), billing (PG-W23),
and Maestro RAG logging (PG-W13/24).

---

## 3. Status (PG-W1)

- [x] Central feature flag registry (`lib/flags.ts`) created.
- [x] Initial PII registry (`lib/pii.ts`) created.
- [x] Documentation (`docs/FLAGS_AND_PII.md`) created.
- [x] Wire at least one small UI element behind `FEATURE_VISUAL_ASSISTANT`
      via `/app/(protected)/dev/flags/page.tsx` stub UI.
- [ ] Wire future PII export/erasure tools to respect `FEATURE_PII_*` flags.

