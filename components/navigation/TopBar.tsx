"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";

const TITLE_RULES: Array<{ test: RegExp; label: string }> = [
  { test: /^\/workbench/, label: "Workbench / Today" },
  { test: /^\/builder(\/|$)/, label: "Builder" },
  { test: /^\/vault/, label: "Vault" },
  { test: /^\/signatures/, label: "Signatures" },
  { test: /^\/integrations/, label: "Integrations Hub" },
  { test: /^\/insights/, label: "Insights" },
  { test: /^\/calendar/, label: "Calendar" },
  { test: /^\/tasks/, label: "Tasks" },
  { test: /^\/settings/, label: "Settings" },
  { test: /^\/billing/, label: "Billing" },
];

function resolveTitle(pathname: string | null): string {
  if (!pathname) return "Workspace";
  const match = TITLE_RULES.find((rule) => rule.test.test(pathname));
  return match?.label ?? "Workspace";
}

export default function TopBar() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="top-bar">
      <div className="top-bar__title">
        <h2>{title}</h2>
      </div>

      <div className="top-bar__search">
        <input
          type="search"
          placeholder="Search docs, shares, signatures…"
          aria-label="Search"
        />
      </div>

      <div className="top-bar__actions">
        <button type="button" className="btn btn-secondary">
          New Doc
        </button>
        <button type="button" className="btn btn-ghost">
          Upload
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

