/**
 * Brand / naming constants
 *
 * Policy (Dec 2025):
 * - UI copy uses these constants (product + assistant names).
 * - Internal identifiers (db tables, event types, API route paths, env vars)
 *   may still use legacy names (e.g. mono_*, /api/mono) and should NOT be
 *   mass-renamed without a deliberate migration plan.
 */

export const PRODUCT_NAME = "Harmonyk";
export const ASSISTANT_NAME = "Maestro";

// Optional helpers if you want to standardize phrasing in UI/tooltips:
export function assistantLabel() {
  return ASSISTANT_NAME;
}

export function productLabel() {
  return PRODUCT_NAME;
}
