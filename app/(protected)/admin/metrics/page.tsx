import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type UsageSummaryRow = {
  orgId: string | null;
  eventType: string;
  totalAmount: number;
  eventCount: number;
  lastEventAt: string;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

async function getUsageSummaryLast7Days(): Promise<UsageSummaryRow[]> {
  const supabase = createServerSupabaseClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("metering_events")
    .select("org_id, event_type, amount, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[admin/metrics] Failed to load metering events", error);
    return [];
  }

  const map = new Map<string, UsageSummaryRow>();
  (data ?? []).forEach((row) => {
    const key = `${row.org_id ?? "null"}::${row.event_type}`;
    const existing = map.get(key);
    const amount = toNumber(row.amount);
    if (!existing) {
      map.set(key, {
        orgId: row.org_id ?? null,
        eventType: row.event_type,
        totalAmount: amount,
        eventCount: 1,
        lastEventAt: row.created_at,
      });
      return;
    }
    existing.totalAmount += amount;
    existing.eventCount += 1;
    if (row.created_at > existing.lastEventAt) existing.lastEventAt = row.created_at;
  });

  return Array.from(map.values()).sort((a, b) => b.lastEventAt.localeCompare(a.lastEventAt));
}

export default async function AdminMetricsPage() {
  const rows = await getUsageSummaryLast7Days();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Usage Metrics (Internal)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only view of metering events aggregated over the last 7 days.
          This is for internal debugging and sanity checks only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events by type (last 7 days)</CardTitle>
          <CardDescription>
            Aggregated by org and event type. Values are approximate during
            PG-W1 while logging is being wired into more flows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No metering events found for the last 7 days. Once logging is
              connected to core flows, they will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pr-3 text-left font-medium">Org ID</th>
                    <th className="py-2 px-3 text-left font-medium">
                      Event type
                    </th>
                    <th className="py-2 px-3 text-right font-medium">
                      Total amount
                    </th>
                    <th className="py-2 px-3 text-right font-medium">
                      Event count
                    </th>
                    <th className="py-2 pl-3 text-right font-medium">
                      Last event
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={`${row.orgId ?? "null"}::${row.eventType}`}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 pr-3 align-top font-mono text-xs">
                        {row.orgId ?? "—"}
                      </td>
                      <td className="py-2 px-3 align-top">
                        <span className="font-medium">{row.eventType}</span>
                      </td>
                      <td className="py-2 px-3 align-top text-right tabular-nums">
                        {row.totalAmount}
                      </td>
                      <td className="py-2 px-3 align-top text-right tabular-nums">
                        {row.eventCount}
                      </td>
                      <td className="py-2 pl-3 align-top text-right text-xs text-muted-foreground">
                        {new Date(row.lastEventAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

