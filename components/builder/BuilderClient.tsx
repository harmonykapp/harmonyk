"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import BuilderForm, { type FormValues } from "./BuilderForm";

type Template = {
  id: string;
  name: string;
  tags?: string[];
  country?: string;
};

type Props = {
  templates: Template[];
};

export default function BuilderClient({ templates }: Props) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? templates[0],
    [templates, selectedId]
  );
  const [preview, setPreview] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async ({ title, facts }: FormValues) => {
    if (isGenerating) return;
    const toastId = toast.loading("Generating…");
    setIsGenerating(true);

    try {
      const docTitle = title?.trim() || selected?.name || "Untitled";
      const content = [
        `# ${docTitle}`,
        "",
        `Template: ${selected?.name ?? "—"}`,
        selected?.tags?.length ? `Tags: ${selected.tags.join(", ")}` : "",
        "",
        "Facts:",
        facts?.trim() ? facts.trim() : "—",
        "",
        "_Preview stub: connect AI + renderer in Week 3._",
      ]
        .filter(Boolean)
        .join("\n");

      setPreview(content);
      toast.success("Draft ready", { id: toastId });

      setTimeout(() => {
        document.getElementById("preview-box")?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Generation failed";
      toast.error(message, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template selector (self-contained; no external picker dependency) */}
      <div className="grid gap-2 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Template</span>
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div className="text-sm text-neutral-500">
          {selected?.tags?.map((tag) => (
            <span
              key={tag}
              className="mr-2 inline-flex items-center rounded border px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <BuilderForm
        templateName={selected?.name ?? "Untitled"}
        onGenerateAction={handleGenerate}
        isGenerating={isGenerating}
      />

      <div id="preview-box" className="mt-8 overflow-hidden rounded border">
        <div className="border-b px-4 py-2 text-sm font-medium">Preview</div>
        <div className="p-4 whitespace-pre-wrap break-words min-h-[120px]">
          {preview || "—"}
        </div>
      </div>
    </div>
  );
}
