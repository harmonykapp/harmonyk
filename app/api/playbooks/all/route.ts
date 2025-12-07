// Week 18 Day 6: /api/playbooks/all has been deprecated.
// GA Playbooks use /api/playbooks instead, which is org-scoped and normalized.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Deprecated: use GET /api/playbooks for the normalized, org-scoped playbooks list.",
    },
    { status: 410 },
  );
}
