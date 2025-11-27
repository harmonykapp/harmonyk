import { NextRequest, NextResponse } from "next/server";
import {
  listRecentGmailMessagesWithRetry,
  mapGmailError,
  MAX_GMAIL_MESSAGES_PER_RUN,
  refreshGmailAccessTokenIfNeeded,
} from "@/lib/connectors/gmail";
import { supabaseAdmin } from "@/lib/connectors/accounts";
import { emitConnectorActivity } from "@/lib/activity/connectors";

type GmailAccountRow = {
  id: string;
  provider: string;
  status: string;
  token_json: unknown;
};

export async function POST(req: NextRequest) {
  const startedAtMs = Date.now();
  let jobId: string | null = null;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      accountId?: string;
      maxMessages?: number;
    };

    const maxMessages =
      body.maxMessages && body.maxMessages > 0
        ? Math.min(body.maxMessages, MAX_GMAIL_MESSAGES_PER_RUN)
        : MAX_GMAIL_MESSAGES_PER_RUN;

    // 1) Resolve which Gmail account to use
    let account: GmailAccountRow | null = null;

    if (body.accountId) {
      const { data, error } = await supabaseAdmin
        .from("connector_accounts")
        .select("id, provider, status, token_json")
        .eq("id", body.accountId)
        .eq("provider", "gmail")
        .single();

      if (error) {
        throw new Error(`Failed to load Gmail connector account: ${error.message}`);
      }

      account = data as GmailAccountRow;
    } else {
      const { data, error } = await supabaseAdmin
        .from("connector_accounts")
        .select("id, provider, status, token_json")
        .eq("provider", "gmail")
        .eq("status", "connected")
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) {
        throw new Error(`Failed to load Gmail connector accounts: ${error.message}`);
      }

      account = (data?.[0] as GmailAccountRow) ?? null;
    }

    if (!account) {
      return NextResponse.json(
        {
          error: "No connected Gmail account found",
        },
        { status: 400 },
      );
    }

    const startedAt = new Date().toISOString();

    // 2) Create a job record
    const { data: job, error: jobError } = await supabaseAdmin
      .from("connector_jobs")
      .insert({
        account_id: account.id,
        kind: "gmail_import",
        status: "running",
        started_at: startedAt,
        attempts: 1,
        meta_json: {
          source: "manual_sync",
          max_messages: maxMessages,
        },
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new Error(
        `Failed to create Gmail connector job: ${jobError?.message ?? "unknown error"}`,
      );
    }

    jobId = job.id as string;

    await emitConnectorActivity("connector_sync_started", {
      provider: "gmail",
      account_id: account.id,
      run_id: jobId,
    });

    // 3) Refresh token if needed and list recent messages
    let tokens = account.token_json as any;
    tokens = await refreshGmailAccessTokenIfNeeded(tokens);

    await supabaseAdmin
      .from("connector_accounts")
      .update({ token_json: tokens })
      .eq("id", account.id);

    const messages = await listRecentGmailMessagesWithRetry({
      tokens,
      maxMessages,
    });

    const rows = messages.map((m) => ({
      account_id: account!.id,
      provider: "gmail",
      external_id: m.id,
      title: m.subject ?? "(no subject)",
      mime: "message/rfc822",
      size: null,
      modified_at: m.date ?? startedAt,
      url: null,
      meta_json: {
        from: m.from,
        date: m.date,
        message_id: m.messageId,
        snippet: m.snippet,
        attachment_count: m.attachmentCount,
        attachments: m.attachments,
      },
    }));

    if (rows.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("connector_files")
        .upsert(rows, { onConflict: "account_id,external_id" });

      if (upsertError) {
        throw new Error(`Failed to upsert Gmail connector_files: ${upsertError.message}`);
      }
    }

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;

    await supabaseAdmin
      .from("connector_jobs")
      .update({
        status: "completed",
        finished_at: finishedAt,
        last_error: null,
        meta_json: {
          source: "manual_sync",
          max_messages: maxMessages,
          message_count: rows.length,
        },
      })
      .eq("id", jobId);

    await emitConnectorActivity("connector_sync_completed", {
      provider: "gmail",
      account_id: account.id,
      run_id: jobId,
      message_count: rows.length,
      duration_ms: durationMs,
    });

    return NextResponse.json({
      status: "ok",
      provider: "gmail",
      account_id: account.id,
      run_id: jobId,
      message_count: rows.length,
    });
  } catch (err) {
    const mapped = mapGmailError(err);

    if (jobId) {
      const finishedAt = new Date().toISOString();
      await supabaseAdmin
        .from("connector_jobs")
        .update({
          status: "failed",
          finished_at: finishedAt,
          last_error: mapped.message,
          meta_json: {
            error_code: mapped.code,
            retryable: mapped.retryable,
          },
        })
        .eq("id", jobId);

      await emitConnectorActivity("connector_sync_failed", {
        provider: "gmail",
        account_id: null,
        run_id: jobId,
        error_code: mapped.code,
        error_msg: mapped.message,
        retryable: mapped.retryable,
      });
    }

    return NextResponse.json(
      {
        error: "Gmail import failed",
        code: mapped.code,
        message: mapped.message,
        run_id: jobId,
      },
      { status: 500 },
    );
  }
}

