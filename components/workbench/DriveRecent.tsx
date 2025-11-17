"use client";
import { useCallback, useEffect, useState } from "react";

type Status = "connected" | "needs_reauth" | "error" | "unknown";
type FileRow = { id: string; name: string; modifiedTime?: string };
type IntegrationsStatusResponse = { googleDrive?: Status };
type DriveRecentResponse = { files?: FileRow[] };

export default function DriveRecent() {
  const [status, setStatus] = useState<Status>("unknown");
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [error, setError] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const statusResponse: IntegrationsStatusResponse = await fetch("/api/integrations/status").then(
        (r) => r.json()
      );
      setStatus(statusResponse.googleDrive ?? "unknown");

      const filesResponse: DriveRecentResponse = await fetch("/api/drive/recent").then((r) => r.json());
      setFiles(Array.isArray(filesResponse.files) ? filesResponse.files : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load";
      setError(message);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const badge =
    status === "connected"
      ? { text: "Connected", className: "bg-green-100 text-green-700" }
      : status === "needs_reauth"
        ? { text: "Needs Reauth", className: "bg-amber-100 text-amber-700" }
        : status === "error"
          ? { text: "Error", className: "bg-red-100 text-red-700" }
          : { text: "Unknown", className: "bg-gray-100 text-gray-700" };

  return (
    <section className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Drive — Recent (RO)</h3>
        <span className={`text-xs px-2 py-1 rounded ${badge.className}`}>{badge.text}</span>
      </div>

      {loading && <div className="text-sm opacity-70">Loading…</div>}

      {!loading && error && (
        <div className="text-sm text-red-600">
          {error}{" "}
          <button type="button" onClick={load} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <div className="text-sm opacity-70">
          No recent files. {status !== "connected" ? "Connect Drive in Integrations." : ""}
        </div>
      )}

      {!loading && !error && files.length > 0 && (
        <ul className="space-y-2">
          {files.slice(0, 10).map((file) => (
            <li key={file.id} className="flex items-center justify-between rounded border px-3 py-2">
              <span className="truncate">{file.name}</span>
              <span className="text-xs opacity-60">
                {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={load} className="rounded border px-3 py-1 text-sm">
          Refresh
        </button>
        {status === "needs_reauth" && (
          <a href="/integrations" className="rounded bg-black px-3 py-1 text-sm text-white">
            Reauth
          </a>
        )}
      </div>
    </section>
  );
}
