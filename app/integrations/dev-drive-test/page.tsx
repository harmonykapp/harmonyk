"use client";

import { useState } from "react";

type ConnectStatus = "idle" | "loading" | "redirecting" | "error";
type SyncStatus = "idle" | "running" | "ok" | "error";

export default function DevDriveTestPage() {
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function handleConnect() {
    setConnectStatus("loading");
    setConnectMessage(null);

    try {
      const res = await fetch("/api/connectors/drive/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redirectUri: `${window.location.origin}/api/connectors/drive/callback`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setConnectStatus("error");
        setConnectMessage(
          data?.error ??
            `Request failed with status ${res.status} – see dev tools / server logs.`,
        );
        return;
      }

      if (!data?.authUrl) {
        setConnectStatus("error");
        setConnectMessage(
          "No authUrl returned from /api/connectors/drive/connect. Check server logs.",
        );
        return;
      }

      setConnectStatus("redirecting");
      window.location.href = data.authUrl as string;
    } catch (err) {
      setConnectStatus("error");
      setConnectMessage(
        err instanceof Error
          ? err.message
          : "Unknown error starting Drive connect flow.",
      );
    }
  }

  async function handleSync() {
    setSyncStatus("running");
    setSyncMessage(null);

    try {
      const res = await fetch("/api/connectors/drive/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // leave as raw text
      }

      if (!res.ok) {
        setSyncStatus("error");
        setSyncMessage(
          data?.message ??
            data?.error ??
            `Import failed with status ${res.status}: ${text}`,
        );
        return;
      }

      setSyncStatus("ok");
      const fileCount = typeof data?.file_count === "number" ? data.file_count : "unknown";
      setSyncMessage(`Import completed. file_count = ${fileCount}`);
    } catch (err) {
      setSyncStatus("error");
      setSyncMessage(
        err instanceof Error
          ? err.message
          : "Unknown error while running Drive import.",
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <section className="rounded-xl border border-neutral-800/40 bg-neutral-950/60 p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">
          Google Drive Connector – Dev Test
        </h1>
        <p className="mb-4 text-sm text-neutral-400">
          This page is for developer testing of the Google Drive connector. Use it to
          verify OAuth connectivity and the metadata-first import pipeline before we
          wire the main /integrations UI.
        </p>

        <div className="space-y-4">
          <div>
            <h2 className="mb-1 text-sm font-medium">1. Connect Google Drive</h2>
            <p className="mb-2 text-xs text-neutral-500">
              Starts the OAuth flow and creates a connector_accounts row on success.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connectStatus === "loading" || connectStatus === "redirecting"}
              className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connectStatus === "idle" && "Connect Google Drive"}
              {connectStatus === "loading" && "Starting connect flow…"}
              {connectStatus === "redirecting" && "Redirecting to Google…"}
              {connectStatus === "error" && "Retry connect"}
            </button>
            <div className="mt-2 text-xs text-neutral-400">
              Status: <span className="font-mono">{connectStatus}</span>
              {connectMessage && (
                <div className="mt-1 break-words font-mono text-[11px] text-red-400">
                  {connectMessage}
                </div>
              )}
            </div>
          </div>

          <hr className="border-neutral-800/60" />

          <div>
            <h2 className="mb-1 text-sm font-medium">2. Sync recent files</h2>
            <p className="mb-2 text-xs text-neutral-500">
              Calls the /api/connectors/drive/import endpoint for a connected account
              and upserts recent Docs/Sheets/Slides/PDFs into connector_files.
            </p>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncStatus === "running"}
              className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncStatus === "idle" && "Sync now"}
              {syncStatus === "running" && "Syncing…"}
              {syncStatus === "ok" && "Sync again"}
              {syncStatus === "error" && "Retry sync"}
            </button>
            <div className="mt-2 text-xs text-neutral-400">
              Status: <span className="font-mono">{syncStatus}</span>
              {syncMessage && (
                <div
                  className={`mt-1 break-words font-mono text-[11px] ${
                    syncStatus === "ok" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {syncMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
