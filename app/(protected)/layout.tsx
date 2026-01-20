'use client';

import { AppShell } from "@/components/shell/AppShell";
import { SidebarProvider } from "@/lib/ui/sidebar-state";
import type { MonoContext } from "@/components/mono/mono-pane";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { usePathname } from "next/navigation";
import type React from "react";
import { Toaster } from "sonner";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const monoContext: MonoContext = {
    route: pathname || '/dashboard',
    filters: {},
  };

  return (
    <SidebarProvider>
      <AppShell monoContext={monoContext}>
        {children}
        <Toaster />
        <ShadcnToaster />
      </AppShell>
    </SidebarProvider>
  );
}
