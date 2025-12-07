import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AccountsDateRange,
  type SaaSExpensesPack,
  recordAccountsPackFailureRun,
  recordAccountsPackSuccessRun,
} from "@/lib/accounts/packs";
import type { SupabaseLikeClient } from "@/lib/activity-log";

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
}));

const supabaseMock: SupabaseLikeClient = {
  // The Accounts pack helpers only rely on `from().insert(...)`.
  from: mockFrom,
} as unknown as SupabaseLikeClient;

const examplePeriod: AccountsDateRange = {
  start: "2025-01-01",
  end: "2025-01-31",
};

const exampleSaaSPack: SaaSExpensesPack = {
  type: "saas_monthly_expenses",
  orgId: "org-123",
  generatedAt: "2025-01-15T00:00:00.000Z",
  headline: {
    totalAmount: 1234,
    currency: "USD",
    vendorCount: 3,
    categoryCount: 2,
    averagePerVendor: 411.3333333333,
    period: examplePeriod,
    comparisonPeriod: undefined,
    deltaAmount: undefined,
    deltaPercent: null,
  },
  vendors: [],
};

describe("accounts_pack_runs helpers", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockFrom.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    // Restore the default implementation after reset so that
    // supabase.from("accounts_pack_runs") always returns an
    // object with an insert function.
    mockFrom.mockImplementation(() => ({ insert: mockInsert }));
  });

  it("recordAccountsPackSuccessRun writes a success run row for SaaS pack", async () => {
    await recordAccountsPackSuccessRun({
      supabase: supabaseMock,
      orgId: "org-123",
      pack: exampleSaaSPack,
    });

    expect(mockFrom).toHaveBeenCalledWith("accounts_pack_runs");
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const [insertPayload] = mockInsert.mock.calls[0];
    const payload = insertPayload as {
      org_id: string;
      type: string;
      period_start: string;
      period_end: string;
      status: string;
      metrics: Record<string, unknown>;
    };

    expect(payload.org_id).toBe("org-123");
    expect(payload.type).toBe("saas_monthly_expenses");
    expect(payload.period_start).toBe(examplePeriod.start);
    expect(payload.period_end).toBe(examplePeriod.end);
    expect(payload.status).toBe("success");
    expect(payload.metrics.totalAmount).toBe(1234);
    expect(payload.metrics.currency).toBe("USD");
    expect(payload.metrics.vendorCount).toBe(3);
  });

  it("recordAccountsPackFailureRun writes a failure run row with error context", async () => {
    const error = new Error("boom");

    await recordAccountsPackFailureRun({
      supabase: supabaseMock,
      orgId: "org-456",
      type: "saas_monthly_expenses",
      error,
    });

    expect(mockFrom).toHaveBeenCalledWith("accounts_pack_runs");
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const [insertPayload] = mockInsert.mock.calls[0];
    const payload = insertPayload as {
      org_id: string;
      type: string;
      period_start: string | null;
      period_end: string | null;
      status: string;
      metrics: { error: { message: string; name: string } };
    };

    expect(payload.org_id).toBe("org-456");
    expect(payload.type).toBe("saas_monthly_expenses");
    expect(payload.period_start).toBeNull();
    expect(payload.period_end).toBeNull();
    expect(payload.status).toBe("failure");
    expect(payload.metrics.error.message).toBe("boom");
    expect(payload.metrics.error.name).toBe("Error");
  });
});

