"use client";
import { useState } from "react";

export type FormValues = {
  title: string;
  facts: string;
};

type Props = {
  templateName: string;
  onGenerateAction: (values: FormValues) => Promise<void> | void;
  isGenerating?: boolean;
};

export default function BuilderForm({
  templateName,
  onGenerateAction,
  isGenerating = false,
}: Props) {
  const [title, setTitle] = useState("");
  const [facts, setFacts] = useState("");

  const handleClick = async () => {
    if (isGenerating) return;
    await onGenerateAction({ title, facts });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-neutral-500">
        Selected template: <span className="font-medium">{templateName}</span>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Document title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          placeholder={`${templateName} — v1`}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Facts / key terms</span>
        <textarea
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
          rows={8}
          className="mt-1 w-full rounded border px-3 py-2"
          placeholder="Party names, dates, amounts, key clauses…"
        />
      </label>

      <button
        type="button"
        onClick={handleClick}
        disabled={isGenerating}
        className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? "Generating…" : "Generate preview"}
      </button>
    </div>
  );
}
