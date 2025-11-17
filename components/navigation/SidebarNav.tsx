"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Workbench", href: "/workbench" },
  { label: "Builder", href: "/builder" },
  { label: "Drafts", href: "/builder/draft" },
  { label: "Vault", href: "/vault" },
  { label: "Signatures", href: "/signatures" },
  { label: "Integrations", href: "/integrations" },
  { label: "Insights", href: "/insights" },
  { label: "Calendar", href: "/calendar" },
  { label: "Tasks", href: "/tasks" },
  { label: "Settings", href: "/settings" },
  { label: "Billing", href: "/billing" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? "sidebar-link is-active" : "sidebar-link"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

