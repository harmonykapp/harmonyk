// Week 8: Activity page wired to ActivityClient
//
// Server component:
// - Renders ActivityClient without requiring a workspace.
// - In this v1, Activity telemetry is aggregated across all visible data
//   for the current user/project.

import { Suspense } from "react";
import ActivityClient from "./_components/activity-client";

export default async function ActivityPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Live timeline of what&apos;s happening in Monolyth: generated docs,
          saves to Vault, shares, signatures, playbooks, Mono queries, and
          connector syncs.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading activity...</div>}>
        <ActivityClient />
      </Suspense>
    </div>
  );
}
