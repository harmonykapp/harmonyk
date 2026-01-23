"use client";

import { Widget } from "@/components/ui/widget";
import { Button } from "@/components/ui/button";
import { tokens } from "@/lib/ui/tokens";
import { Hammer, FileText, Presentation, FileSearch, Calculator } from 'lucide-react';
import Link from 'next/link';

const builderCards = [
  {
    title: 'Legal Contracts',
    description: 'Generate and manage contracts with compact clause controls.',
    href: '/builder/contracts',
    icon: FileText,
    color: 'text-blue-600',
  },
  {
    title: 'Pitch Decks',
    description: 'Build fundraising and update decks from canonical outlines.',
    href: '/builder/decks',
    icon: Presentation,
    color: 'text-green-600',
  },
  {
    title: 'Whitepapers & Patents',
    description: 'Business/technical whitepapers plus patent draft workflows.',
    href: '/builder/whitepapers',
    icon: FileSearch,
    color: 'text-purple-600',
  },
  {
    title: 'Financial Accounts',
    description: 'Generate accounts packs and export tables for investors.',
    href: '/builder/accounts',
    icon: Calculator,
    color: 'text-orange-600',
  },
];

const maestroSuggestions = [
  'Create a template set for your 3 most common contracts.',
  'Generate an investor snapshot pack from your latest expenses.',
  'Draft a technical whitepaper outline for your next raise.',
];

export default function BuilderHubPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold text-foreground">
            Build contracts, decks, whitepapers, and accounts in one place.
          </p>
          <Button asChild size="sm">
            <Link href="/builder/contracts">Start a contract</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/builder/contracts">Contracts</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/builder/decks">Decks</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/builder/whitepapers">Whitepapers</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/builder/accounts">Accounts</Link>
          </Button>
        </div>

        <Widget
          title="Maestro Suggestions"
          description="This will evolve into predictive insights + optimized choices (Post-GA doctrine)."
        >
          <ul className="space-y-2">
            {maestroSuggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span className="text-sm text-muted-foreground">{suggestion}</span>
              </li>
            ))}
          </ul>
        </Widget>

        <div className="grid gap-6 md:grid-cols-2">
          {builderCards.map((card) => {
            const Icon = card.icon;
            return (
              <Widget key={card.title}>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-muted`}>
                      <Icon className={card.color} style={{ width: tokens.iconSize.lg, height: tokens.iconSize.lg }} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold" style={{ fontSize: tokens.fontSize.sm }}>
                        {card.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={card.href} className="flex-1">
                      <Button className="w-full">
                        Open
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => alert("Import functionality is coming soon. Export is available after you draft/edit.")}
                    >
                      Import
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Export happens after you draft/edit (inside the document).
                  </p>
                </div>
              </Widget>
            );
          })}
        </div>
      </div>
    </div>
  );
}
