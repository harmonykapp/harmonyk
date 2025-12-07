export type FeatureFlags = {
  /**
   * Enables Mono RAG endpoints and any RAG-specific UI surfaces.
   * GA v1 should run with this effectively false in production.
   */
  monoRagEnabled: boolean;

  /**
   * Controls any "Labs" or experimental navigation / UI surfaces.
   * GA v1 should run with this effectively false in production.
   */
  showLabs: boolean;
};

// Legacy feature flag keys (for backward compatibility)
type FeatureFlagKey =
  | "FEATURE_PLAYBOOKS_ENGINE"
  | "FEATURE_SHARE_ACTIONS"
  | "FEATURE_CONNECTORS_EXTRA"
  | "FEATURE_VAULT_EXPERIMENTAL_ACTIONS"
  | "FEATURE_SIGNATURE_ACTIONS";

const FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  FEATURE_PLAYBOOKS_ENGINE: false,
  FEATURE_SHARE_ACTIONS: false,
  FEATURE_CONNECTORS_EXTRA: false,
  FEATURE_VAULT_EXPERIMENTAL_ACTIONS: true, // turn experimental vault actions ON by default
  FEATURE_SIGNATURE_ACTIONS: false,
};

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().trim();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return undefined;
}

/**
 * Returns whether a feature flag is enabled, based on:
 * - NEXT_PUBLIC_<flag> env var (true/false/1/0/etc.)
 * - or a sane default if not set.
 *
 * @deprecated Legacy API. Use getFeatureFlags() for new GA/post-GA flags.
 */
export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  const envKey = `NEXT_PUBLIC_${key}`;
  const raw = process.env[envKey] as string | undefined;

  const parsed = parseBoolean(raw);
  if (parsed !== undefined) return parsed;

  return FLAG_DEFAULTS[key];
}

/**
 * Read feature flags from environment variables.
 *
 * NOTE: For GA, keep all experimental flags effectively false in prod.
 */
export function getFeatureFlags(): FeatureFlags {
  const monoRagEnabled =
    process.env.MONO_RAG_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_MONO_RAG_ENABLED === "true";

  const showLabs =
    process.env.NEXT_PUBLIC_SHOW_LABS === "true" ||
    process.env.SHOW_LABS === "true";

  return {
    monoRagEnabled,
    showLabs,
  };
}

/**
 * Simple helper for guarding RAG behaviour.
 *
 * GA posture: this should be false in all GA environments unless you
 * intentionally flip it for an internal / dev org.
 */
export function isRagEnabled(): boolean {
  return getFeatureFlags().monoRagEnabled;
}
