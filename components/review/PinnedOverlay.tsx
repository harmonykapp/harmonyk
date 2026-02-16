"use client";

import type { MouseEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";

export type PdfAnchor = {
  page: number;
  x: number;
  y: number;
  w?: number;
  h?: number;
};

export type PinnedOverlayPin = {
  id: string;
  anchor: PdfAnchor;
  createdAt: string;
  isResolved?: boolean;
};

type Props = {
  children: ReactNode;
  pins: PinnedOverlayPin[];
  isAddMode: boolean;
  isInteractive?: boolean;
  onAddPin: (anchor: PdfAnchor) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const MIN_REGION_PX = 8;

type DragState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

export function PinnedOverlay({
  children,
  pins,
  isAddMode,
  isInteractive = true,
  onAddPin,
  selectedId,
  onSelect,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const ignoreClickRef = useRef(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!isAddMode || !isInteractive) return;
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
    [isAddMode, isInteractive, onAddPin]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!isAddMode || !isInteractive) return;
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
    [isAddMode, isInteractive]
  );

  const handleMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
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
  }, [dragState]);

  const handleMouseUp = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!dragStartRef.current || !dragState) return;
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
      const w = Math.abs(endX - dragState.startX);
      const h = Math.abs(endY - dragState.startY);
      dragStartRef.current = null;
      setDragState(null);
      if (dx < MIN_REGION_PX && dy < MIN_REGION_PX) {
        onAddPin({ page: 1, x: dragState.startX, y: dragState.startY });
        return;
      }
      onAddPin({ page: 1, x, y, w, h });
    },
    [dragState, onAddPin]
  );

  const baseClassName = ["relative", className].filter(Boolean).join(" ");
  const modeClassName = isAddMode && isInteractive ? "cursor-crosshair" : "";
  const interactiveClassName = !isInteractive ? "opacity-60" : "";

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={[baseClassName, modeClassName, interactiveClassName].filter(Boolean).join(" ")}
      aria-disabled={!isInteractive}
    >
      {children}
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
      {pins.map((pin) =>
        pin.anchor.w && pin.anchor.h ? (
          <span
            key={`${pin.id}-region`}
            className={[
              "pointer-events-none absolute border bg-primary/10",
              pin.id === selectedId ? "border-primary/70 ring-2 ring-primary/30" : "border-primary/50",
              pin.isResolved && pin.id !== selectedId ? "opacity-40" : "",
            ].join(" ")}
            style={{
              left: `${pin.anchor.x * 100}%`,
              top: `${pin.anchor.y * 100}%`,
              width: `${pin.anchor.w * 100}%`,
              height: `${pin.anchor.h * 100}%`,
            }}
            aria-hidden="true"
          />
        ) : null
      )}
      {pins.map((pin) => (
        <button
          key={pin.id}
          type="button"
          onClick={(event) => {
            if (!isInteractive || !onSelect) return;
            event.stopPropagation();
            onSelect(pin.id);
          }}
          className={[
            "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-primary shadow",
            pin.id === selectedId ? "ring-2 ring-primary/70 ring-offset-2 ring-offset-background" : "",
            pin.isResolved && pin.id !== selectedId ? "opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ left: `${pin.anchor.x * 100}%`, top: `${pin.anchor.y * 100}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
