// PGW4: LLMProvider abstraction (default OpenAI stub)
export type GenerateArgs = { system: string; prompt: string; maxTokens?: number };
export type EmbedArgs = { input: string[] };
export type ModerateArgs = { input: string };

export type ProviderName = "openai" | "claude" | "gemini";

export interface LLMProvider {
  name: ProviderName;
  generate(args: GenerateArgs): Promise<string>;
  embed(args: EmbedArgs): Promise<number[][]>;
  moderate?(args: ModerateArgs): Promise<{ flagged: boolean; reasons?: string[] }>;
}

export function getLLMProvider(): LLMProvider {
  const name = resolveProviderName();
  if (name === "openai") return openaiProvider();
  if (name === "claude") return claudeProvider();
  return geminiProvider();
}

/**
 * Provider resolution contract (PGW4):
 * - Server: AI_PROVIDER (preferred)
 * - Client: NEXT_PUBLIC_AI_PROVIDER
 * - Default: "openai"
 *
 * NOTE: In PGW4, claude/gemini are stubs and will throw if used.
 */
export function resolveProviderName(): ProviderName {
  const raw =
    (process.env.AI_PROVIDER ?? process.env.NEXT_PUBLIC_AI_PROVIDER ?? "openai")
      .trim()
      .toLowerCase();

  if (raw === "openai" || raw === "claude" || raw === "gemini") return raw;

  throw new Error(
    `Invalid AI_PROVIDER/NEXT_PUBLIC_AI_PROVIDER "${raw}". Expected one of: openai|claude|gemini.`
  );
}

function openaiProvider(): LLMProvider {
  return {
    name: "openai",
    async generate() {
      throw new Error("LLM.generate not wired in PGW4 scaffolding");
    },
    async embed() {
      throw new Error("LLM.embed not wired in PGW4 scaffolding");
    },
    async moderate() {
      return { flagged: false };
    },
  };
}

function claudeProvider(): LLMProvider {
  return {
    name: "claude",
    async generate() {
      throw new Error("Claude provider not wired in PGW4 scaffolding");
    },
    async embed() {
      throw new Error("Claude provider not wired in PGW4 scaffolding");
    },
    async moderate() {
      return { flagged: false };
    },
  };
}

function geminiProvider(): LLMProvider {
  return {
    name: "gemini",
    async generate() {
      throw new Error("Gemini provider not wired in PGW4 scaffolding");
    },
    async embed() {
      throw new Error("Gemini provider not wired in PGW4 scaffolding");
    },
    async moderate() {
      return { flagged: false };
    },
  };
}

