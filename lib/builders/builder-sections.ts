export type BuilderSectionKey = "contracts" | "decks" | "whitepapers" | "accounts";

export const BUILDER_SECTIONS: ReadonlyArray<{
  key: BuilderSectionKey;
  label: string;
  shortLabel: string;
  href: string;
  exportHint: string;
  description: string;
}> = [
  {
    key: "contracts",
    label: "Legal Contracts",
    shortLabel: "Contracts",
    href: "/builder/contracts",
    exportHint: "Word",
    description: "Generate and manage contracts with compact clause controls.",
  },
  {
    key: "decks",
    label: "Pitch Decks",
    shortLabel: "Decks",
    href: "/builder/decks",
    exportHint: "PowerPoint",
    description: "Build fundraising and update decks from canonical outlines.",
  },
  {
    key: "whitepapers",
    label: "Whitepapers & Patents",
    shortLabel: "Whitepapers",
    href: "/builder/whitepapers",
    exportHint: "Word",
    description: "Business/technical whitepapers plus patent draft workflows.",
  },
  {
    key: "accounts",
    label: "Financial Accounts",
    shortLabel: "Accounts",
    href: "/builder/accounts",
    exportHint: "Excel",
    description: "Generate accounts packs and export tables for investors.",
  },
] as const;

