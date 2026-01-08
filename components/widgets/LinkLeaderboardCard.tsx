"use client";

import Link from "next/link";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";

export type LinkLeaderboardRow = {
  id: string;
  name: string;
  docName: string;
  views: number;
  lastView: string;
  status: "active" | "expired";
};

export type LinkLeaderboardCardProps = {
  title: string;
  subtitle?: string;
  rows: LinkLeaderboardRow[];
  href?: string;
  className?: string;
};

function StatusPill({ status }: { status: LinkLeaderboardRow["status"] }) {
  const isActive = status === "active";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[10px]",
        isActive
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border/60 bg-muted text-muted-foreground",
      )}
    >
      {isActive ? "active" : "expired"}
    </span>
  );
}

export function LinkLeaderboardCard({
  title,
  subtitle,
  rows,
  href,
  className,
}: LinkLeaderboardCardProps) {
  const Wrapper: React.ElementType = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <div className={className}>
      <WidgetCard title={title} subtitle={subtitle} density="compact" className="h-full">
        <Wrapper
          {...wrapperProps}
          className={cn(
            "block space-y-2",
            href ? "cursor-pointer" : "",
          )}
        >
          {rows.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-4">
              <div className="text-sm font-medium">No links yet</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Share a deck to start tracking views.
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl px-3 py-2 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{row.name}</div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {row.docName}
                      </div>
                    </div>
                    <StatusPill status={row.status} />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{row.views}</span> views
                    </span>
                    <span>{row.lastView}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Wrapper>
      </WidgetCard>
    </div>
  );
}

