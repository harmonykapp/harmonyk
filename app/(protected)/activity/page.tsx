// Week 8: Activity page wired to ActivityClient
//
// Server component:
// - Renders ActivityClient without requiring a workspace.
// - In this v1, Activity telemetry is aggregated across all visible data
//   for the current user/project.

import { Suspense } from "react";
import ActivityClient from "./_components/activity-client";
import Link from "next/link";
import { LayoutDashboard, ListTree } from "lucide-react";

export default async function ActivityPage() {
  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
      {/* Heading + tagline */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
          Every event, time-stamped and attributable.
          </p>
        </div>

      {/* Top tabs (Overview / Activity) — Overview links to /insights */}
      <div className="w-fit">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <Link
            href="/insights"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>
          <Link
            href="/activity"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-foreground shadow-sm"
          >
            <ListTree className="h-4 w-4" />
            Activity
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading activity...</div>}>
        <ActivityClient />
      </Suspense>
    </div>
  );
}

