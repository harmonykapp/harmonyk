"use client";

import { cn } from "@/lib/utils";

export type FilterChipItem = {
  id: string;
  label: string;
  count?: number | null;
  disabled?: boolean;
};

type Props = {
  items: FilterChipItem[];
  value: string;
  onChange: (next: string) => void;
  className?: string;
  "aria-label"?: string;
};

export function FilterChipsRow({
  items,
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Quick filters",
}: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selected
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground hover:bg-muted"
            )}
          >
            <span className="whitespace-nowrap">{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  selected ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
