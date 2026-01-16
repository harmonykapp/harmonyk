// Week 8: Activity page wired to ActivityClient
//
// Server component:
// - Renders ActivityClient without requiring a workspace.
// - In this v1, Activity telemetry is aggregated across all visible data
//   for the current user/project.

import { InsightsTabs } from "@/components/insights/InsightsTabs";
import { Suspense } from "react";
import ActivityClient from "./_components/activity-client";

export default async function ActivityPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Top tabs (Overview / Activity) — Overview links to /insights */}
      <div className="w-fit">
        <InsightsTabs active="activity" />
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading activity...</div>}>
        <ActivityClient />
      </Suspense>
    </div>
  );
}

