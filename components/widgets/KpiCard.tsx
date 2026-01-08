"use client";

import { cn } from "@/lib/utils";
import type * as React from "react";

export type WidgetTone =
  | "blue"
  | "purple"
  | "emerald"
  | "amber"
  | "indigo"
  | "red"
  | "neutral";

export type KpiCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  delta?: string;
  href?: string;
  tone?: WidgetTone;
  className?: string;
};

const toneToTextClass: Record<WidgetTone, string> = {
  blue: "text-blue-700",
  purple: "text-violet-700",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  indigo: "text-indigo-700",
  red: "text-red-700",
  neutral: "text-foreground",
};

export function KpiCard({
  label,
  value,
  helper,
  delta,
  href,
  tone = "neutral",
  className,
}: KpiCardProps) {
  const Wrapper: React.ElementType = href ? "a" : "div";
  const wrapperProps = href
    ? {
      href,
      className:
        "block rounded-2xl border border-border/60 bg-background px-4 py-3 hover:bg-muted",
    }
    : {
      className:
        "rounded-2xl border border-border/60 bg-background px-4 py-3",
    };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(wrapperProps.className, className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">
            <span className={cn(toneToTextClass[tone])}>{value}</span>
          </div>
        </div>
        {delta ? (
          <div className="rounded-full border border-border/60 bg-muted px-2 py-1 text-xs text-muted-foreground">
            {delta}
          </div>
        ) : null}
      </div>
      {helper ? (
        <div className="mt-2 text-sm text-muted-foreground">{helper}</div>
      ) : null}
    </Wrapper>
  );
}

