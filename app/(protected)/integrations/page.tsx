"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WidgetCard, WidgetRowSection } from "@/components/widgets";
import { AlertCircle, CheckCircle2, Clock, Database, Mail, Shield } from "lucide-react";
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

const CONNECTED_SOURCE_LIMIT = 10;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonMaybe(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getErrorMessage(data: unknown): string | null {
  if (!isObject(data)) return null;
  const message = data["message"];
  if (typeof message === "string" && message.trim().length > 0) return message;
  const error = data["error"];
  if (typeof error === "string" && error.trim().length > 0) return error;
  return null;
}

function getAuthUrl(data: unknown): string | null {
  if (!isObject(data)) return null;
  const authUrl = data["authUrl"];
  if (typeof authUrl === "string" && authUrl.trim().length > 0) return authUrl;
  return null;
}

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

function formatTimeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(iso);
}

function formatErrorSnippet(msg: string | null): string | null {
  if (!msg) return null;
  const firstLine = msg.split("\n")[0];
  const base = firstLine.length > 0 ? firstLine : msg;
  const trimmed = base.trim();
  const limit = 80;
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
      const data = parseJsonMaybe(text);

      if (!res.ok) {
        setLoadStatus("error");
        setLoadError(
          getErrorMessage(data) ?? `Failed to load status: ${res.status} ${text}`,
        );
        return;
      }

      if (!isObject(data)) {
        setLoadStatus("error");
        setLoadError(`Failed to load status: ${res.status} Invalid JSON payload`);
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
      const data = parseJsonMaybe(text);

      if (!res.ok) {
        setGmailLoadStatus("error");
        setGmailLoadError(
          getErrorMessage(data) ?? `Failed to load Gmail status: ${res.status} ${text}`,
        );
        return;
      }

      if (!isObject(data)) {
        setGmailLoadStatus("error");
        setGmailLoadError(`Failed to load Gmail status: ${res.status} Invalid JSON payload`);
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

      const data = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        setConnectStatus("error");
        setConnectMessage(
          getErrorMessage(data) ??
          `Connect request failed with status ${res.status} – see logs for details.`,
        );
        return;
      }

      const authUrl = getAuthUrl(data);
      if (!authUrl) {
        setConnectStatus("error");
        setConnectMessage("No authUrl returned from Drive connect endpoint.");
        return;
      }

      setConnectStatus("redirecting");
      window.location.href = authUrl;
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
      const data = parseJsonMaybe(text);

      if (!res.ok) {
        setSyncStatus("error");
        setSyncMessage(
          getErrorMessage(data) ?? `Import failed with status ${res.status}: ${text}`,
        );
        // Reload status so last_error is visible
        void refreshDriveStatus();
        return;
      }

      setSyncStatus("ok");
      const fileCount =
        isObject(data) && typeof data["file_count"] === "number" ? data["file_count"] : "unknown";
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

      const data = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        setGmailConnectStatus("error");
        setGmailConnectMessage(
          getErrorMessage(data) ??
          `Gmail connect failed with status ${res.status} – see logs for details.`,
        );
        return;
      }

      const authUrl = getAuthUrl(data);
      if (!authUrl) {
        setGmailConnectStatus("error");
        setGmailConnectMessage("No authUrl returned from Gmail connect endpoint.");
        return;
      }

      setGmailConnectStatus("redirecting");
      window.location.href = authUrl;
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
      const data = parseJsonMaybe(text);

      if (!res.ok) {
        setGmailSyncStatus("error");
        setGmailSyncMessage(
          getErrorMessage(data) ?? `Gmail import failed with status ${res.status}: ${text}`,
        );
        void refreshGmailStatus();
        return;
      }

      setGmailSyncStatus("ok");
      const count =
        isObject(data) && typeof data["message_count"] === "number" ? data["message_count"] : "unknown";
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

  const connectedSources =
    (driveConnected ? 1 : 0) + (gmailConnected ? 1 : 0);

  const remainingSources = Math.max(
    0,
    CONNECTED_SOURCE_LIMIT - connectedSources,
  );

  const actionItems = [
    ...(driveStatus?.last_error ? [{
      id: "drive-error",
      type: "error" as const,
      source: "Google Drive",
      message: formatErrorSnippet(driveStatus.last_error),
      time: driveStatus.last_error_time,
    }] : []),
    ...(gmailStatus?.last_error ? [{
      id: "gmail-error",
      type: "error" as const,
      source: "Gmail",
      message: formatErrorSnippet(gmailStatus.last_error),
      time: gmailStatus.last_error_time,
    }] : []),
    ...(!driveConnected ? [{
      id: "drive-disconnected",
      type: "warning" as const,
      source: "Google Drive",
      message: "Not connected. Connect to start syncing files.",
      time: null,
    }] : []),
    ...(!gmailConnected ? [{
      id: "gmail-disconnected",
      type: "warning" as const,
      source: "Gmail",
      message: "Not connected. Connect to start syncing email metadata.",
      time: null,
    }] : []),
  ];

  const recentSyncActivity = [
    ...(driveStatus?.last_sync_time ? [{
      id: "drive-sync",
      source: "Google Drive",
      action: "Sync completed",
      time: driveStatus.last_sync_time,
      details: `${driveStatus.last_sync_file_count ?? 0} items`,
      success: true,
    }] : []),
    ...(gmailStatus?.last_sync_time ? [{
      id: "gmail-sync",
      source: "Gmail",
      action: "Sync completed",
      time: gmailStatus.last_sync_time,
      details: `${gmailStatus.last_sync_message_count ?? 0} messages`,
      success: true,
    }] : []),
  ].sort((a, b) => {
    const timeA = new Date(a.time || 0).getTime();
    const timeB = new Date(b.time || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base font-semibold text-foreground">
          Connect sources, resolve issues, and keep syncs healthy.
        </p>
        <Button asChild size="sm">
          <a href="#connectors">Connect data source</a>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleConnect}
          disabled={connectStatus === "loading" || connectStatus === "redirecting"}
        >
          {driveConnected ? "Reconnect Drive" : "Connect Drive"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleGmailConnect}
          disabled={
            gmailConnectStatus === "loading" ||
            gmailConnectStatus === "redirecting"
          }
        >
          {gmailConnected ? "Reconnect Gmail" : "Connect Gmail"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            window.location.href = "/activity?groups=connectors";
          }}
        >
          View activity log
        </Button>
      </div>

      <WidgetRowSection
        id="connectors"
        title="Integration Status"
        subtitle="Status cards, action required, and recent sync activity"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <WidgetCard
              title="Google Drive"
              subtitle="Docs, Sheets, Slides, PDFs"
              className="h-[280px]"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <Database className="h-5 w-5 text-blue-500/60" />
                  <Badge
                    variant={
                      loadStatus === "loading"
                        ? "outline"
                        : driveConnected
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      loadStatus === "loading"
                        ? ""
                        : driveConnected
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800"
                          : ""
                    }
                  >
                    {loadStatus === "loading"
                      ? "Checking..."
                      : driveConnected
                        ? "Connected"
                        : "Disconnected"}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground mb-4 flex-1">
                  {driveStatus?.last_sync_time ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Last sync: {formatTimeAgo(driveStatus.last_sync_time)}</span>
                      {typeof driveStatus.last_sync_file_count === "number" && (
                        <span className="text-muted-foreground/60">
                          · {driveStatus.last_sync_file_count} items
                        </span>
                      )}
                    </div>
                  ) : driveConnected ? (
                    <div className="text-muted-foreground/60">No syncs yet</div>
                  ) : (
                    <div className="text-muted-foreground/60">Connect to start syncing</div>
                  )}

                  {driveStatus?.last_error && (
                    <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                      {formatErrorSnippet(driveStatus.last_error)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  {!driveConnected ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConnect}
                      disabled={connectStatus === "loading" || connectStatus === "redirecting"}
                      className="w-full"
                    >
                      {connectStatus === "redirecting" ? "Redirecting..." : "Connect"}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSync}
                        disabled={syncStatus === "running"}
                        className="w-full"
                      >
                        {syncStatus === "running" ? "Syncing..." : "Sync Now"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleConnect}
                        disabled={connectStatus === "loading" || connectStatus === "redirecting"}
                        className="w-full text-xs"
                      >
                        Reconnect
                      </Button>
                    </>
                  )}
                </div>
                {connectStatus === "error" && connectMessage && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTitle>Drive connection failed</AlertTitle>
                    <AlertDescription>
                      {connectMessage} Retry the connect flow or check your Drive permissions.
                    </AlertDescription>
                  </Alert>
                )}
                {syncStatus === "error" && syncMessage && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTitle>Drive import failed</AlertTitle>
                    <AlertDescription>
                      {syncMessage} Retry sync or review the activity log for details.
                    </AlertDescription>
                  </Alert>
                )}
                {syncStatus === "ok" && syncMessage && (
                  <Alert className="mt-3">
                    <AlertTitle>Drive import complete</AlertTitle>
                    <AlertDescription>{syncMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            </WidgetCard>
          </div>

          <div className="md:col-span-4">
            <WidgetCard
              title="Gmail"
              subtitle="Email metadata & attachments"
              className="h-[280px]"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <Mail className="h-5 w-5 text-red-500/60" />
                  <Badge
                    variant={
                      gmailLoadStatus === "loading"
                        ? "outline"
                        : gmailConnected
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      gmailLoadStatus === "loading"
                        ? ""
                        : gmailConnected
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800"
                          : ""
                    }
                  >
                    {gmailLoadStatus === "loading"
                      ? "Checking..."
                      : gmailConnected
                        ? "Connected"
                        : "Disconnected"}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground mb-4 flex-1">
                  {gmailStatus?.last_sync_time ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Last sync: {formatTimeAgo(gmailStatus.last_sync_time)}</span>
                      {typeof gmailStatus.last_sync_message_count === "number" && (
                        <span className="text-muted-foreground/60">
                          · {gmailStatus.last_sync_message_count} msgs
                        </span>
                      )}
                    </div>
                  ) : gmailConnected ? (
                    <div className="text-muted-foreground/60">No syncs yet</div>
                  ) : (
                    <div className="text-muted-foreground/60">Connect to start syncing</div>
                  )}

                  {gmailStatus?.last_error && (
                    <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                      {formatErrorSnippet(gmailStatus.last_error)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  {!gmailConnected ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGmailConnect}
                      disabled={
                        gmailConnectStatus === "loading" ||
                        gmailConnectStatus === "redirecting"
                      }
                      className="w-full"
                    >
                      {gmailConnectStatus === "redirecting" ? "Redirecting..." : "Connect"}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleGmailSync}
                        disabled={gmailSyncStatus === "running"}
                        className="w-full"
                      >
                        {gmailSyncStatus === "running" ? "Syncing..." : "Sync Now"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleGmailConnect}
                        disabled={
                          gmailConnectStatus === "loading" ||
                          gmailConnectStatus === "redirecting"
                        }
                        className="w-full text-xs"
                      >
                        Reconnect
                      </Button>
                    </>
                  )}
                </div>
                {gmailConnectStatus === "error" && gmailConnectMessage && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTitle>Gmail connection failed</AlertTitle>
                    <AlertDescription>
                      {gmailConnectMessage} Retry the connect flow or check your Gmail permissions.
                    </AlertDescription>
                  </Alert>
                )}
                {gmailSyncStatus === "error" && gmailSyncMessage && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTitle>Gmail import failed</AlertTitle>
                    <AlertDescription>
                      {gmailSyncMessage} Retry sync or review the activity log for details.
                    </AlertDescription>
                  </Alert>
                )}
                {gmailSyncStatus === "ok" && gmailSyncMessage && (
                  <Alert className="mt-3">
                    <AlertTitle>Gmail import complete</AlertTitle>
                    <AlertDescription>{gmailSyncMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            </WidgetCard>
          </div>

          <div className="md:col-span-4">
            <WidgetCard
              title="Action Required & Recent Sync"
              subtitle="Issues and latest jobs"
              className="h-[280px]"
            >
              <div className="flex h-full flex-col gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Action required
                  </div>
                  {actionItems.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                      All systems healthy
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {actionItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded border text-xs ${item.type === "error"
                            ? "border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20"
                            : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                            }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle
                              className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${item.type === "error" ? "text-rose-600" : "text-amber-600"
                                }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">{item.source}</div>
                              <div className="text-muted-foreground mt-0.5 break-words">
                                {item.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {actionItems.length > 3 && (
                        <div className="text-[11px] text-muted-foreground">
                          +{actionItems.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Recent sync activity
                  </div>
                  {recentSyncActivity.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      No sync activity yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentSyncActivity.slice(0, 3).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-2 p-2 rounded border border-border/40 text-xs"
                        >
                          <div className="shrink-0 mt-0.5">
                            {activity.success ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{activity.source}</div>
                            <div className="text-muted-foreground">{activity.action}</div>
                          </div>
                          <div className="text-[10px] text-muted-foreground/60 shrink-0">
                            {formatTimeAgo(activity.time)}
                          </div>
                        </div>
                      ))}
                      {recentSyncActivity.length > 3 && (
                        <div className="text-[11px] text-muted-foreground">
                          +{recentSyncActivity.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </WidgetCard>
          </div>
        </div>
      </WidgetRowSection>

      <WidgetRowSection
        id="more-signals"
        title="More signals"
        subtitle="Accounts, permissions, and data sources"
        className="mt-6"
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <WidgetCard title="Connected Accounts" subtitle={`${connectedSources} active`} className="h-[240px]">
              <div className="space-y-2">
                {driveConnected && (
                  <div className="flex items-center justify-between p-2 rounded border border-border/40 text-xs">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-blue-500/60" />
                      <span className="font-medium">Google Drive</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20">
                      Active
                    </Badge>
                  </div>
                )}
                {gmailConnected && (
                  <div className="flex items-center justify-between p-2 rounded border border-border/40 text-xs">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-red-500/60" />
                      <span className="font-medium">Gmail</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20">
                      Active
                    </Badge>
                  </div>
                )}
                {!driveConnected && !gmailConnected && (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    No connected accounts
                  </div>
                )}
              </div>
            </WidgetCard>
          </div>

          <div className="md:col-span-4">
            <WidgetCard title="Permissions" subtitle="OAuth scopes" className="h-[240px]">
              <div className="space-y-2">
                {driveConnected && (
                  <div className="p-2 rounded border border-border/40 text-xs">
                    <div className="font-medium mb-1">Google Drive</div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span className="text-[11px]">Read-only access</span>
                    </div>
                  </div>
                )}
                {gmailConnected && (
                  <div className="p-2 rounded border border-border/40 text-xs">
                    <div className="font-medium mb-1">Gmail</div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span className="text-[11px]">Read-only metadata</span>
                    </div>
                  </div>
                )}
                {!driveConnected && !gmailConnected && (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    No permissions granted
                  </div>
                )}
              </div>
            </WidgetCard>
          </div>

          <div className="md:col-span-4">
            <WidgetCard title="Data Sources" subtitle="Available slots" className="h-[240px]">
              <div className="flex flex-col h-full">
                <div className="text-2xl font-bold mb-1">
                  {connectedSources} / {CONNECTED_SOURCE_LIMIT}
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  Connected data sources
                </div>
                <div className="text-xs text-muted-foreground/70">
                  {remainingSources} slots remaining
                </div>
                <div className="flex-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.location.href = "/activity?groups=connectors";
                  }}
                  className="w-full text-xs"
                >
                  View Activity Log
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    window.location.href = "/integrations/dev-drive-test";
                  }}
                  className="w-full text-xs mt-2"
                >
                  Dev Test Page
                </Button>
              </div>
            </WidgetCard>
          </div>
        </div>
      </WidgetRowSection>
    </div>
  );
}

