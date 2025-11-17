// lib/ai.ts
const GENERATE_ENDPOINT = "/api/ai/generate";
const DEFAULT_RETRY_DELAY_MS = 250;
const MAX_ATTEMPTS = 2;

export type Triage = "contract" | "deck" | "generic";

export interface Analysis {
  summary: string;
  risks?: string[];
  suggestions?: string[];
}

export interface GenOptions {
  templateId?: string;
  docId?: string;
  triage?: Triage;
  tone?: "formal" | "neutral" | "casual";
  maxTokens?: number;
}

type GenerateRequest = {
  prompt: string;
  options?: GenOptions;
};

type GenerateResponse = {
  content: string;
};

function isGenerateResponse(payload: unknown): payload is GenerateResponse {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      typeof (payload as { content?: unknown }).content === "string"
  );
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function generateDraft(
  prompt: string,
  options: GenOptions = {}
): Promise<string> {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    throw new Error("Prompt is required to generate a draft.");
  }

  const payload: GenerateRequest = {
    prompt: normalizedPrompt,
    options,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(GENERATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `AI request failed (${response.status}): ${text || response.statusText}`
        );
      }

      const json: unknown = await response.json();
      if (!isGenerateResponse(json)) {
        throw new Error("Invalid AI response payload.");
      }

      return json.content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown AI error.");
      if (attempt >= MAX_ATTEMPTS) {
        break;
      }
      await delay(DEFAULT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError ?? new Error("Unable to generate draft.");
}
