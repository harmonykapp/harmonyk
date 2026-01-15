export type PageTitleEntry = {
  title: string;
};

const titles: Record<string, PageTitleEntry> = {
  "/dashboard": { title: "Dashboard" },
  "/workbench": { title: "Workbench" },
  "/builder": { title: "Builder" },
  "/builder/contracts": { title: "Contract Builder" },
  "/builder/decks": { title: "Deck Builder" },
  "/builder/whitepapers": { title: "Whitepaper Builder" },
  "/builder/accounts": { title: "Account Builder" },
  "/vault": { title: "Vault" },
  "/share": { title: "Share Hub" },
  // Share Hub tabs (some are routed outside /share)
  "/share/links": { title: "Share Hub" },
  "/share/contacts": { title: "Share Hub" },
  "/signatures": { title: "Share Hub" },
  "/insights": { title: "Insights" },
  "/activity": { title: "Activity" },
  "/playbooks": { title: "Playbooks" },
  "/tasks": { title: "Tasks" },
  "/calendar": { title: "Tasks" },
  "/integrations": { title: "Integrations" },
  "/settings": { title: "Settings" },
};

export function getPageTitle(pathname?: string | null): string {
  if (!pathname) return "Harmonyk";

  // Explicit mappings for Insights and Activity
  if (pathname === "/insights" || pathname.startsWith("/insights/")) return "Insights";
  if (pathname === "/activity" || pathname.startsWith("/activity/")) return "Activity";

  // Normalize "Share Hub" section so topbar stays consistent across its tabs.
  // NOTE: Signatures is currently routed at /signatures, not /share/signatures.
  if (pathname === "/signatures" || pathname.startsWith("/signatures/")) {
    return "Share Hub";
  }
  if (pathname === "/share" || pathname.startsWith("/share/")) {
    return "Share Hub";
  }

  // Exact match first
  if (titles[pathname]) return titles[pathname].title;

  // Longest prefix match (e.g. /builder/contracts/xyz)
  const match = Object.keys(titles)
    .filter((k) => pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (match) return titles[match].title;
  return "Harmonyk";
}
