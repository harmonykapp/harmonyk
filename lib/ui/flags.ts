// UI feature flags (PGW4+).
// NOTE: These are intentionally simple env-driven switches (client-safe).
export type FlagKey =
  | "rooms.enabled"
  | "nav.sidebar.collapsible"
  | "providers.llm.claude"
  | "providers.llm.gemini";

const DEFAULTS: Record<FlagKey, boolean> = {
  "rooms.enabled": true,
  "nav.sidebar.collapsible": true,
  "providers.llm.claude": false,
  "providers.llm.gemini": false,
};

function readEnvBool(key: string): boolean | undefined {
  const raw = process.env[key as keyof NodeJS.ProcessEnv];
  if (raw == null) return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

export function flag(key: FlagKey): boolean {
  // Prefer NEXT_PUBLIC_* so the client can see it, but allow server-only override too.
  const snake = key.replace(/\./g, "_").toUpperCase();
  const fromClient = readEnvBool(`NEXT_PUBLIC_${snake}`);
  if (typeof fromClient === "boolean") return fromClient;

  const fromServer = readEnvBool(snake);
  if (typeof fromServer === "boolean") return fromServer;

  return DEFAULTS[key];
}
