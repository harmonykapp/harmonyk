# Feature Flags

This document tracks the feature flags used in the Harmonyk app as of Week 6.

Flags are read from `NEXT_PUBLIC_<FLAG>` env vars and default to safe values for Beta.

---

## FEATURE_PLAYBOOKS_ENGINE

- **Env key:** `NEXT_PUBLIC_FEATURE_PLAYBOOKS_ENGINE`

- **Default:** `false`

- **Scope:** Playbooks page / automation engine UI.

- **Behavior:**

  - `false`: Show a simple "Playbooks (coming soon)" stub.

  - `true`: Render the full Playbooks engine UI (if implemented).

---

## FEATURE_SHARE_ACTIONS

- **Env key:** `NEXT_PUBLIC_FEATURE_SHARE_ACTIONS`

- **Default:** `false`

- **Scope:** Advanced sharing workflows on the Share screen.

- **Behavior:**

  - `false`: Only basic share flows remain visible; advanced/multi-step flows are hidden or marked "Coming soon".

  - `true`: Advanced share actions are enabled.

---

## FEATURE_CONNECTORS_EXTRA

- **Env key:** `NEXT_PUBLIC_FEATURE_CONNECTORS_EXTRA`

- **Default:** `false`

- **Scope:** Extra connector filters / advanced connector UI on the Workbench.

- **Behavior:**

  - `false`: Extra connector filters are hidden or marked "Coming soon".

  - `true`: Extra connector filters and UI are visible.

---

## FEATURE_VAULT_EXPERIMENTAL_ACTIONS

- **Env key:** `NEXT_PUBLIC_FEATURE_VAULT_EXPERIMENTAL_ACTIONS`

- **Default:** `false`

- **Scope:** Experimental actions in Vault, such as "Open in Builder" from Vault and the 3-dot doc card menu.

- **Behavior:**

  - `false`: Experimental/unfinished actions are hidden or disabled.

  - `true`: Experimental Vault actions are shown (for internal testing).

