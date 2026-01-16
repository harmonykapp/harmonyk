// PGW4: LLMProvider abstraction (default OpenAI stub)
export type GenerateArgs = { system: string; prompt: string; maxTokens?: number };
export type EmbedArgs = { input: string[] };
export type ModerateArgs = { input: string };

export interface LLMProvider {
  name: "openai" | "claude" | "gemini";
  generate(args: GenerateArgs): Promise<string>;
  embed(args: EmbedArgs): Promise<number[][]>;
  moderate?(args: ModerateArgs): Promise<{ flagged: boolean; reasons?: string[] }>;
}

export function getLLMProvider(): LLMProvider {
  return openaiProvider();
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

