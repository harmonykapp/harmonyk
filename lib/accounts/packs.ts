// Accounts Packs v1 — shared types for Week 15
// This file intentionally contains **types only**. No runtime logic yet.
// Day 2 will add the query implementations that return these shapes.

import type { SupabaseLikeClient } from "../activity-log";

export type AccountsPackType =
  | "saas_monthly_expenses"
  | "investor_accounts_snapshot";

export const ACCOUNTS_PACK_TYPES: readonly AccountsPackType[] = [
  "saas_monthly_expenses",
  "investor_accounts_snapshot",
] as const;

/**
 * Simple date range using ISO-8601 date strings (YYYY-MM-DD).
 */
export interface AccountsDateRange {
  start: string;
  end: string;
}

/**
 * Headline metrics for the Monthly SaaS Expenses Pack.
 */
export interface SaaSExpensesPackHeadlineMetrics {
  /**
   * Total SaaS spend in the primary period.
   */
  totalAmount: number;
  /**
   * ISO 4217 currency code for totals (e.g. "USD").
   */
  currency: string;
  /**
   * Number of unique SaaS vendors in the period.
   */
  vendorCount: number;
  /**
   * Number of unique SaaS categories in the period.
   */
  categoryCount: number;
  /**
   * Average spend per vendor, or null if there are no vendors.
   */
  averagePerVendor: number | null;
  /**
   * Primary reporting period.
   */
  period: AccountsDateRange;
  /**
   * Comparison period (previous period of same length), if available.
   */
  comparisonPeriod?: AccountsDateRange;
  /**
   * Absolute change in totalAmount vs comparison period.
   */
  deltaAmount?: number;
  /**
   * Percentage change vs comparison period (0–100 or negative).
   */
  deltaPercent?: number | null;
}

/**
 * Breakdown of SaaS spend per vendor for the pack.
 *
 * Note: `category` is a display label, not tied to a DB enum here.
 */
export interface SaaSExpenseVendorBreakdown {
  vendorName: string;
  category: string;
  /**
   * Normalized monthly spend for this vendor over the primary period.
   */
  monthlyAmount: number;
  currency: string;
  /**
   * Number of underlying expense records contributing to this vendor.
   */
  documentCount: number;
  /**
   * Rough breakdown of how we detected the expense.
   */
  sourceCount: {
    gmail: number;
    drive: number;
    manual: number;
  };
}

/**
 * Complete Monthly SaaS Expenses Pack payload.
 */
export interface SaaSExpensesPack {
  type: "saas_monthly_expenses";
  /**
    * Org ID is resolved on the server; not trusted from the client.
    */
  orgId: string;
  /**
   * ISO timestamp when this pack was generated.
   */
  generatedAt: string;
  headline: SaaSExpensesPackHeadlineMetrics;
  vendors: SaaSExpenseVendorBreakdown[];
}

/**
 * Headline investor-facing metrics derived from expenses and financial docs.
 */
export interface InvestorSnapshotHeadlineMetrics {
  cashBalance?: number | null;
  cashCurrency?: string | null;
  monthlySaaSBurn?: number | null;
  totalMonthlyBurn?: number | null;
  estimatedRunwayMonths?: number | null;
  contractsInVault?: number;
  decksInVault?: number;
  accountsDocsInVault?: number;
  totalDocsInVault?: number;
  period: AccountsDateRange;
}

/**
 * Additional metrics that can be rendered as tiles or charts in /insights.
 */
export interface InvestorSnapshotTrailMetric {
  label: string;
  value: number;
  unit?: string;
}

/**
 * Complete Investor Accounts Snapshot Pack payload.
 */
export interface InvestorAccountsSnapshotPack {
  type: "investor_accounts_snapshot";
  orgId: string;
  generatedAt: string;
  headline: InvestorSnapshotHeadlineMetrics;
  metricsTrail: InvestorSnapshotTrailMetric[];
}

/**
 * Discriminated union of all Accounts Packs.
 */
export type AccountsPack = SaaSExpensesPack | InvestorAccountsSnapshotPack;

/**
 * Request payloads for /api/accounts/packs.
 *
 * Note: org_id will always be resolved from the authenticated session
 * on the server. It is intentionally **not** part of the request payload.
 */
export interface SaaSExpensesPackRequestPayload {
  type: "saas_monthly_expenses";
  /**
   * Optional explicit period override. If omitted, the server may default
   * to the current calendar month.
   */
  period?: AccountsDateRange;
}

export interface InvestorAccountsSnapshotRequestPayload {
  type: "investor_accounts_snapshot";
}

