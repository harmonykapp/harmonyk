// PGW4 Day 6: MCP-style tool spine (stubs + guardrails scaffolding)
//
// Key goals:
// - Central registry of tool contracts
// - Typed callTool() entrypoint
// - Guardrail hooks: allowlists, approvals, dry-run, auditing
//
// Non-goals (for PGW4):
// - Wiring to external services
// - Background jobs / queues
// - Secret management

import type {
  ToolInputMap,
  ToolName,
  ToolOutputMap,
  VaultItem,
} from "@/lib/tools/contracts";

export type ToolMode = "readonly" | "write";

export type ToolPolicy = {
  mode: ToolMode;
  requiresApproval: boolean;
  // If present, restricts tool usage to these runtime contexts.
  // This is *advisory* for now; enforcement happens in callTool.
  allowedContexts?: Array<"server" | "client">;
};

export type ToolContext = {
  // Who/what is calling (for audit logs later)
  actor?: {
    userId?: string;
    orgId?: string;
    sessionId?: string;
  };
  // Safety controls
  allowlist?: ToolName[]; // if set, only these tools may run
  approvedTools?: ToolName[]; // which tools are approved for this call chain
  dryRun?: boolean;
  runtime?: "server" | "client";
};

export class ToolError extends Error {
  public readonly code:
    | "TOOL_NOT_FOUND"
    | "TOOL_NOT_ALLOWED"
    | "TOOL_REQUIRES_APPROVAL"
    | "TOOL_NOT_IMPLEMENTED";

  constructor(
    code:
      | "TOOL_NOT_FOUND"
      | "TOOL_NOT_ALLOWED"
      | "TOOL_REQUIRES_APPROVAL"
      | "TOOL_NOT_IMPLEMENTED",
    message: string
  ) {
    super(message);
    this.code = code;
  }
}

type ToolHandler<K extends ToolName> = (args: {
  input: ToolInputMap[K];
  ctx: ToolContext;
}) => Promise<ToolOutputMap[K]>;

type ToolSpec<K extends ToolName> = {
  name: K;
  policy: ToolPolicy;
  handler: ToolHandler<K>;
};

function isApproved(name: ToolName, ctx: ToolContext): boolean {
  if (!ctx.approvedTools || ctx.approvedTools.length === 0) return false;
  return ctx.approvedTools.includes(name);
}

function isAllowed(name: ToolName, ctx: ToolContext): boolean {
  if (!ctx.allowlist || ctx.allowlist.length === 0) return true;
  return ctx.allowlist.includes(name);
}

function assertRuntimeAllowed(spec: ToolSpec<ToolName>, ctx: ToolContext): void {
  const allowed = spec.policy.allowedContexts;
  if (!allowed || allowed.length === 0) return;
  const rt = ctx.runtime ?? "server";
  if (!allowed.includes(rt)) {
    throw new ToolError(
      "TOOL_NOT_ALLOWED",
      `Tool "${spec.name}" is not allowed in runtime "${rt}".`
    );
  }
}

function assertGuardrails(spec: ToolSpec<ToolName>, ctx: ToolContext): void {
  if (!isAllowed(spec.name, ctx)) {
    throw new ToolError(
      "TOOL_NOT_ALLOWED",
      `Tool "${spec.name}" is not in the allowlist for this context.`
    );
  }
  assertRuntimeAllowed(spec, ctx);
  if (spec.policy.requiresApproval && !isApproved(spec.name, ctx)) {
    throw new ToolError(
      "TOOL_REQUIRES_APPROVAL",
      `Tool "${spec.name}" requires approval.`
    );
  }
}

function notImplemented(name: ToolName): never {
  throw new ToolError(
    "TOOL_NOT_IMPLEMENTED",
    `Tool "${name}" is not wired yet (PGW4 scaffolding).`
  );
}

function devAuditLog(name: ToolName, input: unknown): void {
  try {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[tools]", name, input);
    }
  } catch {
    // ignore
  }
}

// --- Stub helpers (purely for better UX in early flows) ---

function makeEmptyList(): VaultItem[] {
  return [];
}

// --- Tool registry ---

const TOOLS: { [K in ToolName]: ToolSpec<K> } = {
  "vault.list": {
    name: "vault.list",
    policy: { mode: "readonly", requiresApproval: false, allowedContexts: ["server", "client"] },
    async handler({ input }) {
      devAuditLog("vault.list", input);
      // Read-only tool; safe empty result for now.
      return { items: makeEmptyList(), nextCursor: undefined };
    },
  },
  "vault.get": {
    name: "vault.get",
    policy: { mode: "readonly", requiresApproval: false, allowedContexts: ["server", "client"] },
    async handler({ input }) {
      devAuditLog("vault.get", input);
      notImplemented("vault.get");
    },
  },
  "vault.search": {
    name: "vault.search",
    policy: { mode: "readonly", requiresApproval: false, allowedContexts: ["server", "client"] },
    async handler({ input }) {
      devAuditLog("vault.search", input);
      // Read-only tool; safe empty result for now.
      return { items: makeEmptyList(), nextCursor: undefined };
    },
  },
  "vault.suggest_name": {
    name: "vault.suggest_name",
    policy: { mode: "readonly", requiresApproval: false, allowedContexts: ["server", "client"] },
    async handler({ input }) {
      devAuditLog("vault.suggest_name", input);
      // Conservative stub: preserve original name.
      return { suggestedName: input.originalName, rationale: "stub" };
    },
  },
  "vault.move": {
    name: "vault.move",
    policy: { mode: "write", requiresApproval: true, allowedContexts: ["server"] },
    async handler({ input, ctx }) {
      devAuditLog("vault.move", input);
      const dryRun = input.dryRun ?? ctx.dryRun ?? false;
      if (dryRun) {
        return { moved: false, dryRun: true };
      }
      notImplemented("vault.move");
    },
  },
  "db.query": {
    name: "db.query",
    policy: { mode: "readonly", requiresApproval: true, allowedContexts: ["server"] },
    async handler({ input }) {
      devAuditLog("db.query", input);
      notImplemented("db.query");
    },
  },
  "rag.retrieve": {
    name: "rag.retrieve",
    policy: { mode: "readonly", requiresApproval: false, allowedContexts: ["server", "client"] },
    async handler({ input }) {
      devAuditLog("rag.retrieve", input);
      // Safe empty result for now; wiring comes later.
      return { chunks: [] };
    },
  },
  "events.log": {
    name: "events.log",
    policy: { mode: "readonly", requiresApproval: false, allowedContexts: ["server", "client"] },
    async handler({ input }) {
      devAuditLog("events.log", input);
      return { ok: true };
    },
  },
};

export function getToolPolicy(name: ToolName): ToolPolicy {
  const spec = TOOLS[name];
  return spec.policy;
}

export async function callTool<K extends ToolName>(
  name: K,
  input: ToolInputMap[K],
  ctx: ToolContext = {}
): Promise<ToolOutputMap[K]> {
  const spec = TOOLS[name] as ToolSpec<ToolName> | undefined;
  if (!spec) {
    throw new ToolError("TOOL_NOT_FOUND", `Tool "${name}" is not registered.`);
  }
  assertGuardrails(spec, ctx);
  const out = await (TOOLS[name] as ToolSpec<K>).handler({ input, ctx });
  return out;
}
