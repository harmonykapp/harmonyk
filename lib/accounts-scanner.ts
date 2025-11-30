export type FinancialDocType =
  | "invoice"
  | "receipt"
  | "subscription"
  | "bank_statement"
  | "card_statement"
  | "pnl_statement"
  | "balance_sheet"
  | "tax_document"
  | "payroll"
  | "other";

export type AccountsReportType =
  | "monthly_expenses_pack"
  | "investor_accounts_snapshot";

/**
 * Minimal metadata we can get from existing connectors (Gmail / Drive).
 * This is intentionally generic so it can be used from both sides of the pipeline:
 * - connector ingestion (classify on ingest)
 * - batch rescans (reclassify existing items)
 */
export interface RawConnectorFileMeta {
  source: "gmail" | "drive" | "manual" | "quickbooks" | "xero" | "other";
  fileName?: string | null;
  mimeType?: string | null;
  subject?: string | null;
  fromEmail?: string | null;
  toEmail?: string | null;
  snippet?: string | null;
  /**
   * Optional free-form tags from upstream (e.g. Gmail labels).
   */
  labels?: string[] | null;
}

export interface InferredFinancialClassification {
  docType: FinancialDocType;
  confidence: number; // 0–1
  vendorName: string | null;
  notes: string | null;
}

const VENDOR_HINTS: ReadonlyArray<{ key: string; vendor: string }> = [
  { key: "stripe", vendor: "Stripe" },
  { key: "aws", vendor: "AWS" },
  { key: "amazon web services", vendor: "AWS" },
  { key: "google", vendor: "Google" },
  { key: "gcp", vendor: "Google Cloud" },
  { key: "notion", vendor: "Notion" },
  { key: "figma", vendor: "Figma" },
  { key: "github", vendor: "GitHub" },
  { key: "openai", vendor: "OpenAI" },
  { key: "microsoft", vendor: "Microsoft" },
  { key: "azure", vendor: "Microsoft Azure" },
];

function normalize(input: string | null | undefined): string {
  return (input ?? "").trim().toLowerCase();
}

function contains(text: string | null | undefined, needle: string): boolean {
  const haystack = normalize(text);
  return haystack.includes(needle.toLowerCase());
}

function guessDocType(meta: RawConnectorFileMeta): {
  docType: FinancialDocType;
  confidence: number;
  notes: string | null;
} {
  const name = normalize(meta.fileName);
  const subject = normalize(meta.subject);
  const snippet = normalize(meta.snippet);
  const combined = `${name} ${subject} ${snippet}`;

  const marks = (reason: string, docType: FinancialDocType, confidence: number) => ({
    docType,
    confidence,
    notes: reason,
  });

  if (combined.length === 0) {
    return marks("no usable text; defaulting to other", "other", 0.1);
  }

  if (combined.match(/\binvoice\b/) || combined.includes("inv-")) {
    return marks("matched invoice keywords", "invoice", 0.9);
  }

  if (combined.match(/\breceipt\b/) || combined.match(/\bpayment confirmation\b/)) {
    return marks("matched receipt / payment confirmation", "receipt", 0.85);
  }

  if (combined.match(/\bsubscription\b/) || combined.match(/\bplan\b.*\bmonthly\b/)) {
    return marks("matched subscription language", "subscription", 0.8);
  }

  if (combined.match(/\bbank statement\b/) || combined.match(/\baccount statement\b/)) {
    return marks("matched bank statement keywords", "bank_statement", 0.9);
  }

  if (combined.match(/\bcredit card\b/) || combined.match(/\bcard statement\b/)) {
    return marks("matched card statement keywords", "card_statement", 0.85);
  }

  if (combined.match(/\bprofit\b.*\bloss\b/) || combined.includes("p&l")) {
    return marks("matched P&L / profit & loss", "pnl_statement", 0.9);
  }

  if (combined.match(/\bbalance sheet\b/)) {
    return marks("matched balance sheet keywords", "balance_sheet", 0.9);
  }

  if (combined.match(/\btax\b/) || combined.match(/\birs\b/) || combined.match(/\baudit\b/)) {
    return marks("matched tax keywords", "tax_document", 0.8);
  }

  if (combined.match(/\bpayroll\b/) || combined.match(/\bpayslip\b/) || combined.match(/\bwage\b/)) {
    return marks("matched payroll keywords", "payroll", 0.85);
  }

  return marks("no strong match; defaulting to other", "other", 0.4);
}

function guessVendorName(meta: RawConnectorFileMeta): string | null {
  const name = normalize(meta.fileName);
  const subject = normalize(meta.subject);
  const snippet = normalize(meta.snippet);
  const fromEmail = normalize(meta.fromEmail);

  const haystack = `${name} ${subject} ${snippet} ${fromEmail}`;

  for (const hint of VENDOR_HINTS) {
    if (haystack.includes(hint.key)) {
      return hint.vendor;
    }
  }

  if (fromEmail.includes("@")) {
    const domain = fromEmail.split("@")[1] ?? "";
    if (domain) {
      const bareDomain = domain.split(".")[0] ?? "";
      if (bareDomain && bareDomain.length > 2) {
        return bareDomain.charAt(0).toUpperCase() + bareDomain.slice(1);
      }
    }
  }

  return null;
}

/**
 * Pure classifier: turns raw connector metadata into a normalized
 * financial classification that can be used to populate financial_documents.
 *
 * This does not hit the database; it is safe to use on both server and client
 * as part of the ingestion pipeline.
 */
export function classifyFinancialDocument(
  meta: RawConnectorFileMeta,
): InferredFinancialClassification {
  const base = guessDocType(meta);
  const vendorName = guessVendorName(meta);

  let confidence = base.confidence;
  const notes: string[] = [];

  notes.push(base.notes ?? "no base notes");

  if (vendorName) {
    confidence = Math.min(1, confidence + 0.05);
    notes.push(`vendor: ${vendorName}`);
  }

  if (meta.labels && meta.labels.length > 0) {
    notes.push(`labels: ${meta.labels.join(", ")}`);
  }

  return {
    docType: base.docType,
    confidence,
    vendorName,
    notes: notes.join(" | "),
  };
}

