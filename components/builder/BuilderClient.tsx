"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { generateDraft, type Triage } from "@/lib/ai";
import { renderContent } from "@/lib/render";
import { phCapture } from "@/lib/posthog-client";
import type { TemplateDef } from "@/data/templates";
import BuilderForm, { type FormValues } from "./BuilderForm";

type Template = TemplateDef;

type InitialDoc = {
  id: string;
  title: string;
  templateId?: string;
  content: string;
  versionNumber?: number;
};

type Props = {
  templates: Template[];
  initialDoc?: InitialDoc | null;
};

const inferTriage = (template?: Template): Triage => {
  if (!template) return "generic";
  if (template.category === "deck") return "deck";
  if (template.category === "contract") return "contract";
  return "generic";
};

const buildPrompt = ({
  template,
  title,
  facts,
}: {
  template: Template;
  title?: string;
  facts?: string;
}) => {
  const parts = [
    `Template: ${template.name}`,
    template.description ? `Template description:\n${template.description}` : null,
    template.defaultPrompt ? `Baseline guidance:\n${template.defaultPrompt}` : null,
    title?.trim() ? `Document title: ${title.trim()}` : null,
    facts?.trim() ? `Facts / key terms:\n${facts.trim()}` : null,
    "Output requirements:\n- Return a full draft ready for review\n- Use headings and bullets when useful\n- Highlight placeholders with [BRACKETS] if info is missing",
  ].filter(Boolean);

  return parts.join("\n\n");
};

const buildFallbackDraft = (template: Template, values: FormValues, markdown?: string) => {
  if (markdown && markdown.trim().length > 0) return markdown;
  const lines = [
    `# ${values.title?.trim() || template.name}`,
    "",
    values.facts?.trim()
      ? `## Key Facts\n${values.facts.trim()}`
      : "## Draft\nContent pending manual edits.",
  ];
  return lines.join("\n");
};

export default function BuilderClient({ templates, initialDoc }: Props) {
  const [selectedId, setSelectedId] = useState<string>(initialDoc?.templateId ?? templates[0]?.id ?? "");
  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? templates[0],
    [templates, selectedId]
  );
  const [formValues, setFormValues] = useState<FormValues>({
    title: initialDoc?.title ?? "",
    facts: "",
  });
  const [previewHtml, setPreviewHtml] = useState(() =>
    initialDoc?.content ? renderContent(initialDoc.content).html : ""
  );
  const [lastMarkdown, setLastMarkdown] = useState<string | null>(initialDoc?.content ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(initialDoc?.id ?? null);
  const [latestVersion, setLatestVersion] = useState<number | null>(initialDoc?.versionNumber ?? null);

  useEffect(() => {
    if (!initialDoc) return;
    setActiveDocId(initialDoc.id);
    setSelectedId(initialDoc.templateId ?? templates[0]?.id ?? "");
    setFormValues((prev) => ({ ...prev, title: initialDoc.title }));
    if (initialDoc.content) {
      setLastMarkdown(initialDoc.content);
      setPreviewHtml(renderContent(initialDoc.content).html);
    }
    setLatestVersion(initialDoc.versionNumber ?? null);
  }, [initialDoc, templates]);

  const handleGenerate = useCallback(
    async (values: FormValues) => {
      if (!selected || isGenerating) return;
      const toastId = toast.loading("Generating…");
      setIsGenerating(true);
      setGenerationError(null);

      try {
        const prompt = buildPrompt({ template: selected, title: values.title, facts: values.facts });
        const triage = inferTriage(selected);
        phCapture("builder_generate", {
          docId: activeDocId ?? null,
          templateId: selected.id ?? null,
          triage,
        });
        const result = await generateDraft(prompt, {
          templateId: selected.id,
          triage,
        });
        const rendered = renderContent(result);
        setPreviewHtml(rendered.html);
        setLastMarkdown(result);
        toast.success("Draft generated", { id: toastId });
        setTimeout(() => {
          document.getElementById("preview-box")?.scrollIntoView({ behavior: "smooth" });
        }, 0);
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Could not generate draft. Please try again.";
        setGenerationError(message);
        toast.error("Could not generate draft. Please try again.", { id: toastId });
        const fallbackDraft = buildFallbackDraft(selected, values, lastMarkdown ?? undefined);
        setLastMarkdown(fallbackDraft);
        setPreviewHtml(renderContent(fallbackDraft).html);
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, selected, lastMarkdown]
  );

  const handleSave = useCallback(async () => {
    if (!selected) return;
    if (!lastMarkdown) {
      toast.error("Generate a draft before saving to Vault.");
      return;
    }
    setIsSaving(true);
    try {
      const title =
        formValues.title.trim() || `${selected.name} — ${new Date().toLocaleDateString()}`;

      const response = await fetch("/api/documents/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: activeDocId ?? undefined,
          templateId: selected.id,
          title,
          content: lastMarkdown,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        docId?: string;
        versionNumber?: number;
        error?: string;
      };

      if (!response.ok || !payload.docId || !payload.versionNumber) {
        throw new Error(payload?.error || "Could not save to Vault.");
      }

      setActiveDocId(payload.docId);
      setLatestVersion(payload.versionNumber);
      setFormValues((prev) => ({ ...prev, title }));
      toast.success(`Saved to Vault (v${payload.versionNumber})`);
      phCapture("vault_save", {
        docId: payload.docId,
        templateId: selected.id ?? null,
        versionNumber: payload.versionNumber,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save draft. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }, [activeDocId, formValues.title, lastMarkdown, selected]);

  const canSave = Boolean(lastMarkdown) && !isGenerating;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Contracts</p>
          <h2 className="text-2xl font-semibold leading-tight">Builder</h2>
          <p className="text-secondary">
            {selected?.description ?? "Pick a template, personalize it, then save to Vault."}
          </p>
        </div>
        <div className="header-actions" style={{ display: "flex", gap: 12 }}>
          {activeDocId ? (
            <span className="badge">
              Doc ID: {activeDocId.slice(0, 6)}…{latestVersion ? ` / v${latestVersion}` : ""}
            </span>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSave || isSaving}
          >
            {isSaving ? "Saving…" : activeDocId ? "Save new version" : "Save to Vault"}
          </button>
        </div>
      </div>

      <div className="builder-grid">
        <section className="card">
          <div className="section-title">Template</div>
          <label className="form-field">
            <span>Select template</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          {selected?.category ? (
            <div style={{ marginTop: 12 }}>
              <span className="badge" style={{ textTransform: "uppercase" }}>
                {selected.category}
              </span>
            </div>
          ) : null}

          <div style={{ marginTop: 32 }} />
          <BuilderForm
            templateName={selected?.name ?? "Untitled"}
            values={formValues}
            onChange={setFormValues}
            onGenerateAction={handleGenerate}
            isGenerating={isGenerating}
          />
        </section>

        <section className="card preview-pane" id="preview-box">
          <div className="section-title">Preview</div>
          {previewHtml ? (
            <article
              className="prose prose-slate max-w-none"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <p className="empty">Generate a draft to see the formatted preview.</p>
          )}
          {generationError ? <p className="text-secondary">Error: {generationError}</p> : null}
        </section>
      </div>
    </div>
  );
}
