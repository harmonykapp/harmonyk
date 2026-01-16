"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface FilterChipsRowProps {
  chips: FilterChip[];
  selected?: string[];
  onSelectionChange?: (selected: string[]) => void;
  multiSelect?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function FilterChipsRowV0({
  chips,
  selected = [],
  onSelectionChange,
  multiSelect = true,
  className,
  "aria-label": ariaLabel = "Filter options",
}: FilterChipsRowProps) {
  const handleChipClick = (chipId: string) => {
    if (!onSelectionChange) return;

    if (multiSelect) {
      const newSelected = selected.includes(chipId)
        ? selected.filter((id) => id !== chipId)
        : [...selected, chipId];
      onSelectionChange(newSelected);
    } else {
      onSelectionChange(selected.includes(chipId) ? [] : [chipId]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, chipId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleChipClick(chipId);
    }
  };

  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => {
        const isSelected = selected.includes(chip.id);
        return (
          <button
            key={chip.id}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => handleChipClick(chip.id)}
            onKeyDown={(e) => handleKeyDown(e, chip.id)}
            disabled={chip.disabled}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
              "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              isSelected
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
