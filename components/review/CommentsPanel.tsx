"use client";

import * as React from "react";

import type { PinnedComment } from "@/lib/review/pins";

type Props = {
  items: PinnedComment[];
  onAdd?: (text: string) => void; // UI-only for PGW10 shell
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  composerRef?: React.RefObject<HTMLInputElement | null>;
};

export function CommentsPanel({ items, onAdd, selectedId, onSelect, composerRef }: Props) {
  const [text, setText] = React.useState("");
  return (
    <div className="rounded-lg border">
      <div className="border-b px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
        Comments
      </div>
      <div className="space-y-3 p-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No comments yet. Use "Add comment" to drop a pin.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => {
              const isSelected = c.id === selectedId;
              const content = (
                <>
                  <div className="text-xs text-muted-foreground">
                    Page {c.anchor.page} • {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm">{c.text}</div>
                </>
              );
              if (onSelect) {
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      className={[
                        "w-full rounded-md border p-2 text-left transition",
                        isSelected ? "border-primary/40 bg-primary/5" : "border-muted",
                      ].join(" ")}
                      aria-pressed={isSelected}
                    >
                      {content}
                    </button>
                  </li>
                );
              }
              return (
                <li key={c.id} className="rounded-md border p-2">
                  {content}
                </li>
              );
            })}
          </ul>
        )}
        {onAdd ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!text.trim()) return;
              onAdd(text.trim());
              setText("");
            }}
          >
            <input
              className="flex-1 rounded-md border px-2 py-1 text-sm"
              placeholder="Add a comment..."
              value={text}
              onChange={(event) => setText(event.target.value)}
              ref={composerRef}
            />
            <button className="rounded-md border px-2 py-1 text-xs" type="submit">
              Add
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
