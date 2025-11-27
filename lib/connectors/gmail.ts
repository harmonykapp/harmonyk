const GMAIL_OAUTH_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const GOOGLE_OAUTH_CLIENT_ID = requireEnv("GOOGLE_OAUTH_CLIENT_ID");
const GOOGLE_OAUTH_CLIENT_SECRET = requireEnv("GOOGLE_OAUTH_CLIENT_SECRET");

export type GmailOAuthTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export type GmailError = {
  code: string;
  message: string;
  retryable: boolean;
};

export function getGmailAuthUrl(params: { redirectUri: string }) {
  const { redirectUri } = params;

  const search = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    scope: GMAIL_OAUTH_SCOPE,
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${search.toString()}`;
}

export async function exchangeGmailCodeForTokens(params: {
  code: string;
  redirectUri: string;
}): Promise<GmailOAuthTokens> {
  const { code, redirectUri } = params;

  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Failed to exchange Gmail auth code: ${res.status} ${res.statusText} – ${text}`,
    );
  }

  const json = (await res.json()) as GmailOAuthTokens;
  if (!json.access_token) {
    throw new Error("Gmail token response missing access_token");
  }

  return json;
}

export function mapGmailError(err: unknown): GmailError {
  if (err instanceof Error) {
    const message = err.message ?? "Unknown error";

    if (message.includes("429") || message.toLowerCase().includes("rate")) {
      return {
        code: "rate_limited",
        message,
        retryable: true,
      };
    }

    if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
      return {
        code: "unauthorized",
        message,
        retryable: false,
      };
    }

    if (message.includes("invalid_grant")) {
      return {
        code: "invalid_grant",
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

  return {
    code: "unknown",
    message: String(err),
    retryable: false,
  };
}

// ---------------------------------------------------------------------------
// Gmail listing helpers
// ---------------------------------------------------------------------------

export type NormalizedGmailMessage = {
  id: string;
  subject: string | null;
  from: string | null;
  date: string | null;
  messageId: string | null;
  snippet: string | null;
  attachmentCount: number;
  attachments: {
    filename: string | null;
    mimeType: string | null;
    size: number | null;
  }[];
};

const GMAIL_MESSAGES_ENDPOINT =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages";

export const MAX_GMAIL_MESSAGES_PER_RUN = 20;

async function fetchJsonWithAuth(url: string, accessToken: string) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Gmail API request failed: ${res.status} ${res.statusText} – ${text}`,
    );
  }

  return res.json();
}

type GmailHeader = { name?: string; value?: string };

function headerValue(headers: GmailHeader[] | undefined, name: string): string | null {
  if (!headers) return null;
  const h = headers.find((hdr) => hdr.name?.toLowerCase() === name.toLowerCase());
  return h?.value ?? null;
}

export async function listRecentGmailMessagesWithMetadata(params: {
  tokens: GmailOAuthTokens;
  maxMessages?: number;
}): Promise<NormalizedGmailMessage[]> {
  const accessToken = params.tokens.access_token;
  if (!accessToken) {
    throw new Error("Missing Gmail access token");
  }

  const maxMessages = Math.min(
    params.maxMessages ?? MAX_GMAIL_MESSAGES_PER_RUN,
    MAX_GMAIL_MESSAGES_PER_RUN,
  );

  // 1) List recent messages that have attachments (simple heuristic for contracts)
  const listParams = new URLSearchParams({
    maxResults: String(maxMessages),
    q: "has:attachment",
  });

  const listJson = (await fetchJsonWithAuth(
    `${GMAIL_MESSAGES_ENDPOINT}?${listParams.toString()}`,
    accessToken,
  )) as {
    messages?: Array<{ id?: string | null }>;
  };

  const messages = listJson.messages ?? [];

  if (!messages.length) return [];

  const results: NormalizedGmailMessage[] = [];

  // 2) Fetch metadata for each message
  for (const msg of messages) {
    if (!msg.id) continue;

    const detailParams = new URLSearchParams({
      format: "metadata",
      metadataHeaders: ["Subject", "From", "Date", "Message-ID"].join(","),
    });

    const detailJson = (await fetchJsonWithAuth(
      `${GMAIL_MESSAGES_ENDPOINT}/${msg.id}?${detailParams.toString()}`,
      accessToken,
    )) as {
      id?: string;
      snippet?: string;
      payload?: {
        headers?: GmailHeader[];
        parts?: Array<{
          filename?: string;
          mimeType?: string;
          body?: { size?: number; attachmentId?: string };
        }>;
      };
    };

    const headers = detailJson.payload?.headers ?? [];
    const subject = headerValue(headers, "Subject");
    const from = headerValue(headers, "From");
    const date = headerValue(headers, "Date");
    const messageId = headerValue(headers, "Message-ID");

    const attachments =
      detailJson.payload?.parts
        ?.filter((p) => p.body?.attachmentId)
        .map((p) => ({
          filename: p.filename ?? null,
          mimeType: p.mimeType ?? null,
          size: typeof p.body?.size === "number" ? p.body.size : null,
        })) ?? [];

    results.push({
      id: detailJson.id ?? msg.id,
      subject,
      from,
      date,
      messageId,
      snippet: detailJson.snippet ?? null,
      attachmentCount: attachments.length,
      attachments,
    });
  }

  return results;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listRecentGmailMessagesWithRetry(params: {
  tokens: GmailOAuthTokens;
  maxMessages?: number;
  maxAttempts?: number;
}): Promise<NormalizedGmailMessage[]> {
  const maxAttempts =
    params.maxAttempts && params.maxAttempts > 0 ? params.maxAttempts : 3;
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      return await listRecentGmailMessagesWithMetadata(params);
    } catch (err) {
      const mapped = mapGmailError(err);

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

export async function refreshGmailAccessTokenIfNeeded(
  tokens: GmailOAuthTokens,
): Promise<GmailOAuthTokens> {
  if (!tokens.refresh_token) {
    return tokens;
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
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
      `Failed to refresh Gmail access token: ${res.status} ${res.statusText} – ${text}`,
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  return {
    ...tokens,
    access_token: json.access_token,
    expires_in: json.expires_in ?? tokens.expires_in,
    scope: json.scope ?? tokens.scope,
    token_type: json.token_type ?? tokens.token_type,
  };
}

