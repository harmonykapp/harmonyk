import { NextRequest, NextResponse } from "next/server";

import {
  listRecentDriveFilesWithRetry,
  mapGoogleDriveError,
  MAX_DRIVE_FILES_PER_RUN,
  SUPPORTED_DRIVE_MIME_TYPES,
  refreshDriveAccessTokenIfNeeded,
} from "@/lib/connectors/google-drive";
import { supabaseAdmin } from "@/lib/connectors/accounts";
import { emitConnectorActivity } from "@/lib/activity/connectors";

type DriveAccountRow = {
  id: string;
  provider: string;
  status: string;
  token_json: unknown;
};

// POST /api/connectors/drive/import
//
// v1 behaviour:
// - Picks a connected google_drive account (or a specific one via body.accountId)
// - Creates a connector_jobs row for this run
// - Fetches recent Drive files within limits
// - Upserts metadata into connector_files
// - Marks the job as completed/failed
//
// NOTE:
// - Activity events (connector_sync_started/completed/failed) will be wired
//   once we plug into the central Activity logging helper.

export async function POST(req: NextRequest) {
  const startedAtMs = Date.now();
  let jobId: string | null = null;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      accountId?: string;
      maxFiles?: number;
    };

    const maxFiles =
      body.maxFiles && body.maxFiles > 0
        ? Math.min(body.maxFiles, MAX_DRIVE_FILES_PER_RUN)
        : MAX_DRIVE_FILES_PER_RUN;

    // 1) Resolve which Drive account to use
    let account: DriveAccountRow | null = null;

    if (body.accountId) {
      const { data, error } = await supabaseAdmin
        .from("connector_accounts")
        .select("id, provider, status, token_json")
        .eq("id", body.accountId)
        .eq("provider", "google_drive")
        .single();

      if (error) {
        throw new Error(`Failed to load connector account: ${error.message}`);
      }

      account = data as DriveAccountRow;
    } else {
      const { data, error } = await supabaseAdmin
        .from("connector_accounts")
        .select("id, provider, status, token_json")
        .eq("provider", "google_drive")
        .eq("status", "connected")
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) {
        throw new Error(`Failed to load connector accounts: ${error.message}`);
      }

      account = (data?.[0] as DriveAccountRow) ?? null;
    }

    if (!account) {
      return NextResponse.json(
        {
          error: "No connected Google Drive account found",
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
        kind: "drive_import",
        status: "running",
        started_at: startedAt,
        attempts: 1,
        meta_json: {
          source: "manual_sync",
          max_files: maxFiles,
        },
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new Error(
        `Failed to create connector job: ${jobError?.message ?? "unknown error"}`,
      );
    }

    jobId = job.id as string;

    // Emit Activity: sync started
    await emitConnectorActivity("connector_sync_started", {
      provider: "google_drive",
      account_id: account.id,
      run_id: jobId,
    });

    // 3) Fetch recent Drive files
    let tokens = account.token_json as any;

    // 3) Ensure we have a fresh access token before calling Drive.
    //    If refresh fails (revoked / invalid_grant), this will throw and the
    //    error will be surfaced as a failed job with a clear message.
    tokens = await refreshDriveAccessTokenIfNeeded(tokens);

    // Persist updated tokens back to connector_accounts so future runs use
    // the fresh access token.
    await supabaseAdmin
      .from("connector_accounts")
      .update({ token_json: tokens })
      .eq("id", account.id);

    const files = await listRecentDriveFilesWithRetry({
      tokens,
      maxFiles,
    });

    const filtered = files.filter((f) =>
      SUPPORTED_DRIVE_MIME_TYPES.includes(f.mimeType),
    );

    const rows = filtered.map((f) => ({
      account_id: account!.id,
      provider: "google_drive",
      external_id: f.id,
      title: f.name,
      mime: f.mimeType,
      size: f.sizeBytes ?? null,
      modified_at: f.modifiedTime,
      url: f.webViewLink ?? null,
      meta_json: {
        owners: f.owners,
      },
    }));

    // 4) Upsert into connector_files (metadata-first)
    if (rows.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("connector_files")
        .upsert(rows, { onConflict: "account_id,external_id" });

      if (upsertError) {
        throw new Error(`Failed to upsert connector_files: ${upsertError.message}`);
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
          max_files: maxFiles,
          file_count: rows.length,
        },
      })
      .eq("id", jobId);

    // Emit Activity: sync completed
    await emitConnectorActivity("connector_sync_completed", {
      provider: "google_drive",
      account_id: account.id,
      run_id: jobId,
      file_count: rows.length,
      duration_ms: durationMs,
    });

    return NextResponse.json({
      status: "ok",
      provider: "google_drive",
      account_id: account.id,
      run_id: jobId,
      file_count: rows.length,
    });
  } catch (err) {
    const mapped = mapGoogleDriveError(err);

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

      // Emit Activity: sync failed
      await emitConnectorActivity("connector_sync_failed", {
        provider: "google_drive",
        account_id: null,
        run_id: jobId,
        error_code: mapped.code,
        error_msg: mapped.message,
        retryable: mapped.retryable,
      });
    }

    return NextResponse.json(
      {
        error: "Google Drive import failed",
        code: mapped.code,
        message: mapped.message,
        run_id: jobId,
      },
      { status: 500 },
    );
  }
}

