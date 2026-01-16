// PGW4: Rooms shell (flagged)
import { flag } from "@/lib/ui/flags";
import Link from "next/link";

export default function RoomsPage() {
  if (!flag("rooms.enabled")) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Rooms</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rooms are currently disabled for this environment.
        </p>
      </div>
    );
  }
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Rooms</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Central hub for deals/projects/companies. Shell includes stubs for "Add source", pinned evidence,
        and timeline blocks.
      </p>
      <div className="mt-6 grid gap-3">
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
    </div>
  );
}

