'use client';

import { AppShell } from "@/components/AppShell";
import type { MonoContext } from "@/components/mono/mono-pane";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import {
  CheckSquare,
  LayoutDashboard as Dashboard,
  Files,
  Home,
  LineChart,
  PencilRuler,
  PlaySquare,
  Plug,
  Settings,
  Share2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type React from "react";
import { Toaster } from "sonner";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Construct MonoContext from pathname
  const monoContext: MonoContext = {
    route: pathname || '/dashboard',
    // selectedDocumentId and selectedUnifiedItemId will be set by individual pages if needed
    filters: {},
  };

  // Consolidated sidebar (removes separate Activity, Signatures, Calendar entries)
  const navOverride = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Workbench", href: "/workbench", icon: Dashboard },
    { title: "Builder", href: "/builder", icon: PencilRuler },
    { title: "Vault", href: "/vault", icon: Files },
    { title: "Share Hub", href: "/share", icon: Share2 },
    { title: "Insights", href: "/insights", icon: LineChart },
    { title: "Playbooks", href: "/playbooks", icon: PlaySquare },
    { title: "Tasks", href: "/tasks", icon: CheckSquare },
    { title: "Integrations", href: "/integrations", icon: Plug },
    { title: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <AppShell monoContext={monoContext} navOverride={navOverride}>
      {children}
      <Toaster />
      <ShadcnToaster />
    </AppShell>
  );
}
