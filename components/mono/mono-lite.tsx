"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

export function MonoLite() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative">
        {open && (
          <div className="absolute bottom-14 right-0 w-72 rounded-xl border bg-background shadow-lg p-3 text-sm">
            <div className="font-medium mb-1">Maestro (lite)</div>
            <p className="text-muted-foreground">
              AI helper coming soon. For now this is a placeholder on every main page.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border bg-background shadow-md"
          aria-label="Open Maestro AI assistant"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

