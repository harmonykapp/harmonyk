"use client";

import { cn } from "@/lib/utils";
import { LayoutDashboard, ListTree } from "lucide-react";
import Link from "next/link";

const SEGMENTED_LIST_CLASS =
  "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit";
const SEGMENTED_TRIGGER_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export type InsightsTabsActive = "overview" | "activity";

export function InsightsTabs({ active }: { active: InsightsTabsActive }) {
  return (
    <div className={SEGMENTED_LIST_CLASS}>
      <Link
        href="/insights"
        className={cn(
          SEGMENTED_TRIGGER_BASE,
          active === "overview" && "bg-background text-foreground shadow-sm"
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        Overview
      </Link>
      <Link
        href="/activity"
        className={cn(
          SEGMENTED_TRIGGER_BASE,
          active === "activity" && "bg-background text-foreground shadow-sm"
        )}
      >
        <ListTree className="h-4 w-4" />
        Activity
      </Link>
    </div>
  );
}
