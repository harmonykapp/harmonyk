// PGW4 Day 6: MCP-style tool spine contracts (typed; minimal; no wiring)
//
// Notes:
// - These are *contracts* only. Implementations live in the tool spine.
// - Keep payloads JSON-serializable and safe for logs (no raw secrets).
// - Prefer unknown + narrowing over any.

export type ToolName =
  | "vault.list"
  | "vault.get"
  | "vault.search"
  | "vault.suggest_name"
  | "vault.move"
  | "db.query"
  | "rag.retrieve"
  | "events.log";

export type VaultSource = "vault" | "drive" | "gmail" | "upload" | "unknown";
export type VaultKind = "doc" | "pdf" | "deck" | "sheet" | "email" | "folder" | "unknown";

export type VaultItem = {
  id: string;
  name: string;
  source: VaultSource;
  kind: VaultKind;
  path?: string;
  modifiedAt?: string; // ISO 8601
  sizeBytes?: number;
  mimeType?: string;
};

export type VaultListInput = {
  folderId?: string;
  limit?: number;
  cursor?: string;
};

export type VaultListOutput = {
  items: VaultItem[];
  nextCursor?: string;
};

export type VaultGetInput = {
  id: string;
  includeContent?: boolean;
};

export type VaultGetOutput = {
  item: VaultItem;
  // Content is optional; keep it flexible for later (text, bytes, signed URLs).
  content?: { type: "text"; text: string } | { type: "url"; url: string };
};

export type VaultSearchInput = {
  query: string;
  limit?: number;
  cursor?: string;
  kinds?: VaultKind[];
  sources?: VaultSource[];
};

export type VaultSearchOutput = {
  items: VaultItem[];
  nextCursor?: string;
};

export type VaultSuggestNameInput = {
  originalName: string;
  context?: {
    kind?: VaultKind;
    source?: VaultSource;
    hints?: string[];
  };
};

export type VaultSuggestNameOutput = {
  suggestedName: string;
  rationale?: string;
};

export type VaultMoveInput = {
  id: string;
  toFolderId: string;
  dryRun?: boolean;
  // Future: approval tokens, policy receipts, etc.
};

export type VaultMoveOutput = {
  moved: boolean;
  dryRun: boolean;
};

export type DBQueryInput = {
  // Keep it explicit: SQL + params. Later we can add a safe query builder.
  sql: string;
  params?: unknown[];
  limit?: number;
};

export type DBQueryOutput = {
  rows: Array<Record<string, unknown>>;
};

export type RAGRetrieveInput = {
  query: string;
  topK?: number;
  scope?: "vault-only" | "all";
};

export type RAGChunk = {
  id: string;
  text: string;
  score?: number;
  source?: string;
  meta?: Record<string, unknown>;
};

export type RAGRetrieveOutput = {
  chunks: RAGChunk[];
};

export type EventsLogInput = {
  name: string;
  payload?: Record<string, unknown>;
};

export type EventsLogOutput = {
  ok: true;
};

export type ToolInputMap = {
  "vault.list": VaultListInput;
  "vault.get": VaultGetInput;
  "vault.search": VaultSearchInput;
  "vault.suggest_name": VaultSuggestNameInput;
  "vault.move": VaultMoveInput;
  "db.query": DBQueryInput;
  "rag.retrieve": RAGRetrieveInput;
  "events.log": EventsLogInput;
};

export type ToolOutputMap = {
  "vault.list": VaultListOutput;
  "vault.get": VaultGetOutput;
  "vault.search": VaultSearchOutput;
  "vault.suggest_name": VaultSuggestNameOutput;
  "vault.move": VaultMoveOutput;
  "db.query": DBQueryOutput;
  "rag.retrieve": RAGRetrieveOutput;
  "events.log": EventsLogOutput;
};
