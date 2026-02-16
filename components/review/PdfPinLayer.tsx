"use client";

import * as React from "react";

import type { PinAnchor } from "@/lib/review/pins";

type Props = {
  enableAdd?: boolean;
  onAddPin?: (anchor: PinAnchor) => void; // UI-only for PGW10 shell
};

// Placeholder overlay: draws simple dots where a pin would be placed.
export function PdfPinLayer({ enableAdd, onAddPin }: Props) {
  return (
    <div
      aria-label="Pin overlay"
      className="relative"
      onClick={(event) => {
        if (!enableAdd || !onAddPin) return;
        // Fake: assume page 1 and rough normalized coords based on click inside the box.
        const target = event.currentTarget.getBoundingClientRect();
        if (target.width === 0 || target.height === 0) return;
        const x = (event.clientX - target.left) / target.width;
        const y = (event.clientY - target.top) / target.height;
        onAddPin({ page: 1, rect: { x, y, width: 0, height: 0 } });
      }}
    >
      {/* Placeholder "page" box just to provide click target in PGW10 D1-D2 */}
      <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
    </div>
  );
}
