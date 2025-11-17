import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export interface RenderResult {
  html: string;
  isMarkdown: boolean;
}

type Format = "md" | "html";

const allowedTags = Array.from(
  new Set([
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "th",
    "td",
    "tr",
    "code",
    "pre",
  ])
);

const allowedAttributes: sanitizeHtml.IOptions["allowedAttributes"] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  "*": ["class"],
};

const baseSchemes = sanitizeHtml.defaults.allowedSchemes ?? [];
const baseSchemesByTag: Record<string, string[]> =
  sanitizeHtml.defaults.allowedSchemesByTag ?? {};

function detectFormat(raw: string): Format {
  const trimmed = raw.trim();
  if (trimmed.startsWith("<") && trimmed.includes("</")) {
    return "html";
  }
  return "md";
}

function sanitize(html: string) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: [...baseSchemes, "data"],
    allowedSchemesByTag: {
      ...baseSchemesByTag,
      img: ["http", "https", "data"],
    },
  });
}

export function renderContent(raw: string, explicitFormat?: Format): RenderResult {
  const safeInput = raw ?? "";
  if (!safeInput.trim()) {
    return { html: "", isMarkdown: explicitFormat ? explicitFormat === "md" : true };
  }

  const format = explicitFormat ?? detectFormat(safeInput);

  if (format === "html") {
    return { html: sanitize(safeInput), isMarkdown: false };
  }

  const rendered = marked.parse(safeInput);
  if (typeof rendered !== "string") {
    throw new Error("Markdown renderer returned an unexpected async result.");
  }

  return { html: sanitize(rendered), isMarkdown: true };
}

