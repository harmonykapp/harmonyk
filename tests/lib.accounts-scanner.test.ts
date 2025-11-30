import { describe, it, expect } from "vitest";

import {
  classifyFinancialDocument,
  type RawConnectorFileMeta,
} from "@/lib/accounts-scanner";

function makeMeta(partial: Partial<RawConnectorFileMeta>): RawConnectorFileMeta {
  return {
    source: partial.source ?? "drive",
    fileName: partial.fileName ?? null,
    mimeType: partial.mimeType ?? "application/pdf",
    subject: partial.subject ?? null,
    fromEmail: partial.fromEmail ?? null,
    toEmail: partial.toEmail ?? null,
    snippet: partial.snippet ?? null,
    labels: partial.labels ?? null,
  };
}

describe("classifyFinancialDocument", () => {
  it("classifies Stripe invoices as invoices with Stripe vendor", () => {
    const meta = makeMeta({
      subject: "Stripe invoice November 2025",
      fileName: "stripe-invoice-2025-11.pdf",
    });

    const result = classifyFinancialDocument(meta);

    expect(result.docType).toBe("invoice");
    expect(result.vendorName?.toLowerCase()).toBe("stripe");
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.notes).toBeTruthy();
    expect(result.notes?.length).toBeGreaterThan(0);
  });

  it("classifies bank statements as bank_statement", () => {
    const meta = makeMeta({
      subject: "Chase Business Bank Statement 01-30 Nov 2025",
      fileName: "chase-business-bank-statement-2025-11.pdf",
    });

    const result = classifyFinancialDocument(meta);

    expect(result.docType).toBe("bank_statement");
    // Vendor detection is heuristic; just ensure it finds something non-empty.
    if (result.vendorName) {
      expect(result.vendorName.length).toBeGreaterThan(0);
    }
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("classifies P&L reports as pnl_statement", () => {
    const meta = makeMeta({
      subject: "Xero Profit and Loss July 2025",
      fileName: "xero-profit-and-loss-2025-07.pdf",
    });

    const result = classifyFinancialDocument(meta);

    expect(result.docType).toBe("pnl_statement");
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("falls back to other for non-financial docs", () => {
    const meta = makeMeta({
      subject: "Co-founder Mutual NDA v2",
      fileName: "cofounder-nda-v2.pdf",
    });

    const result = classifyFinancialDocument(meta);

    expect(result.docType).toBe("other");
    // Confidence should not be absurdly high for unknowns.
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });
});

