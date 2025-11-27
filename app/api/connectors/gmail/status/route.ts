import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/connectors/accounts";

type ConnectorJobRow = {
  id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  meta_json: any;
};

export async function GET(_req: NextRequest) {
  try {
    const { data: accounts, error: accountError } = await supabaseAdmin
      .from("connector_accounts")
      .select("id, provider, status, created_at")
      .eq("provider", "gmail")
      .order("created_at", { ascending: true })
      .limit(1);

    if (accountError) {
      throw new Error(`Failed to load Gmail connector accounts: ${accountError.message}`);
    }

    const account = accounts?.[0];

    if (!account) {
      return NextResponse.json({
        provider: "gmail",
        account_status: "disconnected",
        account_id: null,
        last_sync_time: null,
        last_sync_message_count: null,
        last_error: null,
        last_error_time: null,
      });
    }

    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from("connector_jobs")
      .select("id, status, started_at, finished_at, last_error, meta_json")
      .eq("account_id", account.id)
      .order("started_at", { ascending: false })
      .limit(10);

    if (jobsError) {
      throw new Error(`Failed to load Gmail connector jobs: ${jobsError.message}`);
    }

    const typedJobs = (jobs ?? []) as ConnectorJobRow[];

    const lastCompleted = typedJobs.find((j) => j.status === "completed") ?? null;
    const lastFailed = typedJobs.find((j) => j.status === "failed") ?? null;

    const lastSyncTime = lastCompleted?.finished_at ?? lastCompleted?.started_at ?? null;
    const lastSyncMessageCount =
      (lastCompleted?.meta_json && lastCompleted.meta_json.message_count) ?? null;

    const lastError = lastFailed?.last_error ?? null;
    const lastErrorTime = lastFailed?.finished_at ?? lastFailed?.started_at ?? null;

    return NextResponse.json({
      provider: "gmail",
      account_status: account.status,
      account_id: account.id as string,
      last_sync_time: lastSyncTime,
      last_sync_message_count: lastSyncMessageCount,
      last_error: lastError,
      last_error_time: lastErrorTime,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "unknown error";

    return NextResponse.json(
      {
        error: "Failed to load Gmail connector status",
        message,
      },
      { status: 500 },
    );
  }
}

