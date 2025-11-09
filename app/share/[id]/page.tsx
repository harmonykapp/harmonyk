"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams } from "next/navigation";

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const shareId = params?.id;

  const [loading, setLoading] = useState(true);
  const [needPass, setNeedPass] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("Loading…");
  const [markdown, setMarkdown] = useState("");

  const sentOpen = useRef(false);

  async function fetchMarkdown() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/shares/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId }),
    });
    if (res.status === 401) {
      setNeedPass(true);
      setLoading(false);
      return;
    }
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error || "Failed to load");
      setLoading(false);
      return;
    }
    setTitle(json.title ?? "Shared Document");
    setMarkdown(json.markdown ?? "");
    setLoading(false);

    // Log open once
    if (!sentOpen.current) {
      sentOpen.current = true;
      fetch("/api/events/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "share_open", shareId }),
      });
    }
  }

  async function submitPass(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const res = await fetch("/api/shares/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId, passcode }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error || "Invalid passcode");
      return;
    }
    setNeedPass(false);
    setPasscode("");
    await fetchMarkdown();
  }

  useEffect(() => {
    if (!shareId) return;
    fetchMarkdown();
  }, [shareId]);

  // Scroll analytics at 33/66/95
  useEffect(() => {
    if (!markdown || needPass) return;
    const buckets = [33, 66, 95];
    let sent: Record<number, boolean> = {};
    const onScroll = () => {
      const h = document.documentElement;
      const pct = Math.round(((h.scrollTop + h.clientHeight) / h.scrollHeight) * 100);
      for (const b of buckets) {
        if (!sent[b] && pct >= b) {
          sent[b] = true;
          fetch("/api/events/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "scroll", shareId, meta: { pct: b } }),
          });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [markdown, needPass, shareId]);

  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-4 border-b">
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>

      {/* Passcode modal */}
      {needPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={submitPass}
            className="w-[90%] max-w-sm rounded-xl bg-white p-5 shadow-xl border"
          >
            <div className="text-base font-medium mb-2">Enter passcode</div>
            <input
              autoFocus
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="••••••"
            />
            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                className="border rounded px-3 py-2"
                onClick={() => (window.location.href = "/")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-black text-white rounded px-3 py-2"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      <main className="px-6 py-6">
        {loading && !needPass && <div className="opacity-70">Loading…</div>}
        {error && !needPass && <div className="text-red-600">Error: {error}</div>}
        {!loading && !needPass && !error && (
          <article className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
        )}
      </main>
    </div>
  );
}
