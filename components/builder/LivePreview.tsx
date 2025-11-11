"use client";

import { useEffect } from "react";

type Props = {
  markdown: string;
  onPreviewEventAction?: (evt: { type: "open" | "scroll"; pct?: number }) => void;
};

export default function LivePreview({ markdown, onPreviewEventAction }: Props) {
  useEffect(() => {
    onPreviewEventAction?.({ type: "open" });
    const onScroll = () => {
      const el = document.scrollingElement || document.documentElement;
      const pct = el ? Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100) : 0;
      onPreviewEventAction?.({ type: "scroll", pct });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onPreviewEventAction]);

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" }}>
      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{markdown || "—"}</pre>
    </div>
  );
}
