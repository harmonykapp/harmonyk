"use client";

import React from "react";
import Link from "next/link";

export default function WhitepapersBuilderPage() {
  const TEMPLATE_ITEMS = [
    {
      id: "business_whitepaper",
      title: "Business Whitepaper",
      subtitle: "Positioning, market, traction, roadmap, moat.",
      quickStarts: ["Outline", "Exec Summary", "Go-to-market section"],
    },
    {
      id: "technical_whitepaper",
      title: "Technical Whitepaper",
      subtitle: "Architecture, protocols, security, benchmarks.",
      quickStarts: ["Outline", "System Overview", "Security section"],
    },
    {
      id: "provisional_patent",
      title: "Provisional Patent",
      subtitle: "Fast draft with claims placeholders + figures list.",
      quickStarts: ["Draft skeleton", "Claims placeholders", "Abstract"],
    },
    {
      id: "nonprovisional_patent",
      title: "Non-provisional Patent",
      subtitle: "Full spec structure + tighter claim discipline.",
      quickStarts: ["Draft skeleton", "Claims draft", "Background + Summary"],
    },
  ] as const;

  const [activeId, setActiveId] = React.useState<(typeof TEMPLATE_ITEMS)[number]["id"]>(
    "business_whitepaper",
  );

  const active = TEMPLATE_ITEMS.find((t) => t.id === activeId)!;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* LEFT RAIL: template types (replaces horizontal tabs) */}
        <aside className="rounded-xl border bg-background p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold">Templates</div>
            <div className="text-xs text-muted-foreground">
              Pick one type, then start drafting.
            </div>
          </div>
          <div className="space-y-2">
            {TEMPLATE_ITEMS.map((item) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={[
                    "w-full rounded-lg border px-3 py-3 text-left transition",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-muted/40 p-3">
            <div className="text-xs font-medium">Export</div>
            <div className="text-xs text-muted-foreground">
              Export to Word happens after you draft/edit inside the document.
            </div>
          </div>
        </aside>

        {/* MAIN: empty state / quick starts (until whitepaper templates are wired into the full builder client) */}
        <section className="rounded-xl border bg-background p-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-2xl font-semibold">Start Building</div>
            <p className="mt-2 text-sm text-muted-foreground">
              {active.subtitle}
            </p>

            <div className="mt-6 rounded-xl border bg-muted/20 p-5 text-left">
              <div className="text-sm font-semibold">AI-assisted drafting</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Quick start with a common section for: <span className="font-medium">{active.title}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {active.quickStarts.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted"
                    onClick={() => alert(`Quick start "${label}" for ${active.title} is coming next. This will prefill the prompt/context.`)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-5 text-xs text-muted-foreground">
                Next wiring step (later): connect these template types to the same draft/save/version pipeline as Contracts.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
