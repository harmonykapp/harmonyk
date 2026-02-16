"use client";

import { cn } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";
import { chartPrimaryScale } from "./chartColors";

export type FunnelStage = {
  label: string;
  count: number;
};

export type FunnelTone = "accent" | "neutral" | "blue" | "purple" | "emerald" | "amber" | "indigo";

export type FunnelCardProps = {
  title: string;
  subtitle?: string;
  stages: FunnelStage[];
  onClick?: () => void;
  className?: string;
  tone?: FunnelTone;
};

function inferToneFromTitle(_title: string): FunnelTone {
  return "accent";
}

const funnelBarScale = [
  chartPrimaryScale["50"].bg,
  chartPrimaryScale["40"].bg,
  chartPrimaryScale["30"].bg,
  chartPrimaryScale["20"].bg,
  chartPrimaryScale["15"].bg,
];

const toneToBarScale: Record<FunnelTone, string[]> = {
  accent: funnelBarScale,
  neutral: funnelBarScale,
  blue: funnelBarScale,
  purple: funnelBarScale,
  emerald: funnelBarScale,
  amber: funnelBarScale,
  indigo: funnelBarScale,
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
  const barScale = toneToBarScale[baseTone] ?? toneToBarScale.neutral;

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
        <div className="grid grid-cols-5 items-end gap-2 h-32">
          {stages.slice(0, 5).map((stage, idx) => {
            const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const heightPct = Math.max(18, pct);
            const barClass = barScale[idx] ?? barScale[barScale.length - 1];

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full">
                <div className="flex-1 w-full flex justify-center items-end">
                  <div
                    className={cn("w-8 sm:w-9 rounded-t-lg transition-all", barClass)}
                    style={{ height: `${heightPct}%` }}
                    title={`${stage.label}: ${stage.count}`}
                  />
                </div>
                <div className="text-center min-h-[2.25rem]">
                  <div className="text-xs font-semibold">{stage.count}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2 leading-tight">
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