export type AccountsPackRequestPayload =
  | SaaSExpensesPackRequestPayload
  | InvestorAccountsSnapshotRequestPayload;

/**
 * Convenience alias for API responses.
 */
export type AccountsPackResponse = AccountsPack;

// =============================================================================
// Internal DB row shapes (narrow slices of the real tables)
// =============================================================================

interface AccountsExpenseRow {
  id: string;
  expense_date?: string | null;
  vendor?: string | null;
  category?: string | null;
  amount: number;
  currency: string | null;
  financial_document_id: string;
}

interface FinancialDocumentSourceRow {
  id: string;
  source_connector: string;
}

interface DocumentRow {
  id: string;
  kind?: string | null;
}

interface SourceConnectorInfo {
  financialDocumentId: string;
  sourceConnector: string;
}

const SAAS_CATEGORY_HINTS: readonly string[] = [
  "saas",
  "software",
  "subscription",
  "subscriptions",
];

function toIsoDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;

  return `${year}-${mm}-${dd}`;
}

function normalizePeriod(period?: AccountsDateRange): AccountsDateRange {
  if (period) {
    return period;
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    start: toIsoDateString(start),
    end: toIsoDateString(end),
  };
}

function getPreviousPeriod(period: AccountsDateRange): AccountsDateRange {
  const startDate = new Date(period.start + "T00:00:00Z");
  const endDate = new Date(period.end + "T00:00:00Z");

  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - (diffDays - 1) * 24 * 60 * 60 * 1000);

  return {
    start: toIsoDateString(prevStart),
    end: toIsoDateString(prevEnd),
  };
}

function isSaaSCategory(category: string | null | undefined): boolean {
  if (!category) {
    return false;
  }

  const lower = category.trim().toLowerCase();
  if (!lower) {
    return false;
  }
  return SAAS_CATEGORY_HINTS.some((hint) => lower.includes(hint));
}

function pickPrimaryCurrency(rows: AccountsExpenseRow[]): string | null {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const currency = (row.currency ?? "").trim();
    if (!currency) {
      continue;
    }
    const current = counts.get(currency) ?? 0;
    counts.set(currency, current + 1);
  }

  let bestCurrency: string | null = null;
  let bestCount = 0;
  for (const [currency, count] of counts.entries()) {
    if (count > bestCount) {
      bestCurrency = currency;
      bestCount = count;
    }
  }

  return bestCurrency;
}

function sumAmount(rows: AccountsExpenseRow[]): number {
  return rows.reduce((acc, row) => acc + Number(row.amount ?? 0), 0);
}

function mapSourcesByFinancialDocument(
  sources: SourceConnectorInfo[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const source of sources) {
    map.set(source.financialDocumentId, source.sourceConnector);
  }
  return map;
}

// =============================================================================
// Pure aggregation helpers (exported for tests)
// =============================================================================

export function buildSaaSExpensesPackFromRows(params: {
  orgId: string;
  period: AccountsDateRange;
  now: Date;
  expenses: AccountsExpenseRow[];
  sources: SourceConnectorInfo[];
  comparison?: {
    period: AccountsDateRange;
    totalAmount: number;
  } | null;
}): SaaSExpensesPack {
  const { orgId, period, now, expenses, sources, comparison } = params;

  const saasFiltered = expenses.filter((row) => isSaaSCategory(row.category));
  const effectiveExpenses = saasFiltered.length > 0 ? saasFiltered : expenses;

  const sourceMap = mapSourcesByFinancialDocument(sources);

  const vendorsMap = new Map<string, SaaSExpenseVendorBreakdown>();
  const categories = new Set<string>();

  let totalAmount = 0;

  for (const row of effectiveExpenses) {
    const vendorName = (row.vendor ?? "Unknown Vendor").trim() || "Unknown Vendor";
    const rawCategory = row.category ?? "";
    const category = rawCategory.trim() || "uncategorized";

    categories.add(category);
    totalAmount += Number(row.amount ?? 0);

    let vendorEntry = vendorsMap.get(vendorName);
    if (!vendorEntry) {
      vendorEntry = {
        vendorName,
        category,
        monthlyAmount: 0,
        currency: row.currency ?? "",
        documentCount: 0,
        sourceCount: {
          gmail: 0,
          drive: 0,
          manual: 0,
        },
      };
      vendorsMap.set(vendorName, vendorEntry);
    }

    vendorEntry.monthlyAmount += Number(row.amount ?? 0);
    vendorEntry.documentCount += 1;

    const source = sourceMap.get(row.financial_document_id);
    if (source === "gmail") {
      vendorEntry.sourceCount.gmail += 1;
    } else if (source === "drive") {
      vendorEntry.sourceCount.drive += 1;
    } else if (source) {
      vendorEntry.sourceCount.manual += 1;
    }
  }

  const vendorCount = vendorsMap.size;
  const categoryCount = categories.size;
  const averagePerVendor = vendorCount > 0 ? totalAmount / vendorCount : null;
  const currency = pickPrimaryCurrency(effectiveExpenses) ?? "";

  const comparisonTotal = comparison?.totalAmount ?? 0;
  const deltaAmount =
    comparison && comparisonTotal > 0 ? totalAmount - comparisonTotal : undefined;
  const deltaPercent =
    comparison && comparisonTotal > 0
      ? (totalAmount - comparisonTotal) / comparisonTotal * 100
      : null;

  const headline: SaaSExpensesPackHeadlineMetrics = {
    totalAmount,
    currency,
    vendorCount,
    categoryCount,
    averagePerVendor,
    period,
    comparisonPeriod: comparison?.period,
    deltaAmount,
    deltaPercent,
  };

  const vendors = Array.from(vendorsMap.values());

  return {
    type: "saas_monthly_expenses",
    orgId,
    generatedAt: now.toISOString(),
    headline,
    vendors,
  };
}

