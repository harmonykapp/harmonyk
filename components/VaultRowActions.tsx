"use client";

import { useTransition } from "react";

type Props = {
  docId: string;
  url?: string;
  userId?: string; // optional (if you want to pass the authed user id)
};

export default function VaultRowActions({ docId, url, userId }: Props) {
  const [pending, start] = useTransition();

  async function log(event_type: "view"|"download"|"share_created", extra?: Record<string, any>) {
    await fetch("/api/events/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_id: docId,
        event_type,
        actor: userId ?? null,
        meta: { from: "vault", ...extra },
      }),
    });
  }

  function onView() {
    if (!url) return;
    start(async () => {
      await log("view");
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  function onDownload() {
    if (!url) return;
    start(async () => {
      await log("download");
      // simple download: navigate to URL (browser will render .md; fine for now)
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  async function onShare() {
    start(async () => {
      // create a share row via a simple API
      const r = await fetch("/api/shares/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: docId }),
      });
      const j = await r.json();
      if (j?.id) {
        await log("share_created", { share_id: j.id });
        window.open(`/share/${j.id}`, "_blank", "noopener,noreferrer");
      } else {
        alert("Failed to create share link: " + (j?.error || "unknown error"));
      }
    });
  }

  return (
    <div style={{display:"flex", gap:8}}>
      <button onClick={onView} disabled={!url || pending}>View</button>
      <button onClick={onDownload} disabled={!url || pending}>Download</button>
      <button onClick={onShare} disabled={pending}>Create link</button>
    </div>
  );
}
