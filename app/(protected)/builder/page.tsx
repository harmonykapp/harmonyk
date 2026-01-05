// Builder Hub — document type entry point
// Note: Import happens here, Export happens inside the editor once a draft exists.

"use client";

import React from "react";

export default function BuilderHubPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Builder</h1>
        <p className="text-muted-foreground">
          Pick a document type. Maestro will start suggesting next actions once you have a few docs.
        </p>
      </div>

      <div className="rounded-xl border bg-background p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Maestro Suggestions</h2>
          <p className="text-sm text-muted-foreground">
            This will evolve into predictive insights + optimized choices (Post-GA doctrine).
          </p>
        </div>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          <li>Create a template set for your 3 most common contracts.</li>
          <li>Generate an investor snapshot pack from your latest expenses.</li>
          <li>Draft a technical whitepaper outline for your next raise.</li>
        </ul>
      </div>

      <div>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Legal Contracts */}
          <div className="rounded-xl border bg-background p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Legal Contracts</h2>
              <p className="text-sm text-muted-foreground">
                Generate and manage contracts with compact clause controls.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <a className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href="/builder/contracts">
                Open
              </a>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 text-sm font-medium"
                onClick={() => alert("Import from Word (.docx) is coming soon. Export is available after you draft/edit.")}
              >
                Import: Word
              </button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Export happens after you draft/edit (inside the document).
            </div>
          </div>

          {/* Pitch Decks */}
          <div className="rounded-xl border bg-background p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Pitch Decks</h2>
              <p className="text-sm text-muted-foreground">
                Build fundraising and update decks from canonical outlines.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <a className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href="/builder/decks">
                Open
              </a>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 text-sm font-medium"
                onClick={() => alert("Import from PowerPoint (.pptx) is coming soon. Export is available after you draft/edit.")}
              >
                Import: PowerPoint
              </button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Export happens after you draft/edit (inside the deck).
            </div>
          </div>

          {/* Whitepapers & Patents */}
          <div className="rounded-xl border bg-background p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Whitepapers &amp; Patents</h2>
              <p className="text-sm text-muted-foreground">
                Business/technical whitepapers plus patent draft workflows.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <a className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href="/builder/whitepapers">
                Open
              </a>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 text-sm font-medium"
                onClick={() => alert("Import from Word (.docx) is coming soon. Export is available after you draft/edit.")}
              >
                Import: Word
              </button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Export happens after you draft/edit (inside the document).
            </div>
          </div>

          {/* Financial Accounts */}
          <div className="rounded-xl border bg-background p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Financial Accounts</h2>
              <p className="text-sm text-muted-foreground">
                Generate accounts packs and export tables for investors.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <a className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href="/builder/accounts">
                Open
              </a>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 text-sm font-medium"
                onClick={() => alert("Import from Excel (.xlsx) is coming soon. Export is available after you generate/edit.")}
              >
                Import: Excel
              </button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Export happens after you generate/edit (inside Accounts).
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
