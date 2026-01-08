"use client";

import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";

export type FunnelStage = {
  label: string;
  count: number;
};

export type FunnelTone = "neutral" | "blue" | "purple" | "emerald" | "amber" | "indigo";

export type FunnelCardProps = {
  title: string;
  subtitle?: string;
  stages: FunnelStage[];
  onClick?: () => void;
  className?: string;
  tone?: FunnelTone;
};

function inferToneFromTitle(title: string): FunnelTone {
  const t = title.toLowerCase();
  if (t.includes("sign")) return "purple";
  if (t.includes("risk")) return "amber";
  if (t.includes("activity") || t.includes("trend")) return "emerald";
  return "blue";
}

function inferStageTone(label: string, base: FunnelTone): FunnelTone {
  const s = label.toLowerCase();
  if (s.includes("signed") || s.includes("active")) return "emerald";
  if (s.includes("sign")) return "purple";
  if (s.includes("review")) return "amber";
  return base;
}

const toneToBarClass: Record<FunnelTone, string> = {
  neutral:
    "bg-foreground/20 hover:bg-foreground/30 dark:bg-foreground/16 dark:hover:bg-foreground/22",
  blue:
    "bg-blue-500/25 hover:bg-blue-500/35 dark:bg-blue-400/20 dark:hover:bg-blue-400/28",
  purple:
    "bg-purple-500/25 hover:bg-purple-500/35 dark:bg-purple-400/20 dark:hover:bg-purple-400/28",
  emerald:
    "bg-emerald-500/25 hover:bg-emerald-500/35 dark:bg-emerald-400/20 dark:hover:bg-emerald-400/28",
  amber:
    "bg-amber-500/25 hover:bg-amber-500/35 dark:bg-amber-400/20 dark:hover:bg-amber-400/28",
  indigo:
    "bg-indigo-500/25 hover:bg-indigo-500/35 dark:bg-indigo-400/20 dark:hover:bg-indigo-400/28",
};

export function FunnelCard({
  title,
  subtitle,
  stages,
  onClick,
  className,
  tone,
}: FunnelCardProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const baseTone = tone ?? inferToneFromTitle(title);

  return (
    <div
      onClick={onClick}
      className={cn(onClick && "cursor-pointer", "h-full", className)}
    >
      <WidgetCard
        title={title}
        subtitle={subtitle}
        density="compact"
        className={cn("h-full", onClick ? "hover:bg-muted/50 transition-colors" : undefined)}
      >
        {/* No scrollbars: fixed 5 columns, narrower bars, labels clamped */}
        <div className="grid grid-cols-5 items-end gap-3 h-28">
          {stages.slice(0, 5).map((stage, idx) => {
            const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const heightPct = Math.max(18, pct);
            const stageTone = inferStageTone(stage.label, baseTone);
            const barClass = toneToBarClass[stageTone] ?? toneToBarClass.neutral;

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex justify-center items-end">
                  <div
                    className={cn("w-10 sm:w-11 rounded-t-lg transition-all", barClass)}
                    style={{ height: `${heightPct}%` }}
                    title={`${stage.label}: ${stage.count}`}
                  />
                </div>
                <div className="text-center min-h-[2.25rem]">
                  <div className="text-xs font-semibold">{stage.count}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                    {stage.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </WidgetCard>
    </div>
  );
}

