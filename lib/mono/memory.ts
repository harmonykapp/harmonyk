// Mono Memory v1 – helpers
//
// IMPORTANT:
// - This file is deliberately light on DB concerns.
// - Route handlers / services should load rows from Supabase and then
//   call these helpers to assemble configs.
//
// We can later add DB-backed helpers (eg. getMonoProfilesFromDb) once
// we settle on the server-side Supabase client patterns.

import type {
  MonoBuilderType,
  MonoOrgProfile,
  MonoPreferenceConfig,
  MonoProfiles,
  MonoTemplateUsage,
  MonoUserProfile,
} from "./types";
import {
  DEFAULT_MONO_JURISDICTION,
  DEFAULT_MONO_LOCALE,
  DEFAULT_MONO_RISK_PROFILE,
  DEFAULT_MONO_TONE,
  buildMonoPreferenceConfigFromProfiles,
  createMonoProfiles,
} from "./types";

// Shape passed into getMonoProfiles – typically DB rows mapped into TS types.
export interface MonoProfilesInput {
  orgProfile?: Partial<MonoOrgProfile> | null;
  userProfile?: Partial<MonoUserProfile> | null;
}

/**
 * getMonoProfiles
 *
 * Combines (optional) org + user profile data with sensible defaults.
 *
 * In v1 this is purely in-memory – callers are expected to:
 *  - Load org/user rows from Supabase in their route / service.
 *  - Map them into MonoOrgProfile / MonoUserProfile-ish shapes.
 *  - Pass them into this function.
 */
export async function getMonoProfiles(
  input: MonoProfilesInput = {},
): Promise<MonoProfiles> {
  const profiles = createMonoProfiles({
    org: {
      defaultTone: DEFAULT_MONO_TONE,
      defaultRiskProfile: DEFAULT_MONO_RISK_PROFILE,
      defaultJurisdiction: DEFAULT_MONO_JURISDICTION,
      defaultLocale: DEFAULT_MONO_LOCALE,
      ...(input.orgProfile ?? {}),
    },
    user: {
      ...(input.userProfile ?? {}),
    },
  });

  return profiles;
}

/**
 * recordTemplateUsage
 *
 * Fire-and-forget hook that callers can use to log template / clause usage.
 *
 * v1 implementation is intentionally a no-op stub so it is safe to call
 * everywhere without introducing DB coupling. We will wire this to Supabase
 * later in Week 9/10.
 */
export interface RecordTemplateUsageParams {
  userId: string;
  orgId?: string | null;
  builderType: MonoBuilderType;
  templateKey: string;
  clauseKey?: string | null;
  source?: "ai" | "user";
}

export async function recordTemplateUsage(
  params: RecordTemplateUsageParams,
): Promise<void> {
  if (!params.userId) {
    // Nothing to do – invalid caller usage.
    return;
  }

  // TODO: implement Supabase insert into mono_template_usage.
  // For now we keep this as a safe no-op. Light debug logging in non-prod
  // is acceptable while we build out the rest of Week 9.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[mono] recordTemplateUsage (stub)", {
      userId: params.userId,
      orgId: params.orgId,
      builderType: params.builderType,
      templateKey: params.templateKey,
      clauseKey: params.clauseKey,
      source: params.source ?? "user",
    } as MonoTemplateUsage);
  }
}

/**
 * buildMonoPreferenceConfig
 *
 * Turn a pair of (org, user) profiles into the compact config that we hand
 * into prompts. This wraps the lower-level helper from types.ts so callers
 * don't need to know about internal details.
 */
export function buildMonoPreferenceConfig(
  profiles: MonoProfiles,
): MonoPreferenceConfig {
  return buildMonoPreferenceConfigFromProfiles(profiles);
}

/**
 * Convenience factory for callers that only know raw org/user profile objects.
 */
export function buildMonoPreferenceConfigFromInput(
  input: MonoProfilesInput = {},
): MonoPreferenceConfig {
  const profiles = createMonoProfiles({
    org: {
      defaultTone: DEFAULT_MONO_TONE,
      defaultRiskProfile: DEFAULT_MONO_RISK_PROFILE,
      defaultJurisdiction: DEFAULT_MONO_JURISDICTION,
      defaultLocale: DEFAULT_MONO_LOCALE,
      ...(input.orgProfile ?? {}),
    },
    user: {
      ...(input.userProfile ?? {}),
    },
  });

  return buildMonoPreferenceConfigFromProfiles(profiles);
}

