import { cn } from "@/lib/utils";
export type WidgetDensity = "compact" | "default" | "comfortable";

export type WidgetCardProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  footer?: React.ReactNode;
  density?: WidgetDensity;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

const densityPadding: Record<WidgetDensity, string> = {
  compact: "px-4 py-3",
  default: "px-4 py-4",
  comfortable: "px-5 py-5",
};

export function WidgetCard({
  title,
  subtitle,
  rightSlot,
  footer,
  density = "default",
  className,
  bodyClassName,
  children,
}: WidgetCardProps) {
  return (
    <>
      {/* IMPORTANT:
          Many dashboard widgets are placed in fixed-height grid cells.
          Without overflow clipping, long lists/charts can "spill" out of the card and
          visually overlap the next section (what you're seeing on Playbooks/Insights/Share Hub). */}
      <div
        className={cn("rounded-2xl border border-border/60 bg-background flex flex-col overflow-hidden", className)}
      >
      <div className={["flex items-start justify-between gap-3", densityPadding[density]].join(" ")}>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs font-normal text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      <div className={cn(["pt-0", densityPadding[density]].join(" "), "flex-1 min-h-0", bodyClassName)}>
        {children}
      </div>

      {footer ? (
        <div className="border-t border-border/60 px-4 py-3 text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
      </div>
    </>
  );
}

