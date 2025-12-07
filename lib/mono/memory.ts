// Mono Memory v1 – helpers
//
// IMPORTANT:
// - Preference helpers are pure and DB-agnostic.
// - Conversation helpers accept an injected Supabase client so routes
//   can control scoping and auth.
// - ActivityLog is the primary store for recent Mono messages.

import type { SupabaseClient } from "@supabase/supabase-js";
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
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[mono] recordTemplateUsage", {
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

// ---------------------------------------------------------------------------
// Conversation memory helpers (ActivityLog-backed)
// ---------------------------------------------------------------------------

export interface MonoMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface GetRecentMonoMessagesParams {
  supabase: SupabaseClient;
  orgId: string;
  userId: string;
  limit?: number;
}

/**
 * getRecentMonoMessages
 *
 * Minimal "memory" layer for Mono backed by activity_log.
 * We read the last N mono_query events for the user/org and turn them
 * into chat-style messages that can be passed to OpenAI.
 */
export async function getRecentMonoMessages(
  params: GetRecentMonoMessagesParams,
): Promise<MonoMessage[]> {
  const { supabase, orgId, userId, limit = 6 } = params;

  if (!orgId || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("activity_log")
    .select("created_at, context")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("type", "mono_query")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[mono] getRecentMonoMessages failed", {
        orgId,
        userId,
        error,
      });
    }
    return [];
  }

  type Row = { created_at: string; context: Record<string, unknown> | null };
  const rows = data as Row[];

  const messages: MonoMessage[] = rows
    .map((row) => {
      const ctx = row.context ?? {};
      const messageValue =
        typeof ctx.message === "string" ? ctx.message : null;
      if (!messageValue) {
        return null;
      }
      const msg: MonoMessage = {
        role: "user",
        content: messageValue,
        createdAt: row.created_at,
      };
      return msg;
    })
    .filter((m): m is MonoMessage => m !== null)
    .reverse(); // Oldest first for prompt ordering

  return messages;
}

