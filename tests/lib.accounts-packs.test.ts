import { describe, expect, it } from "vitest";
import {
  type AccountsDateRange,
  buildInvestorAccountsSnapshotPackFromRows,
  buildSaaSExpensesPackFromRows,
} from "@/lib/accounts/packs";

describe("Accounts Packs aggregation", () => {
  const period: AccountsDateRange = {
    start: "2025-11-01",
    end: "2025-11-30",
  };

  it("buildSaaSExpensesPackFromRows computes totals, vendors and deltas", () => {
    const now = new Date("2025-12-01T00:00:00Z");

    const expenses = [
      {
        id: "e1",
        expense_date: "2025-11-05",
        vendor: "Figma",
        category: "saas_tools",
        amount: 50,
        currency: "USD",
        financial_document_id: "fd1",
      },
      {
        id: "e2",
        expense_date: "2025-11-15",
        vendor: "Figma",
        category: "saas_tools",
        amount: 50,
        currency: "USD",
        financial_document_id: "fd2",
      },
      {
        id: "e3",
        expense_date: "2025-11-20",
        vendor: "OpenAI",
        category: "saas_ai",
        amount: 100,
        currency: "USD",
        financial_document_id: "fd3",
      },
    ];

    const sources = [
      { financialDocumentId: "fd1", sourceConnector: "gmail" },
      { financialDocumentId: "fd2", sourceConnector: "drive" },
      { financialDocumentId: "fd3", sourceConnector: "gmail" },
    ];

    const comparison = {
      period: {
        start: "2025-10-01",
        end: "2025-10-31",
      },
      totalAmount: 100,
    };

    const pack = buildSaaSExpensesPackFromRows({
      orgId: "org-1",
      period,
      now,
      expenses,
      sources,
      comparison,
    });

    expect(pack.type).toBe("saas_monthly_expenses");
    expect(pack.orgId).toBe("org-1");

    expect(pack.headline.totalAmount).toBe(200);
    expect(pack.headline.vendorCount).toBe(2);
    expect(pack.headline.categoryCount).toBe(2);
    expect(pack.headline.averagePerVendor).toBe(100);

    expect(pack.headline.deltaAmount).toBe(100);
    expect(pack.headline.deltaPercent).toBeCloseTo(100);

    expect(pack.vendors).toHaveLength(2);

    const figma = pack.vendors.find((v) => v.vendorName === "Figma");
    const openai = pack.vendors.find((v) => v.vendorName === "OpenAI");

    expect(figma).toBeDefined();
    expect(figma?.monthlyAmount).toBe(100);
    expect(figma?.documentCount).toBe(2);
    expect(figma?.sourceCount.gmail).toBe(1);
    expect(figma?.sourceCount.drive).toBe(1);

    expect(openai).toBeDefined();
    expect(openai?.monthlyAmount).toBe(100);
    expect(openai?.documentCount).toBe(1);
    expect(openai?.sourceCount.gmail).toBe(1);
  });

  it("buildInvestorAccountsSnapshotPackFromRows computes snapshot metrics and doc counts", () => {
    const now = new Date("2025-12-01T00:00:00Z");

    const expenses = [
      {
        id: "e1",
        expense_date: "2025-11-05",
        vendor: "Figma",
        category: "saas_tools",
        amount: 90,
        currency: "USD",
        financial_document_id: "fd1",
      },
      {
        id: "e2",
        expense_date: "2025-10-15",
        vendor: "OpenAI",
        category: "saas_ai",
        amount: 120,
        currency: "USD",
        financial_document_id: "fd2",
      },
      {
        id: "e3",
        expense_date: "2025-09-20",
        vendor: "Notion",
        category: "saas_productivity",
        amount: 90,
        currency: "USD",
        financial_document_id: "fd3",
      },
    ];

    const documents = [
      { id: "d1", kind: "contract" },
      { id: "d2", kind: "contract" },
      { id: "d3", kind: "deck" },
      { id: "d4", kind: "statement" },
      { id: "d5", kind: "other" },
    ];

    const pack = buildInvestorAccountsSnapshotPackFromRows({
      orgId: "org-1",
      period,
      now,
      expenses,
      documents,
    });

    expect(pack.type).toBe("investor_accounts_snapshot");
    expect(pack.orgId).toBe("org-1");

    expect(pack.headline.monthlySaaSBurn).toBeCloseTo(100);
    expect(pack.headline.totalMonthlyBurn).toBeCloseTo(100);

    expect(pack.headline.contractsInVault).toBe(2);
    expect(pack.headline.decksInVault).toBe(1);
    expect(pack.headline.accountsDocsInVault).toBe(1);
    expect(pack.headline.totalDocsInVault).toBe(5);

    expect(pack.metricsTrail.length).toBeGreaterThanOrEqual(4);
  });
});

