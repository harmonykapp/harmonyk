'use client';

// PGW4: Rooms shell (flagged)
import { AppShell } from "@/components/shell/AppShell";
import type { MonoContext } from "@/components/mono/mono-pane";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/lib/ui/sidebar-state";
import { flag } from "@/lib/ui/flags";
import Link from "next/link";
import { Toaster } from "sonner";

export default function RoomsPage() {
  const monoContext: MonoContext = {
    route: "/rooms",
    filters: {},
  };

  const enabled = flag("rooms.enabled");

  return (
    <SidebarProvider>
      <AppShell monoContext={monoContext}>
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {!enabled ? (
            <div className="rounded-lg border p-4">
              <div className="font-medium">Rooms disabled</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Rooms are currently disabled for this environment.
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                <div className="rounded-lg border p-4">
                  <div className="font-medium">Quick start</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Create your first Room from an existing contract, deck, or account pack.
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href="/vault" className="rounded border px-3 py-1 text-sm">
                      Choose from Vault
                    </Link>
                    <Link href="/builder" className="rounded border px-3 py-1 text-sm">
                      Create new
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Toaster />
        <ShadcnToaster />
      </AppShell>
    </SidebarProvider>
  );
}

