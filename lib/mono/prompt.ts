// Mono Memory v1 – prompt helpers
//
// This file is the glue between:
//  - MonoPreferenceConfig (tone, risk profile, jurisdiction, locale)
//  - The actual system prompt we hand to OpenAI for Builder / Mono.
//
// Usage pattern (example for Contracts Builder):
//
//   import { getMonoProfiles, buildMonoPreferenceConfig } from "@/lib/mono/memory";
//   import { buildMonoAwareSystemPrompt } from "@/lib/mono/prompt";
//
//   const profiles = await getMonoProfiles(/* DB rows mapped to MonoOrg/UserProfile */);
//   const prefs = buildMonoPreferenceConfig(profiles);
//   const systemPrompt = buildMonoAwareSystemPrompt(BASE_SYSTEM_PROMPT, prefs);
//
//   const messages = [
//     { role: "system", content: systemPrompt },
//     { role: "user", content: userPrompt },
//   ];
//
// Week 9 goal: keep this pure – no DB calls or OpenAI calls in here.

import type { MonoPreferenceConfig } from "./types";

/**
 * Build a human-readable block of instructions that describes the
 * org/user preferences in a way that is easy for the model to follow.
 */
export function buildMonoPreferenceInstruction(
  config: MonoPreferenceConfig,
): string {
  const lines: string[] = [];

  lines.push("Apply these user / organization preferences when drafting or editing:");
  lines.push(`- Tone: ${config.tone}`);
  lines.push(`- Legal risk posture: ${config.riskProfile}`);
  lines.push(`- Jurisdiction: ${config.jurisdiction}`);
  lines.push(`- Locale / language: ${config.locale}`);

  lines.push("");
  lines.push(
    "You MUST respect these preferences when choosing clauses, boilerplate language,",
  );
  lines.push(
    "and negotiation positions. If a user request conflicts with these preferences,",
  );
  lines.push("you should explain the conflict and then follow the user's explicit choice.",
  );

  return lines.join("\n");
}

/**
 * Wrap an existing base system prompt with Mono preferences so that
 * Contracts Builder (and later, Deck Builder / Accounts) can be
 * 'memory-aware' without every call site re-implementing the same text.
 */
export function buildMonoAwareSystemPrompt(
  baseSystemPrompt: string,
  config: MonoPreferenceConfig,
): string {
  const preferencesBlock = buildMonoPreferenceInstruction(config);

  return [
    baseSystemPrompt.trim(),
    "",
    "----",
    "MONO MEMORY PREFERENCES",
    preferencesBlock,
  ].join("\n");
}

/**
 * Optional debug helper – can be used temporarily in dev logs to verify
 * which preferences are being applied for a given user / org.
 */
export function formatMonoPreferenceConfigForDebug(
  config: MonoPreferenceConfig,
): string {
  return [
    "[mono] preference config:",
    `  tone=${config.tone}`,
    `  riskProfile=${config.riskProfile}`,
    `  jurisdiction=${config.jurisdiction}`,
    `  locale=${config.locale}`,
  ].join("\n");
}

