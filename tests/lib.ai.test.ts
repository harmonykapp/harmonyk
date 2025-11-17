import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { generateDraft } from "@/lib/ai";

const originalFetch = global.fetch;

function mockResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), { status: 200, ...init });
}

describe("generateDraft", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete (global as typeof globalThis).fetch;
    }
  });

  it("returns content when the AI endpoint succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ content: "Hello world" }));
    global.fetch = fetchMock as typeof fetch;

    const result = await generateDraft("test prompt", { templateId: "nda_mutual" });

    expect(result).toBe("Hello world");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once when the first call fails", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(mockResponse({ content: "Second try" }));
    global.fetch = fetchMock as typeof fetch;

    const result = await generateDraft("retry please", { templateId: "msa_basic" });

    expect(result).toBe("Second try");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting retries", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("fatal"));
    global.fetch = fetchMock as typeof fetch;

    await expect(generateDraft("fail twice")).rejects.toThrow("fatal");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

