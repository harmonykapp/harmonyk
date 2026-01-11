"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type * as React from "react";

export type RankedListItem = {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  valueLabel?: string;
  valuePct?: number; // 0..100 for mini bar
  href?: string;
};

export type RankedListCardProps = {
  title: string;
  items: RankedListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

type RiskTone = "high" | "medium" | "low" | "neutral";

function inferRiskTone(tag?: string): RiskTone {
  const t = (tag ?? "").toLowerCase();
  if (t.includes("high") || t.includes("critical")) return "high";
  if (t.includes("medium")) return "medium";
  if (t.includes("low")) return "low";
  return "neutral";
}

const riskToBarClass: Record<RiskTone, string> = {
  high: "bg-red-500/25 dark:bg-red-400/20",
  medium: "bg-amber-500/25 dark:bg-amber-400/20",
  low: "bg-emerald-500/25 dark:bg-emerald-400/20",
  neutral: "bg-foreground/20",
};

const riskToBadgeClass: Record<RiskTone, string> = {
  high: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  neutral: "border-border/60 bg-muted text-muted-foreground",
};

function MiniBar({ pct, tone }: { pct: number; tone: RiskTone }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div
        className={cn("h-1.5 rounded-full", riskToBarClass[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function RankedListCard({
  title,
  items,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Once items appear, they'll show up here.",
  className,
}: RankedListCardProps) {
  return (
    <div
      className={cn("rounded-2xl border border-border/60 bg-background", className)}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm font-semibold">{title}</div>
      </div>

      <div className="px-2 pb-2 pt-0">
        {items.length === 0 ? (
          <div className="px-2 pb-3">
            <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-4">
              <div className="text-sm font-medium">{emptyTitle}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {emptyDescription}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 -mt-1">
            {items.map((it) => {
              const Row: React.ElementType = it.href ? Link : "div";
              const rowProps = it.href ? { href: it.href } : {};
              const riskTone = inferRiskTone(it.tag);
              return (
                <Row
                  key={it.id}
                  {...rowProps}
                  className={[
                    "block rounded-xl px-3 py-2.5 hover:bg-muted transition-colors min-h-[72px] flex flex-col justify-center",
                    it.href ? "cursor-pointer" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-medium">
                          {it.title}
                        </div>
                        {it.tag ? (
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs",
                              riskToBadgeClass[riskTone],
                            )}
                          >
                            {it.tag}
                          </span>
                        ) : null}
                      </div>
                      {it.subtitle ? (
                        <div className="mt-0.5 truncate text-sm text-muted-foreground">
                          {it.subtitle}
                        </div>
                      ) : null}
                    </div>
                    {it.valueLabel ? (
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {it.valueLabel}
                      </div>
                    ) : null}
                  </div>
                  {typeof it.valuePct === "number" ? (
                    <div className="mt-2">
                      <MiniBar pct={it.valuePct} tone={riskTone} />
                    </div>
                  ) : null}
                </Row>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

