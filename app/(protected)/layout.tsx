'use client';

import { AppShell } from "@/components/AppShell";
import type { MonoContext } from "@/components/mono/mono-pane";
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

  return (
    <AppShell monoContext={monoContext}>
      {children}
      <Toaster />
    </AppShell>
  );
}
