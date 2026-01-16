"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  storageKey?: string;
  className?: string;
  /**
   * What the server (and the very first client render) should show.
   * We MUST keep this deterministic to avoid hydration mismatch.
   */
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function WidgetRow({
  title,
  subtitle,
  storageKey,
  className,
  defaultOpen = true,
  children,
}: Props) {
  // CRITICAL: Initial state must ALWAYS be defaultOpen (server + first client render)
  // This ensures server and client render the same initial tree, preventing hydration mismatch.
  const [open, setOpen] = React.useState<boolean>(defaultOpen);

  // Load from localStorage AFTER mount (prevents hydration mismatch)
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "open") setOpen(true);
      else if (saved === "closed") setOpen(false);
    } catch {
      // ignore storage failures (private mode, blocked, etc.)
    }
  }, [storageKey]);

  // Persist to localStorage when state changes
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, open ? "open" : "closed");
    } catch {
      // ignore localStorage errors
    }
  }, [storageKey, open]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
  };

  return (
    <section className={cn("mt-10", className)}>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium">{title}</div>
            {subtitle ? (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>

          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <ChevronDown
                className={cn(
                  "mr-1 h-4 w-4 transition-transform",
                  open ? "rotate-180" : "rotate-0",
                )}
              />
              {open ? "Collapse" : "Expand"}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="pt-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
