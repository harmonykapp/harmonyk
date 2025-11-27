// Google Drive connector helpers (v1)

// Week 10 – Day 2: auth helpers + error mapping.

//

// Notes:

// - This file focuses on building the auth URL, exchanging codes, and

//   normalising errors.

// - It does NOT yet persist connector_accounts or log Activity; API routes

//   will evolve in later patches.

const GOOGLE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export const GOOGLE_DRIVE_SCOPES = [

  "https://www.googleapis.com/auth/drive.readonly",

];

export type GoogleOAuthTokens = {

  access_token: string;

  refresh_token?: string;

  expires_in: number;

  scope?: string;

  token_type: string;

  id_token?: string;

};

export type GoogleDriveError = {

  code: string;

  message: string;

  retryable: boolean;

};

function requireEnv(name: string): string {

  const value = process.env[name];

  if (!value) {

    throw new Error(`Missing required env var: ${name}`);

  }

  return value;

}

export function getGoogleDriveAuthUrl(options: {

  redirectUri: string;

  state?: string;

}): string {

  const clientId = requireEnv("GOOGLE_OAUTH_CLIENT_ID");

  const params = new URLSearchParams({

    client_id: clientId,

    redirect_uri: options.redirectUri,

    response_type: "code",

    access_type: "offline",

    prompt: "consent",

    scope: GOOGLE_DRIVE_SCOPES.join(" "),

  });

  if (options.state) {

    params.set("state", options.state);

  }

  return `${GOOGLE_OAUTH_BASE}?${params.toString()}`;

}

export async function exchangeCodeForTokens(params: {

  code: string;

  redirectUri: string;

}): Promise<GoogleOAuthTokens> {

  const clientId = requireEnv("GOOGLE_OAUTH_CLIENT_ID");

  const clientSecret = requireEnv("GOOGLE_OAUTH_CLIENT_SECRET");

  const body = new URLSearchParams({

    code: params.code,

    client_id: clientId,

    client_secret: clientSecret,

    redirect_uri: params.redirectUri,

    grant_type: "authorization_code",

  });

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {

    method: "POST",

    headers: { "Content-Type": "application/x-www-form-urlencoded" },

    body,

  });

  if (!res.ok) {

    const text = await res.text();

    throw new Error(

      `Google token exchange failed: ${res.status} ${res.statusText} – ${text}`,

    );

  }

  return (await res.json()) as GoogleOAuthTokens;

}

export async function refreshAccessToken(params: {

  refreshToken: string;

}): Promise<GoogleOAuthTokens> {

  const clientId = requireEnv("GOOGLE_OAUTH_CLIENT_ID");

  const clientSecret = requireEnv("GOOGLE_OAUTH_CLIENT_SECRET");

  const body = new URLSearchParams({

    refresh_token: params.refreshToken,

    client_id: clientId,

    client_secret: clientSecret,

    grant_type: "refresh_token",

  });

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {

    method: "POST",

    headers: { "Content-Type": "application/x-www-form-urlencoded" },

    body,

  });

  if (!res.ok) {

    const text = await res.text();

    throw new Error(

      `Google token refresh failed: ${res.status} ${res.statusText} – ${text}`,

    );

  }

  return (await res.json()) as GoogleOAuthTokens;

}

export function mapGoogleDriveError(err: unknown): GoogleDriveError {

  const message =

    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown Google error";

  // Crude mapping based on common Drive/OAuth errors. We will refine this as

  // we see real-world payloads.

  if (message.includes("rateLimitExceeded") || message.includes("userRateLimitExceeded")) {

    return {

      code: "rate_limit",

      message,

      retryable: true,

    };

  }

  if (message.includes("invalid_grant")) {

    return {

      code: "invalid_grant",

      message,

      retryable: false,

    };

  }

  if (message.includes("insufficientPermissions")) {

    return {

      code: "insufficient_permissions",

      message,

      retryable: false,

    };

  }

  return {

    code: "unknown",

    message,

    retryable: false,

  };

}

