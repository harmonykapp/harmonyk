"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UsageEventType } from "@/lib/metering";

type DevStatus = {
  kind: "idle" | "success" | "error";
  message: string | null;
};

async function postDevEvent(eventType: UsageEventType, amount?: number) {
  const res = await fetch("/api/dev/metering/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      amount,
      metadata: { demo: true },
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
}

export default function DevMeteringPage() {
  const [status, setStatus] = useState<DevStatus>({ kind: "idle", message: null });
  const [isBusy, setIsBusy] = useState(false);

  async function handleClick(eventType: UsageEventType, amount?: number) {
    setIsBusy(true);
    setStatus({ kind: "idle", message: null });
    try {
      await postDevEvent(eventType, amount);
      setStatus({
        kind: "success",
        message: `Logged event "${eventType}" successfully. Check /admin/metrics after a refresh.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error logging event";
      setStatus({
        kind: "error",
        message,
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[960px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Dev · Metering Harness
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fire a few sample usage events into <code>metering_events</code> and confirm they
          appear under <code>/admin/metrics</code>.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PG-W1 scope: this page uses a hard-coded dev org id (<code>dev-org</code>). In a
          later pass we&apos;ll wire real org / user IDs from the authenticated session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log sample events</CardTitle>
          <CardDescription>
            Click any button below, then reload <code>/admin/metrics</code> to verify the
            aggregates update.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => handleClick("ai_call", 1)}
              disabled={isBusy}
            >
              Log AI call (×1)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleClick("doc_created", 1)}
              disabled={isBusy}
            >
              Log doc_created (×1)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleClick("signature_sent", 1)}
              disabled={isBusy}
            >
              Log signature_sent (×1)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleClick("storage_bytes_delta", 1024)}
              disabled={isBusy}
            >
              Log storage_bytes_delta (+1KB)
            </Button>
          </div>

          {status.message && (
            <p
              className={`text-xs ${
                status.kind === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              }`}
            >
              {status.message}
            </p>
          )}

          {isBusy && (
            <p className="text-xs text-muted-foreground">
              Logging event&hellip;
            </p>
          )}

          <p className="mt-2 text-[11px] text-muted-foreground">
            Tip: keep <code>/admin/metrics</code> open in another tab. After you click one of
            these buttons, refresh that page to confirm the new event shows up in the 7-day
            aggregate.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

