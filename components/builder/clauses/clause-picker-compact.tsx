"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ClauseOption = {
  id: string;
  title: string;
  category?: string | null;
  required?: boolean | null;
};

export function ClausePickerCompact(props: {
  available: ClauseOption[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { available, selectedIds, onAdd, onRemove } = props;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = useMemo(() => {
    const map = new Map(available.map((c) => [c.id, c]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as ClauseOption[];
  }, [available, selectedIds]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return available;
    return available.filter((c) => {
      const t = `${c.title} ${c.category ?? ""}`.toLowerCase();
      return t.includes(query);
    });
  }, [available, q]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium">Clauses</div>
        <div className="text-xs text-muted-foreground">
          {selectedIds.length} selected
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">Add clause</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add clauses</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search clauses…"
                />
                <div className="max-h-[50vh] overflow-auto rounded-md border">
                  <ul className="divide-y">
                    {filtered.map((c) => {
                      const isSelected = selectedSet.has(c.id);
                      return (
                        <li key={c.id} className="flex items-center gap-3 p-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{c.title}</div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                              {c.category ?? "uncategorized"}
                              {c.required ? " • required" : ""}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            disabled={isSelected}
                            onClick={() => onAdd(c.id)}
                          >
                            {isSelected ? "Added" : "Add"}
                          </Button>
                        </li>
                      );
                    })}
                    {filtered.length === 0 ? (
                      <li className="p-3 text-sm text-muted-foreground">No matches.</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* compact selected list */}
      <div className={cn("mt-3 flex flex-wrap gap-2", selected.length === 0 ? "text-muted-foreground" : "")}>
        {selected.length === 0 ? (
          <div className="text-sm">No clauses selected yet.</div>
        ) : (
          selected.slice(0, 10).map((c) => (
            <Badge key={c.id} variant="secondary" className="flex items-center gap-2">
              <span className="max-w-[220px] truncate">{c.title}</span>
              <button
                type="button"
                className="text-xs opacity-70 hover:opacity-100"
                onClick={() => onRemove(c.id)}
                aria-label={`Remove ${c.title}`}
              >
                ✕
              </button>
            </Badge>
          ))
        )}
        {selected.length > 10 ? (
          <Badge variant="outline">+{selected.length - 10} more</Badge>
        ) : null}
      </div>

      {/* risk/conflicts placeholder (V3 later) */}
      <div className="mt-3 rounded-md bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Risk &amp; Conflicts</div>
          <Badge variant="outline">Risk: —</Badge>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Coming soon: risk score + conflict explanations with one-click fixes.
        </div>
      </div>
    </div>
  );
}

