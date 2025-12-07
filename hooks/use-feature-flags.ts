"use client";

import { useMemo } from "react";
import type { FeatureFlags } from "@/lib/feature-flags";
import { getFeatureFlags } from "@/lib/feature-flags";

/**
 * Client-side hook for reading feature flags that are derived from env.
 *
 * This is primarily for gating UI elements (e.g. Labs / RAG controls).
 * For GA v1, env defaults should make all experimental flags false.
 */
export function useFeatureFlags(): FeatureFlags {
  // Env vars are static at build; memo just avoids extra work on re-renders.
  return useMemo(() => getFeatureFlags(), []);
}

