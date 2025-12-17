/**
 * Legacy keys kept ONLY for migration/backwards-compat.
 *
 * Policy:
 * - Do not introduce new "monolyth" strings anywhere else.
 * - If you need a legacy key, import it from here.
 * - These can be removed later once we're confident all users have migrated.
 */

export const LEGACY_THEME_STORAGE_KEY = "monolyth-theme";
export const LEGACY_VAULT_STORAGE_KEY = "monolyth-vault";
export const LEGACY_VAULT_UPDATED_EVENT = "monolyth:vault-updated";
export const LEGACY_ONBOARDING_SEEN_KEY = "monolyth_onboarding_seen_v1";

