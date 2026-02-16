"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { WidgetCard } from "./WidgetCard";
import { chartPrimaryScale } from "./chartColors";

export type WidgetTone = "accent" | "neutral" | "blue" | "purple" | "emerald" | "amber" | "indigo";

export type SparklineCardProps = {
  title: string;
  subtitle?: string;
  points: number[];
  onClick?: () => void;
  className?: string;
  tone?: WidgetTone;
};

function inferToneFromTitle(_title: string): WidgetTone {
  return "accent";
}

const toneToTextClass: Record<WidgetTone, string> = {
  accent: chartPrimaryScale["50"].text,
  neutral: chartPrimaryScale["50"].text,
  blue: chartPrimaryScale["50"].text,
  purple: chartPrimaryScale["50"].text,
  emerald: chartPrimaryScale["50"].text,
  amber: chartPrimaryScale["50"].text,
  indigo: chartPrimaryScale["50"].text,
};

export function SparklineCard({
  title,
  subtitle,
  points,
  onClick,
  className,
  tone,
}: SparklineCardProps) {
  // Hooks must be called unconditionally on every render.
  const gradientId = React.useId().replace(/:/g, "");

  if (points.length === 0) {
    return (
      <div className={className}>
        <WidgetCard
          title={title}
          subtitle={subtitle}
          density="compact"
        >
          <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
            No data
          </div>
        </WidgetCard>
      </div>
    );
  }

  const baseTone: WidgetTone = tone ?? inferToneFromTitle(title);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1; // Avoid division by zero

  const width = 200;
  const height = 60;
  const padding = 8;

  const normalizedPoints = points.map((p) => (p - min) / range);
  const stepX = (width - padding * 2) / Math.max(1, points.length - 1);

  const pathData = normalizedPoints
    .map((y, i) => {
      const x = padding + i * stepX;
      const yPos = height - padding - y * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x} ${yPos}`;
    })
    .join(" ");

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
        <div className="h-full flex flex-col justify-center">
          <div className="h-24 flex items-center justify-center">
            <svg
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className={cn("overflow-visible", toneToTextClass[baseTone])}
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <path
                d={`${pathData} L ${padding + (points.length - 1) * stepX} ${height - padding} L ${padding} ${height - padding} Z`}
                fill={`url(#${gradientId})`}
              />
              <path
                d={pathData}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{points[0]}</span>
            <span>{points[points.length - 1]}</span>
          </div>
        </div>
      </WidgetCard>
    </div>
  );
}

