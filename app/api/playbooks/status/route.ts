// Week 18 Day 6: /api/playbooks/status has been deprecated.
// Use PATCH /api/playbooks/[id]/status instead, which is org-scoped and normalized.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Deprecated: use PATCH /api/playbooks/[id]/status for updating playbook status.",
    },
    { status: 410 },
  );
}