export function buildInvestorAccountsSnapshotPackFromRows(params: {
  orgId: string;
  period: AccountsDateRange;
  now: Date;
  expenses: AccountsExpenseRow[];
  documents: DocumentRow[];
}): InvestorAccountsSnapshotPack {
  const { orgId, period, now, expenses, documents } = params;

  const saasFiltered = expenses.filter((row) => isSaaSCategory(row.category));
  const effectiveExpenses = saasFiltered.length > 0 ? saasFiltered : expenses;

  const totalSaaS = sumAmount(effectiveExpenses);
  const monthlySaaSBurn = totalSaaS > 0 ? totalSaaS / 3 : null;
  const totalMonthlyBurn = monthlySaaSBurn;

  const contractsInVault = documents.filter((doc) => doc.kind === "contract").length;
  const decksInVault = documents.filter((doc) => doc.kind === "deck").length;
  const accountsDocsInVault = documents.filter((doc) => doc.kind === "statement").length;
  const totalDocsInVault = documents.length;

  const headline: InvestorSnapshotHeadlineMetrics = {
    cashBalance: null,
    cashCurrency: null,
    monthlySaaSBurn,
    totalMonthlyBurn,
    estimatedRunwayMonths: null,
    contractsInVault,
    decksInVault,
    accountsDocsInVault,
    totalDocsInVault,
    period,
  };

  const metricsTrail: InvestorSnapshotTrailMetric[] = [];

  if (monthlySaaSBurn !== null) {
    metricsTrail.push({
      label: "Monthly SaaS Burn (90d avg)",
      value: monthlySaaSBurn,
      unit: "currency",
    });
  }

  metricsTrail.push(
    { label: "Contracts in Vault", value: contractsInVault, unit: "contracts" },
    { label: "Decks in Vault", value: decksInVault, unit: "decks" },
    {
      label: "Accounts Docs in Vault",
      value: accountsDocsInVault,
      unit: "statements",
    },
    { label: "Total Docs in Vault", value: totalDocsInVault, unit: "docs" },
  );

  return {
    type: "investor_accounts_snapshot",
    orgId,
    generatedAt: now.toISOString(),
    headline,
    metricsTrail,
  };
}

// =============================================================================
// Public server helpers (DB access layer)
// =============================================================================

