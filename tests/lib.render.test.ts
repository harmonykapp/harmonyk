import { describe, expect, it } from "vitest";
import { renderContent } from "@/lib/render";

describe("renderContent", () => {
  it("renders markdown input and flags it as markdown", () => {
    const markdown = "## Title\n\nSome **bold** text.";
    const result = renderContent(markdown);

    expect(result.isMarkdown).toBe(true);
    expect(result.html).toContain("<h2");
    expect(result.html).toContain("<strong");
  });

  it("renders explicit HTML input without re-markdowning", () => {
    const html = "<p>Hello</p>";
    const result = renderContent(html, "html");

    expect(result.isMarkdown).toBe(false);
    expect(result.html).toContain("<p>Hello</p>");
  });

  it("sanitizes dangerous markup", () => {
    const malicious = '<p>Safe</p><script>alert("xss")</script>';
    const result = renderContent(malicious, "html");

    expect(result.html).toContain("<p>Safe</p>");
    expect(result.html).not.toContain("<script");
    expect(result.isMarkdown).toBe(false);
  });
});

