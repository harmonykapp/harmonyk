"use client";

import { useEffect, useState } from "react";

type LoadStatus = "idle" | "loading" | "ok" | "error";
type ConnectStatus = "idle" | "loading" | "redirecting" | "error";
type SyncStatus = "idle" | "running" | "ok" | "error";

type DriveStatusResponse = {
  provider: "google_drive";
  account_status: string;
  account_id: string | null;
  last_sync_time: string | null;
  last_sync_file_count: number | null;
  last_error: string | null;
  last_error_time: string | null;
};

type GmailStatusResponse = {
  provider: "gmail";
  account_status: string;
  account_id: string | null;
  last_sync_time: string | null;
  last_sync_message_count: number | null;
  last_error: string | null;
  last_error_time: string | null;
};

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatErrorSnippet(msg: string | null): string | null {
  if (!msg) return null;
  // Try to strip noisy JSON tail if present.
  const firstLine = msg.split("\n")[0];
  const base = firstLine.length > 0 ? firstLine : msg;
  const trimmed = base.trim();
  const limit = 180;
  if (trimmed.length <= limit) return trimmed;
  return trimmed.slice(0, limit - 3) + "...";
}

export default function IntegrationsPage() {
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [driveStatus, setDriveStatus] = useState<DriveStatusResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [gmailLoadStatus, setGmailLoadStatus] = useState<LoadStatus>("idle");
  const [gmailStatus, setGmailStatus] = useState<GmailStatusResponse | null>(null);
  const [gmailLoadError, setGmailLoadError] = useState<string | null>(null);
  const [gmailConnectStatus, setGmailConnectStatus] =
    useState<ConnectStatus>("idle");
  const [gmailConnectMessage, setGmailConnectMessage] = useState<string | null>(null);
  const [gmailSyncStatus, setGmailSyncStatus] = useState<SyncStatus>("idle");
  const [gmailSyncMessage, setGmailSyncMessage] = useState<string | null>(null);

  async function refreshDriveStatus() {
    setLoadStatus("loading");
    setLoadError(null);
    try {
      const res = await fetch("/api/connectors/drive/status");
      const text = await res.text();
      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        // keep raw text for debugging
      }

      if (!res.ok) {
        setLoadStatus("error");
        setLoadError(
          data?.message ?? data?.error ?? `Failed to load status: ${res.status} ${text}`,
        );
        return;
      }

      setDriveStatus(data as DriveStatusResponse);
      setLoadStatus("ok");
    } catch (err) {
      setLoadStatus("error");
      setLoadError(
        err instanceof Error ? err.message : "Unknown error loading Drive status.",
      );
    }
  }

  useEffect(() => {
    void refreshDriveStatus();
    void refreshGmailStatus();
  }, []);

  async function refreshGmailStatus() {
    setGmailLoadStatus("loading");
    setGmailLoadError(null);
    try {
      const res = await fetch("/api/connectors/gmail/status");
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // keep raw text
      }

      if (!res.ok) {
        setGmailLoadStatus("error");
        setGmailLoadError(
          data?.message ??
          data?.error ??
          `Failed to load Gmail status: ${res.status} ${text}`,
        );
        return;
      }

      setGmailStatus(data as GmailStatusResponse);
      setGmailLoadStatus("ok");
    } catch (err) {
      setGmailLoadStatus("error");
      setGmailLoadError(
        err instanceof Error ? err.message : "Unknown error loading Gmail status.",
      );
    }
  }

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
          `Connect request failed with status ${res.status} – see logs for details.`,
        );
        return;
      }

      if (!data?.authUrl) {
        setConnectStatus("error");
        setConnectMessage("No authUrl returned from Drive connect endpoint.");
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
        // Reload status so last_error is visible
        void refreshDriveStatus();
        return;
      }

      setSyncStatus("ok");
      const fileCount = typeof data?.file_count === "number" ? data.file_count : "unknown";
      setSyncMessage(`Import completed. file_count = ${fileCount}`);
      // Reload status to update last_sync_time / file_count
      void refreshDriveStatus();
    } catch (err) {
      setSyncStatus("error");
      setSyncMessage(
        err instanceof Error
          ? err.message
          : "Unknown error while running Drive import.",
      );
      void refreshDriveStatus();
    }
  }

  async function handleGmailConnect() {
    setGmailConnectStatus("loading");
    setGmailConnectMessage(null);

    try {
      const res = await fetch("/api/connectors/gmail/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redirectUri: `${window.location.origin}/api/connectors/gmail/callback`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setGmailConnectStatus("error");
        setGmailConnectMessage(
          data?.error ??
            `Gmail connect failed with status ${res.status} – see logs for details.`,
        );
        return;
      }

      if (!data?.authUrl) {
        setGmailConnectStatus("error");
        setGmailConnectMessage("No authUrl returned from Gmail connect endpoint.");
        return;
      }

      setGmailConnectStatus("redirecting");
      window.location.href = data.authUrl as string;
    } catch (err) {
      setGmailConnectStatus("error");
      setGmailConnectMessage(
        err instanceof Error
          ? err.message
          : "Unknown error starting Gmail connect flow.",
      );
    }
  }

  async function handleGmailSync() {
    setGmailSyncStatus("running");
    setGmailSyncMessage(null);

    try {
      const res = await fetch("/api/connectors/gmail/import", {
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
        setGmailSyncStatus("error");
        setGmailSyncMessage(
          data?.message ??
            data?.error ??
            `Gmail import failed with status ${res.status}: ${text}`,
        );
        void refreshGmailStatus();
        return;
      }

      setGmailSyncStatus("ok");
      const count =
        typeof data?.message_count === "number" ? data.message_count : "unknown";
      setGmailSyncMessage(`Import completed. message_count = ${count}`);
      void refreshGmailStatus();
    } catch (err) {
      setGmailSyncStatus("error");
      setGmailSyncMessage(
        err instanceof Error
          ? err.message
          : "Unknown error while running Gmail import.",
      );
      void refreshGmailStatus();
    }
  }

  const driveConnected =
    driveStatus && driveStatus.account_status && driveStatus.account_status !== "disconnected";

  const gmailConnected =
    gmailStatus && gmailStatus.account_status && gmailStatus.account_status !== "disconnected";

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Connect Monolyth to your external tools. Drive imports are metadata-first and can
          be synced on demand.
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Google Drive</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Import Docs, Sheets, Slides, and PDFs into Monolyth&apos;s metadata index
              for analysis and workflows. Each sync pulls a recent slice of your Drive
              within safe limits so you can test connectors without hammering your
              account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${loadStatus === "loading"
                  ? "bg-neutral-800 text-neutral-300"
                  : driveConnected
                    ? "bg-emerald-900/60 text-emerald-300"
                    : "bg-neutral-800 text-neutral-400"
                }`}
            >
              {loadStatus === "loading"
                ? "Checking…"
                : driveConnected
                  ? "Connected"
                  : "Not connected"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleConnect}
            disabled={connectStatus === "loading" || connectStatus === "redirecting"}
            className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-50 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {driveConnected ? "Reconnect Google Drive" : "Connect Google Drive"}
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={!driveConnected || syncStatus === "running"}
            className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-50 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncStatus === "idle" && "Sync now"}
            {syncStatus === "running" && "Syncing…"}
            {syncStatus === "ok" && "Sync again"}
            {syncStatus === "error" && "Retry sync"}
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/integrations/dev-drive-test";
            }}
            className="inline-flex items-center rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-900"
          >
            Open dev test page
          </button>
        </div>

        <div className="mt-4 grid gap-3 text-xs text-neutral-400 sm:grid-cols-2">
          <div>
            <div className="font-medium text-neutral-300">Last sync</div>
            {driveStatus?.last_sync_time ? (
              <div className="mt-0.5">
                <span className="font-mono">
                  {formatDateTime(driveStatus.last_sync_time)}
                </span>
                {typeof driveStatus.last_sync_file_count === "number" && (
                  <span className="ml-1 text-neutral-500">
                    · {driveStatus.last_sync_file_count} items
                  </span>
                )}
              </div>
            ) : driveConnected ? (
              <div className="mt-0.5 text-neutral-500">
                Connected, but no completed syncs yet.
              </div>
            ) : (
              <div className="mt-0.5 text-neutral-500">
                Connect Google Drive to start syncing files.
              </div>
            )}
          </div>

          <div>
            <div className="font-medium text-neutral-300">Last error</div>
            {driveStatus?.last_error ? (
              <div className="mt-0.5">
                <div className="font-mono text-[11px] text-red-300">
                  {formatErrorSnippet(driveStatus.last_error)}
                </div>
                {driveStatus.last_error_time && (
                  <div className="mt-0.5 text-[11px] text-neutral-500">
                    at{" "}
                    <span className="font-mono">
                      {formatDateTime(driveStatus.last_error_time)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-0.5 text-neutral-500">No recent errors.</div>
            )}
          </div>
        </div>

        <div className="mt-3 text-[11px] text-neutral-500">
          Status: <span className="font-mono">{loadStatus}</span>{" "}
          {loadError && (
            <span className="ml-1 font-mono text-red-400">({loadError})</span>
          )}
          {syncMessage && (
            <div
              className={`mt-1 break-words font-mono text-[11px] ${syncStatus === "ok" ? "text-emerald-400" : "text-red-400"
                }`}
            >
              {syncMessage}
            </div>
          )}
          {connectMessage && (
            <div className="mt-1 break-words font-mono text-[11px] text-red-400">
              {connectMessage}
            </div>
          )}
        </div>
      </section>

      {/* Gmail connector */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Gmail</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Import email + attachment metadata for contract-related threads. Monolyth
              only stores headers and attachment metadata, not email bodies, and each
              sync only fetches a small recent batch of messages to keep things safe and
              predictable during the beta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${gmailLoadStatus === "loading"
                  ? "bg-neutral-800 text-neutral-300"
                  : gmailConnected
                    ? "bg-emerald-900/60 text-emerald-300"
                    : "bg-neutral-800 text-neutral-400"
                }`}
            >
              {gmailLoadStatus === "loading"
                ? "Checking…"
                : gmailConnected
                  ? "Connected"
                  : "Not connected"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGmailConnect}
            disabled={
              gmailConnectStatus === "loading" ||
              gmailConnectStatus === "redirecting"
            }
            className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-50 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {gmailConnected ? "Reconnect Gmail" : "Connect Gmail"}
          </button>

          <button
            type="button"
            onClick={handleGmailSync}
            disabled={!gmailConnected || gmailSyncStatus === "running"}
            className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-50 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {gmailSyncStatus === "idle" && "Sync now"}
            {gmailSyncStatus === "running" && "Syncing…"}
            {gmailSyncStatus === "ok" && "Sync again"}
            {gmailSyncStatus === "error" && "Retry sync"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 text-xs text-neutral-400 sm:grid-cols-2">
          <div>
            <div className="font-medium text-neutral-300">Last sync</div>
            {gmailStatus?.last_sync_time ? (
              <div className="mt-0.5">
                <span className="font-mono">
                  {formatDateTime(gmailStatus.last_sync_time)}
                </span>
                {typeof gmailStatus.last_sync_message_count === "number" && (
                  <span className="ml-1 text-neutral-500">
                    · {gmailStatus.last_sync_message_count} messages
                  </span>
                )}
              </div>
            ) : gmailConnected ? (
              <div className="mt-0.5 text-neutral-500">
                Connected, but no completed syncs yet.
              </div>
            ) : (
              <div className="mt-0.5 text-neutral-500">
                Connect Gmail to start syncing metadata.
              </div>
            )}
          </div>

          <div>
            <div className="font-medium text-neutral-300">Last error</div>
            {gmailStatus?.last_error ? (
              <div className="mt-0.5">
                <div className="font-mono text-[11px] text-red-300">
                  {formatErrorSnippet(gmailStatus.last_error)}
                </div>
                {gmailStatus.last_error_time && (
                  <div className="mt-0.5 text-[11px] text-neutral-500">
                    at{" "}
                    <span className="font-mono">
                      {formatDateTime(gmailStatus.last_error_time)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-0.5 text-neutral-500">No recent errors.</div>
            )}
          </div>
        </div>

        <div className="mt-3 text-[11px] text-neutral-500">
          Status: <span className="font-mono">{gmailLoadStatus}</span>{" "}
          {gmailLoadError && (
            <span className="ml-1 font-mono text-red-400">({gmailLoadError})</span>
          )}
          {gmailSyncMessage && (
            <div
              className={`mt-1 break-words font-mono text-[11px] ${gmailSyncStatus === "ok" ? "text-emerald-400" : "text-red-400"
                }`}
            >
              {gmailSyncMessage}
            </div>
          )}
          {gmailConnectMessage && (
            <div className="mt-1 break-words font-mono text-[11px] text-red-400">
              {gmailConnectMessage}
            </div>
          )}
        </div>
      </section>

      {/* Future: Gmail, Calendar, etc. */}
      <section className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500">
        Additional connectors (Calendar, etc.) will appear here in later weeks.
      </section>
    </main>
  );
}