async function fetchAccountsExpensesForPeriod(
  supabase: SupabaseLikeClient,
  orgId: string,
  period: AccountsDateRange,
): Promise<AccountsExpenseRow[]> {
  // Use created_at as a proxy for expense date. Some environments may not have
  // an explicit expense_date column yet, but created_at is guaranteed.
  const startTimestamp = `${period.start}T00:00:00Z`;
  const endTimestamp = `${period.end}T23:59:59Z`;

  // First attempt: query with the full set of columns we expect at GA.
  let { data, error } = await supabase
    .from("accounts_expenses")
    .select("id, vendor, category, amount, currency, financial_document_id")
    .eq("org_id", orgId)
    .gte("created_at", startTimestamp)
    .lte("created_at", endTimestamp);

  // Backwards-compatibility: some environments may not yet have vendor/category
  // columns on accounts_expenses. If the error indicates a missing column,
  // fall back to a minimal select that only uses columns we know exist.
  if (
    error &&
    typeof error.message === "string" &&
    (error.message.includes("accounts_expenses.vendor") ||
      error.message.includes("accounts_expenses.category"))
  ) {
    const fallback = await supabase
      .from("accounts_expenses")
      .select("id, amount, currency, financial_document_id")
      .eq("org_id", orgId)
      .gte("created_at", startTimestamp)
      .lte("created_at", endTimestamp);

    if (fallback.error) {
      throw new Error(
        `Failed to fetch accounts_expenses (fallback): ${fallback.error.message}`,
      );
    }

    if (!fallback.data) {
      return [];
    }

    // Map to AccountsExpenseRow with null vendor/category so aggregation
    // logic can still run with sensible defaults.
    return (fallback.data as Array<{
      id: string;
      amount: number;
      currency: string | null;
      financial_document_id: string;
    }>).map((row) => ({
      id: row.id,
      expense_date: null,
      vendor: null,
      category: null,
      amount: row.amount,
      currency: row.currency,
      financial_document_id: row.financial_document_id,
    }));
  }

  if (error) {
    throw new Error(`Failed to fetch accounts_expenses: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data as AccountsExpenseRow[];
}

async function fetchSourcesForExpenses(
  supabase: SupabaseLikeClient,
  expenses: AccountsExpenseRow[],
): Promise<SourceConnectorInfo[]> {
  const ids = Array.from(
    new Set(expenses.map((row) => row.financial_document_id)),
  );

  if (ids.length === 0) {
    return [];
  }

  const query = supabase
    .from("financial_documents")
    .select("id, source_connector")
    .in("id", ids);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch financial_documents: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  const rows = data as FinancialDocumentSourceRow[];
  return rows.map((row) => ({
    financialDocumentId: row.id,
    sourceConnector: row.source_connector,
  }));
}

async function fetchDocumentsForOrg(
  supabase: SupabaseLikeClient,
  orgId: string,
): Promise<DocumentRow[]> {
  // First attempt: filter by org_id for environments where documents is still
  // org-scoped. This is the desired GA shape.
  let { data, error } = await supabase
    .from("documents")
    .select("id")
    .eq("org_id", orgId);

  // Backwards-compatibility: some environments may not have org_id on documents
  // (e.g. workspace-based schemas). If the error indicates a missing column,
  // fall back to an unfiltered select and let the caller treat the results as
  // "all visible documents".
  if (
    error &&
    typeof error.message === "string" &&
    error.message.includes("documents.org_id")
  ) {
    const fallback = await supabase.from("documents").select("id");

    if (fallback.error) {
      throw new Error(
        `Failed to fetch document rows (fallback): ${fallback.error.message}`,
      );
    }

    if (!fallback.data) {
      return [];
    }

    return (fallback.data as Array<{ id: string }>).map((row) => ({
      id: row.id,
      kind: null,
    }));
  }

  if (error) {
    throw new Error(`Failed to fetch document rows: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return (data as Array<{ id: string }>).map((row) => ({
    id: row.id,
    kind: null,
  }));
}

export async function getSaaSExpensesPackForOrg(
  supabase: SupabaseLikeClient,
  params: { orgId: string; period?: AccountsDateRange },
): Promise<SaaSExpensesPack> {
  const period = normalizePeriod(params.period);
  const previousPeriod = getPreviousPeriod(period);

  const [currentExpenses, previousExpenses] = await Promise.all([
    fetchAccountsExpensesForPeriod(supabase, params.orgId, period),
    fetchAccountsExpensesForPeriod(supabase, params.orgId, previousPeriod),
  ]);

  const sources = await fetchSourcesForExpenses(supabase, currentExpenses);

  const comparisonTotal = sumAmount(previousExpenses);

  return buildSaaSExpensesPackFromRows({
    orgId: params.orgId,
    period,
    now: new Date(),
    expenses: currentExpenses,
    sources,
    comparison: {
      period: previousPeriod,
      totalAmount: comparisonTotal,
    },
  });
}

export async function getInvestorAccountsSnapshotPackForOrg(
  supabase: SupabaseLikeClient,
  params: { orgId: string; today?: Date },
): Promise<InvestorAccountsSnapshotPack> {
  const today = params.today ?? new Date();

  const end = toIsoDateString(today);
  const startDate = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
  const start = toIsoDateString(startDate);

  const period: AccountsDateRange = { start, end };

  const [expenses, documents] = await Promise.all([
    fetchAccountsExpensesForPeriod(supabase, params.orgId, period),
    fetchDocumentsForOrg(supabase, params.orgId),
  ]);

  return buildInvestorAccountsSnapshotPackFromRows({
    orgId: params.orgId,
    period,
    now: today,
    expenses,
    documents,
  });
}

