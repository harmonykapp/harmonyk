/* eslint-disable @typescript-eslint/consistent-type-definitions */
// Central feature-flag registry (PGW4)
export type FlagKey =
  | "ff.sidebar_v2"
  | "ff.rooms_route"
  | "ff.mcp_spine"
  | "rooms.enabled"
  | "nav.sidebar.collapsible"
  | "providers.llm.claude"
  | "providers.llm.gemini";

const defaults: Record<FlagKey, boolean> = {
  // Ship behind flags: keep defaults OFF unless explicitly enabled
  "ff.sidebar_v2": false,
  "ff.rooms_route": false,
  "ff.mcp_spine": false,

  // Sub-flags (may be used when the parent FF is enabled)
  "rooms.enabled": true,
  "nav.sidebar.collapsible": true,
  "providers.llm.claude": false,
  "providers.llm.gemini": false,
};

export function flag(key: FlagKey): boolean {
  // IMPORTANT (Next.js/Turbopack):
  // In client bundles, only static `process.env.NEXT_PUBLIC_*` access is guaranteed.
  // Avoid computed `process.env[...]` lookups or you'll get SSR/client divergence + hydration mismatches.
  let raw: string | undefined;

  switch (key) {
    case "ff.sidebar_v2":
      raw = process.env.NEXT_PUBLIC_FF_SIDEBAR_V2 ?? process.env.FF_SIDEBAR_V2;
      break;
    case "ff.rooms_route":
      raw = process.env.NEXT_PUBLIC_FF_ROOMS_ROUTE ?? process.env.FF_ROOMS_ROUTE;
      break;
    case "ff.mcp_spine":
      raw = process.env.NEXT_PUBLIC_FF_MCP_SPINE ?? process.env.FF_MCP_SPINE;
      break;
    case "rooms.enabled":
      raw = process.env.NEXT_PUBLIC_ROOMS_ENABLED ?? process.env.ROOMS_ENABLED;
      break;
    case "nav.sidebar.collapsible":
      raw =
        process.env.NEXT_PUBLIC_NAV_SIDEBAR_COLLAPSIBLE ??
        process.env.NAV_SIDEBAR_COLLAPSIBLE;
      break;
    case "providers.llm.claude":
      raw =
        process.env.NEXT_PUBLIC_PROVIDERS_LLM_CLAUDE ??
        process.env.PROVIDERS_LLM_CLAUDE;
      break;
    case "providers.llm.gemini":
      raw =
        process.env.NEXT_PUBLIC_PROVIDERS_LLM_GEMINI ??
        process.env.PROVIDERS_LLM_GEMINI;
      break;
    default: {
      // Exhaustiveness guard
      const _exhaustive: never = key;
      raw = _exhaustive;
    }
  }
  if (raw === "true") return true;
  if (raw === "false") return false;
  return defaults[key];
}
/**
 * Feature flag registry for Harmonyk (PGW1 foundation).
 *
 * Design goals:
 * - Single source of truth for flag names and defaults.
 * - Environment-driven overrides for now (NEXT_PUBLIC_* vars).
 * - Ready to add org/user overrides later without changing callers.
 *
 * NOTE: This module is intentionally light: it does NOT talk to the DB yet.
 */

export type FeatureFlagName =
  | "FEATURE_VISUAL_ASSISTANT"
  | "FEATURE_PII_EXPORT"
  | "FEATURE_PII_ERASURE"
  | "FEATURE_CONNECTORS_BETA";

export type FeatureFlagScope = "env" | "org" | "user";

export interface FeatureFlagDefinition {
  key: FeatureFlagName;
  description: string;
  defaultValue: boolean;
  scope: FeatureFlagScope;
  owner: string;
  tags: string[];
}

const FEATURE_FLAGS: Record<FeatureFlagName, FeatureFlagDefinition> = {
  FEATURE_VISUAL_ASSISTANT: {
    key: "FEATURE_VISUAL_ASSISTANT",
    description:
      "Controls access to the visual deck assistant (slide visuals generation).",
    defaultValue: false,
    scope: "env",
    owner: "product/ai",
    tags: ["ai", "deck-builder", "experimental"],
  },
  FEATURE_PII_EXPORT: {
    key: "FEATURE_PII_EXPORT",
    description:
      "Controls whether orgs can export PII (contacts, engagement, emails) via self-service tools.",
    defaultValue: false,
    scope: "org",
    owner: "product/security",
    tags: ["pii", "compliance", "export"],
  },
  FEATURE_PII_ERASURE: {
    key: "FEATURE_PII_ERASURE",
    description:
      "Controls whether orgs can request/trigger erasure of PII (right-to-be-forgotten style flows).",
    defaultValue: false,
    scope: "org",
    owner: "product/security",
    tags: ["pii", "compliance", "erasure"],
  },
  FEATURE_CONNECTORS_BETA: {
    key: "FEATURE_CONNECTORS_BETA",
    description:
      "Controls early access to new external connectors (Drive, Gmail, Slack, etc.).",
    defaultValue: true,
    scope: "env",
    owner: "product/connectors",
    tags: ["connectors", "beta"],
  },
};

function readEnvFlag(name: FeatureFlagName): boolean | undefined {
  // Prefer NEXT_PUBLIC_* for client-awareness, but fall back to plain flag.
  const envKey = `NEXT_PUBLIC_${name}` as keyof NodeJS.ProcessEnv;
  const raw =
    process.env[envKey] ??
    (process.env[name as keyof NodeJS.ProcessEnv] as string | undefined);

  if (raw == null) return undefined;

  const normalized = raw.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }

  return undefined;
}

export interface IsFeatureEnabledInput {
  flag: FeatureFlagName;
  orgId?: string | null;
  userId?: string | null;
}

/**
 * Main helper for feature-gating.
 *
 * PGW1 behaviour:
 * - Reads env override if present.
 * - Otherwise falls back to registry default.
 * - orgId/userId parameters are accepted but not yet used.
 */
export function isFeatureEnabled(input: IsFeatureEnabledInput): boolean {
  const { flag } = input;
  const def = FEATURE_FLAGS[flag];

  const fromEnv = readEnvFlag(flag);
  if (typeof fromEnv === "boolean") {
    return fromEnv;
  }

  return def.defaultValue;
}

/**
 * Returns the full registry including effective env overrides.
 * Useful for internal /dev views or admin diagnostics.
 */
export function listFeatureFlags(): Array<
  FeatureFlagDefinition & { effectiveValue: boolean; envOverride?: boolean }
> {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlagName[]).map((key) => {
    const def = FEATURE_FLAGS[key];
    const fromEnv = readEnvFlag(key);

    return {
      ...def,
      effectiveValue: typeof fromEnv === "boolean" ? fromEnv : def.defaultValue,
      envOverride: typeof fromEnv === "boolean" ? fromEnv : undefined,
    };
  });
}

/**
 * Helper for server-side usage when you don't care about org/user yet.
 */
export function isFeatureEnabledForEnv(flag: FeatureFlagName): boolean {
  return isFeatureEnabled({ flag });
}

