"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WhitepapersBuilderPage() {
  const BUILDER_NAV_ITEMS = [
    { key: "contracts", label: "Contracts", href: "/builder/contracts" },
    { key: "decks", label: "Decks", href: "/builder/decks" },
    { key: "whitepapers", label: "Whitepapers", href: "/builder/whitepapers" },
    { key: "accounts", label: "Accounts", href: "/builder/accounts" },
  ] as const;

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
    <div className="h-full flex flex-col overflow-x-hidden">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="h-full flex">
          {/* LEFT RAIL: template types (replaces horizontal tabs) */}
          <aside className="w-80 border-r bg-sidebar overflow-auto">
            <div className="p-4 border-b space-y-3">
              <div>
                <div className="text-sm font-semibold">Templates</div>
                <div className="text-xs text-muted-foreground">
                  Pick one type, then start drafting.
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {TEMPLATE_ITEMS.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={[
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-sidebar-active text-primary" : "hover:bg-sidebar-active/50",
                    ].join(" ")}
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-xs font-medium">Export</div>
                <div className="text-xs text-muted-foreground">
                  Export to Word happens after you draft/edit inside the document.
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN: empty state / quick starts (until whitepaper templates are wired into the full builder client) */}
          <section className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b p-4">
              <div className="flex flex-wrap gap-2">
                {BUILDER_NAV_ITEMS.map((item) => (
                  <Button
                    key={item.key}
                    asChild
                    size="sm"
                    variant={item.key === "whitepapers" ? "default" : "outline"}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-6">
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
