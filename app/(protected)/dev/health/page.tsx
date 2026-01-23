"use client";

import { useEffect, useState } from "react";
import { getFeatureFlags } from "@/lib/feature-flags";

type HealthStatus = {
  ok: boolean;
  timestamp?: string;
  env?: string;
  error?: string;
};

export default function DevHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) {
          if (!cancelled) {
            setHealth({
              ok: false,
              error: `Health endpoint returned ${res.status}`,
            });
          }
          return;
        }
        const data = (await res.json()) as {
          ok: boolean;
          timestamp?: string;
          env?: string;
        };
        if (!cancelled) {
          setHealth({
            ok: data.ok,
            timestamp: data.timestamp,
            env: data.env,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setHealth({
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Unknown error calling /api/health",
          });
        }
      }
    }

    fetchHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const flags = getFeatureFlags();

  const appVersion =
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    "dev-local";

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not-set (check .env.local)";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div>
        <h1 className="text-2xl font-semibold">Dev Health / Diagnostics</h1>
        <p className="text-sm text-muted-foreground">
          Internal diagnostics for the Harmonyk Beta build.
        </p>
      </div>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">App Info</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono">{appVersion}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">NODE_ENV</dt>
            <dd className="font-mono">{process.env.NODE_ENV}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Supabase URL</dt>
            <dd className="font-mono break-all">{supabaseUrl}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">API Health</h2>
        {health == null ? (
          <p className="text-sm text-muted-foreground">Checking /api/health…</p>
        ) : health.ok ? (
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-mono text-green-600">OK</dd>
            </div>
            {health.timestamp && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Timestamp</dt>
                <dd className="font-mono">{health.timestamp}</dd>
              </div>
            )}
            {health.env && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Env</dt>
                <dd className="font-mono">{health.env}</dd>
              </div>
            )}
          </dl>
        ) : (
          <div className="mt-2 text-sm">
            <p className="font-medium text-red-600">API health check failed.</p>
            {health.error && (
              <p className="mt-1 text-muted-foreground">{health.error}</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Feature Flags</h2>
        <div className="mt-2 space-y-1 text-sm">
          {Object.entries(flags).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between gap-4 rounded-md bg-muted px-2 py-1"
            >
              <span className="font-mono text-xs">{key}</span>
              <span className="font-mono text-xs">
                {value ? "enabled" : "disabled"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

