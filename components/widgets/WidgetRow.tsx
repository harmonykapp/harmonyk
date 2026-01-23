"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CollapsibleHeaderButton } from "@/components/ui/collapsible-header-button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import * as React from "react";

type Props = {
  title: string;
  subtitle?: string;
  storageKey?: string;
  className?: string;
  collapsedLabel?: string;
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
  collapsedLabel,
  defaultOpen = true,
  children,
}: Props) {
  // Hydration hygiene:
  // Radix uses generated ids for aria-controls/content and SVG ids in children can also diverge
  // if the server/client render order differs slightly. Render a deterministic shell first,
  // then mount the real Collapsible after hydration.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  // Deterministic initial open state (server + first client render)
  const [open, setOpen] = React.useState<boolean>(defaultOpen);
  const contentId = React.useId();
  const headerTitle = collapsedLabel ?? title;

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
    <section className={cn("overflow-x-hidden", className)}>
      {!hydrated ? (
        // Deterministic SSR/first paint: avoid Radix generated ids and any child SVG ids.
        // Keep spacing stable so the page doesn't jump.
        <div>
          <div className="flex min-h-9 w-full items-start gap-3 rounded-md px-2 py-1.5">
            <span className="flex min-w-0 items-start gap-2">
              <span className="min-w-0">
                <span className="inline-flex items-center gap-1">
                  <span className="text-base font-semibold">{headerTitle}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </span>
                {subtitle ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {subtitle}
                  </span>
                ) : null}
              </span>
            </span>
          </div>
          <div className="pt-4" />
        </div>
      ) : (
        <Collapsible open={open} onOpenChange={handleOpenChange}>
          <CollapsibleHeaderButton
            title={headerTitle}
            subtitle={subtitle}
            open={open}
            controlsId={contentId}
          />

          <CollapsibleContent id={contentId} className="pt-4 overflow-x-hidden">
            {children}
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}
