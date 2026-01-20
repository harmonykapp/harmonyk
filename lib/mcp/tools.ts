// PGW4 Day 6: MCP-style tool spine stubs (typed contracts, read-only first)
//
// Notes:
// - These are *contracts* only. Implementations should be least-privilege and audited.
// - Server-side execution only for data tools. Client may call via API routes later.
// - Keep strict types: no `any`.

export type ToolName =
  | "vault.list"
  | "vault.get"
  | "vault.search"
  | "vault.suggest_name"
  | "vault.move"
  | "db.query"
  | "rag.retrieve"
  | "events.log";

export type ToolContext = Readonly<{
  requestId: string;
  actorId?: string;
  workspaceId?: string;
  source: "ui" | "api" | "worker";
  dryRun?: boolean;
}>;

export type ToolErrorCode =
  | "NOT_IMPLEMENTED"
  | "NOT_AUTHORIZED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL";

export type ToolError = Readonly<{
  code: ToolErrorCode;
  message: string;
  details?: Record<string, unknown>;
}>;

export type ToolOk<T> = Readonly<{
  ok: true;
  data: T;
}>;

export type ToolErr = Readonly<{
  ok: false;
  error: ToolError;
}>;

export type ToolResult<T> = ToolOk<T> | ToolErr;

export type VaultItem = Readonly<{
  id: string;
  name: string;
  mimeType?: string;
  updatedAt?: string;
  sizeBytes?: number;
  path?: string;
}>;

export type VaultListArgs = Readonly<{
  folderId?: string;
  limit?: number;
  cursor?: string;
}>;

export type VaultGetArgs = Readonly<{
  id: string;
}>;

export type VaultSearchArgs = Readonly<{
  query: string;
  limit?: number;
}>;

export type VaultSuggestNameArgs = Readonly<{
  originalName: string;
  hint?: string;
}>;

export type VaultMoveArgs = Readonly<{
  id: string;
  toFolderId: string;
}>;

export type DbQueryArgs = Readonly<{
  // Restrict in implementation: allowlisted templates or prepared statements only.
  sql: string;
  params?: ReadonlyArray<string | number | boolean | null>;
}>;

export type RagRetrieveArgs = Readonly<{
  query: string;
  topK?: number;
  // Later: constraints like roomId, vaultFolderId, docTypes, etc.
}>;

export type RagChunk = Readonly<{
  id: string;
  sourceId: string;
  title?: string;
  snippet: string;
  score?: number;
}>;

export type EventsLogArgs = Readonly<{
  name: string;
  props?: Record<string, unknown>;
}>;

function notImplemented<T>(tool: ToolName): ToolResult<T> {
  return {
    ok: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: `Tool not implemented: ${tool}`,
    },
  };
}

export const tools = {
  vault: {
    async list(
      _ctx: ToolContext,
      _args: VaultListArgs
    ): Promise<ToolResult<{ items: VaultItem[]; nextCursor?: string }>> {
      return notImplemented("vault.list");
    },
    async get(
      _ctx: ToolContext,
      _args: VaultGetArgs
    ): Promise<ToolResult<VaultItem>> {
      return notImplemented("vault.get");
    },
    async search(
      _ctx: ToolContext,
      _args: VaultSearchArgs
    ): Promise<ToolResult<{ items: VaultItem[] }>> {
      return notImplemented("vault.search");
    },
    async suggestName(
      _ctx: ToolContext,
      _args: VaultSuggestNameArgs
    ): Promise<ToolResult<{ suggestedName: string }>> {
      return notImplemented("vault.suggest_name");
    },
    async move(
      _ctx: ToolContext,
      _args: VaultMoveArgs
    ): Promise<ToolResult<{ moved: true }>> {
      return notImplemented("vault.move");
    },
  },
  db: {
    async query(
      _ctx: ToolContext,
      _args: DbQueryArgs
    ): Promise<ToolResult<{ rows: ReadonlyArray<Record<string, unknown>> }>> {
      return notImplemented("db.query");
    },
  },
  rag: {
    async retrieve(
      _ctx: ToolContext,
      _args: RagRetrieveArgs
    ): Promise<ToolResult<{ chunks: RagChunk[] }>> {
      return notImplemented("rag.retrieve");
    },
  },
  events: {
    async log(
      _ctx: ToolContext,
      _args: EventsLogArgs
    ): Promise<ToolResult<{ logged: true }>> {
      return notImplemented("events.log");
    },
  },
} as const;
