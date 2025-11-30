import { NextRequest, NextResponse } from "next/server";

import {
  type AccountsDateRange,
  type AccountsPackResponse,
  type AccountsPackType,
  getInvestorAccountsSnapshotPackForOrg,
  getSaaSExpensesPackForOrg,
} from "@/lib/accounts/packs";
import { getRouteAuthContext } from "@/lib/auth/route-auth";
import { logActivity } from "@/lib/activity-log";

interface AccountsPacksApiRequestBody {
  type?: AccountsPackType;
  packType?: AccountsPackType;
  period?: AccountsDateRange;
}

function isValidDateRange(value: unknown): value is AccountsDateRange {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AccountsDateRange>;
  return (
    typeof candidate.start === "string" &&
    typeof candidate.end === "string" &&
    candidate.start.trim().length > 0 &&
    candidate.end.trim().length > 0
  );
}

function resolvePackType(body: AccountsPacksApiRequestBody): AccountsPackType | null {
  const type = body.type ?? body.packType;
  if (!type) {
    return null;
  }
  if (type === "saas_monthly_expenses" || type === "investor_accounts_snapshot") {
    return type;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const auth = await getRouteAuthContext(req as unknown as Request);

    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const orgId = auth.orgId;
    const supabase = auth.supabase;

    let body: AccountsPacksApiRequestBody;
    try {
      body = (await req.json()) as AccountsPacksApiRequestBody;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON body",
        },
        { status: 400 },
      );
    }

    const packType = resolvePackType(body);
    if (!packType) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing or invalid pack type. Use 'saas_monthly_expenses' or 'investor_accounts_snapshot'.",
        },
        { status: 400 },
      );
    }

    const period = body.period && isValidDateRange(body.period) ? body.period : undefined;

    let pack: AccountsPackResponse;

    if (packType === "saas_monthly_expenses") {
      pack = await getSaaSExpensesPackForOrg(supabase, {
        orgId,
        period,
      });
    } else {
      pack = await getInvestorAccountsSnapshotPackForOrg(supabase, {
        orgId,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        pack,
        requestId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[/api/accounts/packs] error", { requestId, error });

    // Best-effort logging into activity_log; swallow errors from logActivity
    try {
      const auth = await getRouteAuthContext(req as unknown as Request);
      if (auth.orgId) {
        await logActivity({
          orgId: auth.orgId,
          userId: auth.userId,
          type: "accounts_pack_failure",
          context: {
            request_id: requestId,
            error:
              error instanceof Error
                ? { message: error.message, name: error.name }
                : { message: String(error) },
          },
          source: "accounts",
          triggerRoute: "/api/accounts/packs",
        });
      }
    } catch (loggingError) {
      console.error(
        "[/api/accounts/packs] failed to log activity for error",
        loggingError,
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Internal error while generating accounts pack",
        requestId,
      },
      { status: 500 },
    );
  }
}

