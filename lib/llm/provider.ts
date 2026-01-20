// PGW4: LLMProvider abstraction (default OpenAI; optional Claude/Gemini via env)
//
// Goals:
// - Default provider remains OpenAI (no behavior change).
// - Provider selection is env-driven and safe to evaluate in client components.
// - Claude/Gemini can be enabled/disabled via UI flags (env-based).
// - All providers are stubs for now (wiring comes later).

import { flag } from "@/lib/ui/flags";

export type LLMProviderName = "openai" | "claude" | "gemini";

export type GenerateArgs = {
  system: string;
  prompt: string;
  maxTokens?: number;
};

export type EmbedArgs = {
  input: string[];
};

export type ModerateArgs = {
  input: string;
};

export interface LLMProvider {
  name: LLMProviderName;
  generate(args: GenerateArgs): Promise<string>;
  embed(args: EmbedArgs): Promise<number[][]>;
  moderate?(args: ModerateArgs): Promise<{ flagged: boolean; reasons?: string[] }>;
}

function normalizeProviderName(raw: string | undefined): LLMProviderName | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "openai") return "openai";
  if (v === "claude") return "claude";
  if (v === "gemini") return "gemini";
  return undefined;
}

function isProviderEnabled(name: LLMProviderName): boolean {
  if (name === "openai") return true;
  if (name === "claude") return flag("providers.llm.claude");
  if (name === "gemini") return flag("providers.llm.gemini");
  return false;
}

/**
 * Resolve provider name from env vars.
 *
 * Supported:
 * - NEXT_PUBLIC_LLM_PROVIDER (preferred; available to client)
 * - LLM_PROVIDER (server-only override; ignored in browser)
 *
 * Safety:
 * - If an optional provider is selected but not enabled, falls back to "openai".
 */
export function resolveProviderName(): LLMProviderName {
  const fromClient = normalizeProviderName(process.env.NEXT_PUBLIC_LLM_PROVIDER);
  const fromServer = normalizeProviderName(process.env.LLM_PROVIDER);

  const selected: LLMProviderName = fromClient ?? fromServer ?? "openai";
  if (isProviderEnabled(selected)) return selected;
  return "openai";
}

export function getLLMProvider(): LLMProvider {
  const name = resolveProviderName();
  if (name === "claude") return claudeProvider();
  if (name === "gemini") return geminiProvider();
  return openaiProvider();
}

function openaiProvider(): LLMProvider {
  return {
    name: "openai",
    async generate() {
      // Intentionally not wired in PGW4 scaffolding.
      throw new Error("LLM.generate not wired (provider=openai)");
    },
    async embed() {
      // Intentionally not wired in PGW4 scaffolding.
      throw new Error("LLM.embed not wired (provider=openai)");
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
      // Intentionally not wired in PGW4 scaffolding.
      throw new Error("LLM.generate not wired (provider=claude)");
    },
    async embed() {
      // Intentionally not wired in PGW4 scaffolding.
      throw new Error("LLM.embed not wired (provider=claude)");
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
      // Intentionally not wired in PGW4 scaffolding.
      throw new Error("LLM.generate not wired (provider=gemini)");
    },
    async embed() {
      // Intentionally not wired in PGW4 scaffolding.
      throw new Error("LLM.embed not wired (provider=gemini)");
    },
    async moderate() {
      return { flagged: false };
    },
  };
}

