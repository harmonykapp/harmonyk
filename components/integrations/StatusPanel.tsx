"use client";

import { useEffect, useState } from "react";

type Status = "connected" | "needs_reauth" | "error" | "unknown";
type StatusResponse = { googleDrive?: Status; lastCheckedAt?: string };

export default function StatusPanel() {
    const [status, setStatus] = useState<Status>("unknown");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    async function load() {
        setLoading(true);
        setError("");
        try {
            const res: StatusResponse = await fetch("/api/integrations/status", { cache: "no-store" }).then(r => r.json());
            setStatus((res.googleDrive as Status) ?? "unknown");
        } catch (e: any) {
            setError(e?.message || "Failed to load status");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    const badge =
        status === "connected"
            ? { text: "Connected", cls: "bg-green-100 text-green-700" }
            : status === "needs_reauth"
                ? { text: "Needs Reauth", cls: "bg-amber-100 text-amber-700" }
                : status === "error"
                    ? { text: "Error", cls: "bg-red-100 text-red-700" }
                    : { text: "Unknown", cls: "bg-gray-100 text-gray-700" };

    return (
        <section className="rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Google Drive</h3>
                <span className={`text-xs px-2 py-1 rounded ${badge.cls}`}>{badge.text}</span>
            </div>

            {loading && <div className="text-sm opacity-70">Checking status…</div>}
            {!loading && error && (
                <div className="text-sm text-red-600">
                    {error} <button onClick={load} className="ml-2 underline">Retry</button>
                </div>
            )}
            {!loading && !error && status === "needs_reauth" && (
                <div className="text-sm">
                    Drive isn’t connected yet.
                    <a href="/integrations" className="ml-1 underline">Open Integrations</a> to re-authenticate.
                </div>
            )}
            {!loading && !error && status === "connected" && (
                <div className="text-sm opacity-70">All good. Recent (RO) will populate once OAuth is wired.</div>
            )}

            <div className="mt-3">
                <button onClick={load} className="rounded border px-3 py-1 text-sm">Refresh</button>
            </div>
        </section>
    );
}
