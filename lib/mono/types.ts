// Maestro Memory v1 – types
// These mirror the Week 9 schema in 202511260900_mono_memory_v1.sql.

// --- Enums / unions ---------------------------------------------------------

export type MonoTone = "formal" | "neutral" | "friendly" | "punchy" | "technical";

export type MonoRiskProfile = "conservative" | "balanced" | "aggressive";

// Where Maestro is being used – aligns with mono_template_usage.builder_type
export type MonoBuilderType = "contract" | "deck" | "accounting";

export const DEFAULT_MONO_TONE: MonoTone = "neutral";
export const DEFAULT_MONO_RISK_PROFILE: MonoRiskProfile = "balanced";
export const DEFAULT_MONO_JURISDICTION = "us";
export const DEFAULT_MONO_LOCALE = "en-US";

// --- Core profile shapes ----------------------------------------------------

export interface MonoOrgProfile {
  orgId?: string | null;
  name?: string | null;
  defaultTone: MonoTone;
  defaultRiskProfile: MonoRiskProfile;
  defaultJurisdiction: string;
  defaultLocale: string;
  notes?: string | null;
}

export interface MonoUserProfile {
  userId?: string;
  orgId?: string | null;
  preferredTone?: MonoTone | null;
  preferredRiskProfile?: MonoRiskProfile | null;
  preferredJurisdiction?: string | null;
  preferredLocale?: string | null;
  role?: string | null;
  notes?: string | null;
}

export interface MonoTemplateUsage {
  id?: string;
  userId: string;
  orgId?: string | null;
  builderType: MonoBuilderType;
  templateKey: string;
  clauseKey?: string | null;
  usageCount?: number;
  lastUsedAt?: Date;
}

export interface MonoProfiles {
  org: MonoOrgProfile;
  user: MonoUserProfile;
}

// The config object we actually hand to prompts.
export interface MonoPreferenceConfig {
  tone: MonoTone;
  riskProfile: MonoRiskProfile;
  jurisdiction: string;
  locale: string;
}

// --- Convenience factories --------------------------------------------------

export function createDefaultOrgProfile(
  overrides: Partial<MonoOrgProfile> = {},
): MonoOrgProfile {
  return {
    orgId: overrides.orgId ?? null,
    name: overrides.name ?? null,
    defaultTone: overrides.defaultTone ?? DEFAULT_MONO_TONE,
    defaultRiskProfile: overrides.defaultRiskProfile ?? DEFAULT_MONO_RISK_PROFILE,
    defaultJurisdiction:
      overrides.defaultJurisdiction ?? DEFAULT_MONO_JURISDICTION,
    defaultLocale: overrides.defaultLocale ?? DEFAULT_MONO_LOCALE,
    notes: overrides.notes ?? null,
  };
}

export function createDefaultUserProfile(
  overrides: Partial<MonoUserProfile> = {},
): MonoUserProfile {
  return {
    userId: overrides.userId,
    orgId: overrides.orgId ?? null,
    preferredTone: overrides.preferredTone ?? null,
    preferredRiskProfile: overrides.preferredRiskProfile ?? null,
    preferredJurisdiction: overrides.preferredJurisdiction ?? null,
    preferredLocale: overrides.preferredLocale ?? null,
    role: overrides.role ?? null,
    notes: overrides.notes ?? null,
  };
}

export function createMonoProfiles(
  input: Partial<MonoProfiles> = {},
): MonoProfiles {
  return {
    org: createDefaultOrgProfile(input.org ?? {}),
    user: createDefaultUserProfile(input.user ?? {}),
  };
}

export function buildMonoPreferenceConfigFromProfiles(
  profiles: MonoProfiles,
): MonoPreferenceConfig {
  const { org, user } = profiles;

  const tone =
    user.preferredTone ??
    org.defaultTone ??
    DEFAULT_MONO_TONE;

  const riskProfile =
    user.preferredRiskProfile ??
    org.defaultRiskProfile ??
    DEFAULT_MONO_RISK_PROFILE;

  const jurisdiction =
    user.preferredJurisdiction ??
    org.defaultJurisdiction ??
    DEFAULT_MONO_JURISDICTION;

  const locale =
    user.preferredLocale ??
    org.defaultLocale ??
    DEFAULT_MONO_LOCALE;

  return {
    tone,
    riskProfile,
    jurisdiction,
    locale,
  };
}

