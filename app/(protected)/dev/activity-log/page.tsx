"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

type ActivityLogRow = {
  id: string;
  org_id: string | null;
  user_id: string | null;
  type: string;
  unified_item_id: string | null;
  document_id: string | null;
  version_id: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
};

type ActivityLogResponse = {
  ok: boolean;
  count: number;
  rows: ActivityLogRow[];
  error?: string;
};

export default function DevActivityLogPage() {
  const [data, setData] = useState<ActivityLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLogs() {
      try {
        const res = await fetch("/api/dev/activity-log");
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Failed to fetch: ${res.status} ${text}`);
        }
        const json = (await res.json()) as ActivityLogResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log (Dev Only)</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log (Dev Only)</h1>
          <p className="text-destructive mt-1">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log (Dev Only)</h1>
          <p className="text-muted-foreground mt-1">No data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log (Dev Only)</h1>
        <p className="text-muted-foreground mt-1">
          Showing {data.count} recent entries (all orgs, service-role client)
        </p>
      </div>

      {data.count === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No activity log entries found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Activity Entries</CardTitle>
            <CardDescription>
              All activity log entries from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Org ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Context</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        <code className="text-xs">{row.type}</code>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.unified_item_id
                        ? `${row.unified_item_id.slice(0, 8)}...`
                        : row.document_id
                          ? `doc:${row.document_id.slice(0, 8)}...`
                          : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.org_id ? `${row.org_id.slice(0, 8)}...` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.user_id ? `${row.user_id.slice(0, 8)}...` : "—"}
                    </TableCell>
                    <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <pre className="text-xs whitespace-pre-wrap break-words">
                        {JSON.stringify(row.context, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
