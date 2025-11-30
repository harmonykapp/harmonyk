export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }
  return url.replace(/\/+$/, "");
}

/**
 * Documenso configuration - centralized config for all Documenso integrations.
 * 
 * Environment variables:
 * - DOCUMENSO_BASE_URL: Base URL for Documenso API (defaults to https://app.documenso.com)
 * - DOCUMENSO_API_TOKEN: API token for authentication (required in production)
 * 
 * Note: The old lib/signing/documenso.ts uses different env vars (DOCUMENSO_API_URL, DOCUMENSO_API_KEY, DOCUMENSO_TEAM_ID)
 * but that file is not currently used by the main API route.
 */

/**
 * Get Documenso base URL, defaulting to the hosted cloud URL if not set.
 */
export function getDocumensoBaseUrl(): string {
  // Support both DOCUMENSO_BASE_URL and DOCUMENSO_API_URL for backward compatibility
  const url = process.env.DOCUMENSO_BASE_URL || process.env.DOCUMENSO_API_URL || "https://app.documenso.com";
  return url.replace(/\/+$/, "");
}

/**
 * Get Documenso API token.
 * - In production: throws if not set.
 * - In development: logs a warning if not set but returns empty string.
 * 
 * Supports both DOCUMENSO_API_TOKEN and DOCUMENSO_API_KEY for backward compatibility.
 */
export function getDocumensoApiToken(): string {
  // Support both env var names for backward compatibility
  const token = process.env.DOCUMENSO_API_TOKEN || process.env.DOCUMENSO_API_KEY;
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DOCUMENSO_API_TOKEN (or DOCUMENSO_API_KEY) is required in production");
    }
    console.warn(
      "[documenso] DOCUMENSO_API_TOKEN is not set. Documenso features will not work.",
    );
    return "";
  }
  return token;
}

/**
 * Validate Documenso configuration on startup.
 * Throws if required env vars are missing in production.
 * Logs warnings in development.
 */
export function validateDocumensoConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const baseUrl = getDocumensoBaseUrl();
  const apiToken = getDocumensoApiToken();

  if (!baseUrl || baseUrl === "https://app.documenso.com") {
    // Default URL is fine, but warn if explicitly set to empty
    if (process.env.DOCUMENSO_BASE_URL === "" || process.env.DOCUMENSO_API_URL === "") {
      errors.push("DOCUMENSO_BASE_URL is set to empty string");
    }
  }

  if (!apiToken) {
    if (process.env.NODE_ENV === "production") {
      errors.push("DOCUMENSO_API_TOKEN (or DOCUMENSO_API_KEY) is required in production");
    } else {
      errors.push("DOCUMENSO_API_TOKEN (or DOCUMENSO_API_KEY) is not set (development mode)");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

