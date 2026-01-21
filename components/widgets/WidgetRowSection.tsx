"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function WidgetRowSection({ id, title, subtitle, defaultOpen = true, className, children }: Props) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-base font-semibold">{title}</div>
            <CollapsibleTrigger
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              aria-controls={id}
            >
              <span className="hidden sm:inline">{open ? "Collapse" : "Expand"}</span>
              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </div>
          {subtitle ? (
            <div className="mt-0.5 text-xs font-normal text-muted-foreground">
              {subtitle}
            </div>
          ) : null}
        </div>
        <CollapsibleContent id={id}>
          <div className="px-4 pb-4">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
