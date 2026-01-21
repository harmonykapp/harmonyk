import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, rightSlot, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl break-words">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground break-words">{subtitle}</p>
        ) : null}
      </div>
      {rightSlot ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
          {rightSlot}
        </div>
      ) : null}
    </div>
  );
}
