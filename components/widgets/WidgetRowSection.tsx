"use client";

import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { CollapsibleHeaderButton } from "@/components/ui/collapsible-header-button";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function WidgetRowSection(props: Props) {
  const { id, title, subtitle, defaultOpen = true, children } = props;
  const [open, setOpen] = React.useState<boolean>(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3">
          <CollapsibleHeaderButton
            title={title}
            subtitle={subtitle}
            open={open}
            controlsId={id}
            buttonClassName="px-0 py-0 min-h-0"
          />
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
