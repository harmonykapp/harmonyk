// PGW4: UI feature flags (env-based)
//
// Notes:
// - Client components can only see NEXT_PUBLIC_* env vars.
// - Server components can see both NEXT_PUBLIC_* and non-public env vars.
// - Keep this small and stable; do not mix with the legacy FeatureFlag registry.

export type UIFlagKey =
  | "rooms.enabled"
  | "nav.sidebar.collapsible"
  | "providers.llm.claude"
  | "providers.llm.gemini";

const DEFAULTS: Record<UIFlagKey, boolean> = {
  "rooms.enabled": true,
  "nav.sidebar.collapsible": true,
  "providers.llm.claude": false,
  "providers.llm.gemini": false,
};

function readEnvBool(raw: string | undefined): boolean | undefined {
  if (raw == null) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return undefined;
}

function toEnvKey(key: UIFlagKey): string {
  // "nav.sidebar.collapsible" -> "NAV_SIDEBAR_COLLAPSIBLE"
  return key.replace(/\./g, "_").toUpperCase();
}

export function flag(key: UIFlagKey): boolean {
  const base = toEnvKey(key);

  // Prefer NEXT_PUBLIC_* so the client can see it.
  const fromClient = readEnvBool(process.env[`NEXT_PUBLIC_${base}`]);
  if (typeof fromClient === "boolean") return fromClient;

  // Allow server-only override (will be undefined in the browser).
  const fromServer = readEnvBool(process.env[base]);
  if (typeof fromServer === "boolean") return fromServer;

  return DEFAULTS[key];
}