// ---------------------------------------------------------------------------
// Drive file listing helpers
// ---------------------------------------------------------------------------

export type NormalizedDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  owners: { emailAddress?: string | null }[];
  webViewLink?: string | null;
  sizeBytes?: number | null;
};

const GOOGLE_DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";

export const MAX_DRIVE_FILES_PER_RUN = 50;

export const SUPPORTED_DRIVE_MIME_TYPES = [
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation",
  "application/pdf",
];

async function listRecentDriveFilesOnce(params: {
  tokens: GoogleOAuthTokens;
  maxFiles?: number;
}): Promise<NormalizedDriveFile[]> {
  const { tokens } = params;
  const maxFiles = Math.min(params.maxFiles ?? MAX_DRIVE_FILES_PER_RUN, MAX_DRIVE_FILES_PER_RUN);

  const accessToken = tokens.access_token;
  if (!accessToken) {
    throw new Error("Missing Google Drive access token");
  }

  const query = new URLSearchParams({
    pageSize: String(maxFiles),
    orderBy: "modifiedTime desc",
    q: "trashed = false",
    fields:
      "files(id,name,mimeType,modifiedTime,owners(emailAddress),webViewLink,size)",
  });

  const res = await fetch(`${GOOGLE_DRIVE_FILES_ENDPOINT}?${query.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Google Drive list files failed: ${res.status} ${res.statusText} – ${text}`,
    );
  }

  const json = (await res.json()) as {
    files?: Array<{
      id?: string;
      name?: string;
      mimeType?: string;
      modifiedTime?: string;
      owners?: { emailAddress?: string }[];
      webViewLink?: string;
      size?: string;
    }>;
  };

  const files = json.files ?? [];

  return files
    .filter((f) => f.id && f.name && f.mimeType && f.modifiedTime)
    .map((f) => ({
      id: f.id as string,
      name: f.name as string,
      mimeType: f.mimeType as string,
      modifiedTime: f.modifiedTime as string,
      owners: f.owners ?? [],
      webViewLink: f.webViewLink ?? null,
      sizeBytes: f.size ? Number(f.size) || null : null,
    }));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listRecentDriveFilesWithRetry(params: {
  tokens: GoogleOAuthTokens;
  maxFiles?: number;
  maxAttempts?: number;
}): Promise<NormalizedDriveFile[]> {
  const maxAttempts = params.maxAttempts && params.maxAttempts > 0 ? params.maxAttempts : 3;
  let attempt = 0;

  // Simple exponential backoff on retryable errors (e.g. rate limits)
  // 1st retry: 1s, 2nd retry: 2s, 3rd retry: 4s, ...
  // We cap attempts to keep Day 4 behaviour predictable.
  while (true) {
    attempt += 1;
    try {
      return await listRecentDriveFilesOnce(params);
    } catch (err) {
      const mapped = mapGoogleDriveError(err);

      if (!mapped.retryable || attempt >= maxAttempts) {
        throw err;
      }

      const backoffMs = 1000 * Math.pow(2, attempt - 1);
      await delay(backoffMs);
      continue;
    }
  }
}

// ---------------------------------------------------------------------------
// Token refresh helper
// ---------------------------------------------------------------------------

export async function refreshDriveAccessTokenIfNeeded(
  tokens: GoogleOAuthTokens,
): Promise<GoogleOAuthTokens> {
  // If we don't have a refresh token, there's nothing we can do. Caller will
  // just have to handle 401s and prompt the user to reconnect.
  if (!tokens.refresh_token) {
    return tokens;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Can't refresh without client credentials; fall back to existing token.
    return tokens;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokens.refresh_token as string,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Failed to refresh Google Drive access token: ${res.status} ${res.statusText} – ${text}`,
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  // Merge new access token fields into the existing token object.
  return {
    ...tokens,
    access_token: json.access_token,
    expires_in: json.expires_in ?? tokens.expires_in,
    scope: json.scope ?? tokens.scope,
    token_type: json.token_type ?? tokens.token_type,
  };
}

