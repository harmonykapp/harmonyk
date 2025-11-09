"use client";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LivePreview({
  markdown, onPreviewEvent,
}: { markdown: string; onPreviewEvent?: (meta?: any) => void }) {
  // ... your existing LivePreview code ...
  return (
    <div className="prose max-w-none border rounded p-3 bg-white">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdown || "_Select a template and start filling the form to see the live preview._"}
      </ReactMarkdown>
    </div>
  );
}
