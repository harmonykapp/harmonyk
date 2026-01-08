"use client";

import FilterChipsRowV0 from "@/components/widgets/FilterChipsRow_v0";
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

export function FilterChipsRowSelectable({
  items,
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Quick filters",
}: Props) {
  return (
    <FilterChipsRowV0
      chips={items.map((it) => ({
        id: it.id,
        label: it.label,
        count: typeof it.count === "number" ? it.count : undefined,
        disabled: !!it.disabled,
      }))}
      selected={value ? [value] : []}
      onSelectionChange={(next) => {
        // keep single-select behavior (do not allow "clear" to empty)
        const nextValue = next[0] ?? value;
        onChange(nextValue);
      }}
      multiSelect={false}
      className={cn(className)}
      aria-label={ariaLabel}
    />
  );
}

