"use client";

import * as React from "react";

import type { PinAnchor, PinnedComment } from "@/lib/review/pins";

type Props = {
  enableAdd?: boolean;
  onAddPin?: (anchor: PinAnchor) => void; // UI-only for PGW10 shell
  pins?: PinnedComment[];
  selectedId?: string | null;
  onSelect?: (pinId: string) => void;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const MIN_REGION_PX = 8;

type DragState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

function getAnchorPoint(anchor: PinAnchor) {
  if (typeof anchor.x === "number" && typeof anchor.y === "number") {
    return { x: anchor.x, y: anchor.y };
  }
  if (anchor.rect && typeof anchor.rect.x === "number" && typeof anchor.rect.y === "number") {
    const width = typeof anchor.rect.width === "number" ? anchor.rect.width : 0;
    const height = typeof anchor.rect.height === "number" ? anchor.rect.height : 0;
    // Use the center of the selection rect for the dot.
    return { x: anchor.rect.x + width / 2, y: anchor.rect.y + height / 2 };
  }
  return null;
}

// Placeholder overlay: draws simple dots where a pin would be placed.
export function PdfPinLayer({ enableAdd, onAddPin, pins = [], selectedId, onSelect }: Props) {
  const modeClassName = enableAdd ? "cursor-crosshair" : "";
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const dragStartRef = React.useRef<{ clientX: number; clientY: number } | null>(null);
  const ignoreClickRef = React.useRef(false);
  const [dragState, setDragState] = React.useState<DragState | null>(null);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!enableAdd || !onAddPin) return;
      if (ignoreClickRef.current) {
        ignoreClickRef.current = false;
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = clamp01((event.clientX - rect.left) / rect.width);
      const y = clamp01((event.clientY - rect.top) / rect.height);
      onAddPin({ page: 1, x, y });
    },
    [enableAdd, onAddPin]
  );

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!enableAdd || !onAddPin) return;
      if (!event.shiftKey || event.button !== 0) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      event.preventDefault();
      const startX = clamp01((event.clientX - rect.left) / rect.width);
      const startY = clamp01((event.clientY - rect.top) / rect.height);
      dragStartRef.current = { clientX: event.clientX, clientY: event.clientY };
      ignoreClickRef.current = true;
      setDragState({ startX, startY, currentX: startX, currentY: startY });
    },
    [enableAdd, onAddPin]
  );

  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!dragStartRef.current || !dragState) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const currentX = clamp01((event.clientX - rect.left) / rect.width);
      const currentY = clamp01((event.clientY - rect.top) / rect.height);
      setDragState((prev) =>
        prev
          ? {
            startX: prev.startX,
            startY: prev.startY,
            currentX,
            currentY,
          }
          : null
      );
    },
    [dragState]
  );

  const handleMouseUp = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!dragStartRef.current || !dragState || !onAddPin) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const start = dragStartRef.current;
      const endX = clamp01((event.clientX - rect.left) / rect.width);
      const endY = clamp01((event.clientY - rect.top) / rect.height);
      const dx = Math.abs(event.clientX - start.clientX);
      const dy = Math.abs(event.clientY - start.clientY);

      const x = Math.min(dragState.startX, endX);
      const y = Math.min(dragState.startY, endY);
      const width = Math.abs(endX - dragState.startX);
      const height = Math.abs(endY - dragState.startY);

      dragStartRef.current = null;
      setDragState(null);

      // Treat tiny drags as point pins (same behavior as PinnedOverlay).
      if (dx < MIN_REGION_PX && dy < MIN_REGION_PX) {
        onAddPin({ page: 1, x: dragState.startX, y: dragState.startY });
        return;
      }

      onAddPin({ page: 1, rect: { x, y, width, height } });
    },
    [dragState, onAddPin]
  );
  return (
    <div
      aria-label="Pin overlay"
      ref={containerRef}
      className={["relative", modeClassName].filter(Boolean).join(" ")}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Placeholder "page" box just to provide click target in PGW10 D1-D2 */}
      <div className="aspect-[4/3] w-full rounded-lg bg-muted" />

      {/* Drag selection preview */}
      {dragState ? (
        <span
          className="pointer-events-none absolute border border-primary/60 bg-primary/10"
          style={{
            left: `${Math.min(dragState.startX, dragState.currentX) * 100}%`,
            top: `${Math.min(dragState.startY, dragState.currentY) * 100}%`,
            width: `${Math.abs(dragState.currentX - dragState.startX) * 100}%`,
            height: `${Math.abs(dragState.currentY - dragState.startY) * 100}%`,
          }}
          aria-hidden="true"
        />
      ) : null}

      {/* Render selection regions (when present) */}
      {pins.map((pin) => {
        const rect = pin.anchor.rect;
        if (
          !rect ||
          typeof rect.x !== "number" ||
          typeof rect.y !== "number" ||
          typeof rect.width !== "number" ||
          typeof rect.height !== "number"
        ) {
          return null;
        }
        return (
          <span
            key={`${pin.id}-region`}
            className={[
              "pointer-events-none absolute border bg-primary/10",
              pin.id === selectedId ? "border-primary/70 ring-2 ring-primary/30" : "border-primary/50",
              pin.status === "resolved" && pin.id !== selectedId ? "opacity-40" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.width * 100}%`,
              height: `${rect.height * 100}%`,
            }}
            aria-hidden="true"
          />
        );
      })}
      {pins.map((pin, index) => {
        const point = getAnchorPoint(pin.anchor);
        if (!point) return null;
        const isSelected = pin.id === selectedId;
        const isResolved = pin.status === "resolved";
        return (
          <button
            key={pin.id}
            type="button"
            onClick={(event) => {
              if (!onSelect) return;
              event.stopPropagation();
              onSelect(pin.id);
            }}
            className={[
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow",
              "flex h-7 w-7 items-center justify-center text-[11px] font-semibold",
              "bg-primary text-primary-foreground border border-background",
              isSelected ? "ring-2 ring-primary/70 ring-offset-2 ring-offset-background" : "",
              isResolved && !isSelected ? "opacity-60" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
            aria-label={`Comment ${index + 1}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
