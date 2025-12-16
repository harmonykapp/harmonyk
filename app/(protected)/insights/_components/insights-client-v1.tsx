"use client";

// Week 11 Day 4: Insights v1 client component
//
// Renders metric tiles and daily trends table.

import { Button } from "@/components/ui/button";
import type { InsightsData } from "@/lib/activity-insights";
import type { InsightsCard, InsightsRange } from "@/lib/insights/cards";
import { phCapture } from "@/lib/posthog-client";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  data?: InsightsData;
  error?: string | null;
}

export default function InsightsClientV1({ data, error }: Props) {
  const hasTrackedPageView = useRef(false);
  const [range, setRange] = useState<InsightsRange>("30d");
  const [cards, setCards] = useState<InsightsCard[] | null>(null);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const cardsCacheRef = useRef<
    Map<string, { cards: InsightsCard[]; fetchedAt: number }>
  >(new Map());
  const rangeChangeTimeoutRef = useRef<number | null>(null);

  // Track page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current && data) {
      phCapture("insights_page_view", {
        hasMetrics: Boolean(data.metrics),
        docsCreated: data.metrics?.docsCreated7d ?? 0,
        monoQuestions: data.metrics?.monoQuestions7d ?? 0,
        connectorSyncs: data.metrics?.connectorSyncs7d ?? 0,
      });
      phCapture("insights_viewed", {
        range,
        hasCards: Boolean(cards && cards.length > 0),
      });
      hasTrackedPageView.current = true;
    }
  }, [cards, data, range]);

  const fetchCards = useCallback(
    async (requestedRange: InsightsRange) => {
      const cache = cardsCacheRef.current.get(requestedRange);
      const now = Date.now();
      const cacheTtlMs = 60_000;

      if (cache && now - cache.fetchedAt < cacheTtlMs) {
        setCards(cache.cards);
        setCardsError(null);
        return;
      }

      setIsLoadingCards(true);
      setCardsError(null);

      try {
        const response = await fetch(
          `/api/insights/cards?range=${encodeURIComponent(requestedRange)}`,
          {
            credentials: "include",
          },
        );
        const status = response.status;

        // If the environment can't authenticate this endpoint (e.g. local dev
        // quirks), degrade gracefully and hide cards rather than shouting.
        if (status === 401) {
          // eslint-disable-next-line no-console
          console.warn(
            "[InsightsClientV1] /api/insights/cards returned 401; hiding cards section",
          );
          setCards(null);
          setCardsError(null);
          return;
        }

        const json = (await response.json()) as {
          ok: boolean;
          cards?: InsightsCard[];
          error?: string;
        };

        if (!json.ok || !json.cards) {
          setCards(null);
          setCardsError("Failed to load insight cards for this range.");
          return;
        }

        cardsCacheRef.current.set(requestedRange, {
          cards: json.cards,
          fetchedAt: now,
        });
        setCards(json.cards);
        setCardsError(null);
      } catch (fetchError) {
        // eslint-disable-next-line no-console
        console.error("[InsightsClientV1] failed to fetch cards", fetchError);
        setCardsError("Failed to load insight cards.");
      } finally {
        setIsLoadingCards(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Initial load for the default range.
    void fetchCards("30d");
  }, [fetchCards]);

  useEffect(() => {
    return () => {
      if (rangeChangeTimeoutRef.current !== null) {
        window.clearTimeout(rangeChangeTimeoutRef.current);
      }
    };
  }, []);
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        <p className="font-medium">Error loading insights</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
        Loading insights...
      </div>
    );
  }

  const { metrics, dailyCounts, accounts, contracts, decks } = data;
  const hasAnyActivity =
    metrics.docsCreated7d > 0 ||
    metrics.monoQuestions7d > 0 ||
    metrics.connectorSyncs7d > 0 ||
    metrics.signaturesCompleted7d > 0 ||
    metrics.activeDocs7d > 0;

  if (!hasAnyActivity) {
    return (
      <div className="rounded-lg border border-border/60 bg-background/60 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Not enough activity yet – plug in a connector or create a doc.
        </p>
      </div>
    );
  }

  // Format provider breakdown for connector syncs
  const providerBreakdown = Object.entries(metrics.connectorSyncsByProvider)
    .map(([provider, count]) => {
      const label = provider === "google_drive" ? "Drive" : provider === "gmail" ? "Gmail" : provider;
      return `${label}: ${count}`;
    })
    .join(", ");

  return (
    <div className="flex flex-col gap-6">
      {/* Highlights + Range Selector (card grid) */}
      <div className="rounded-lg border border-border/60 bg-background/60">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Highlights
            </div>
            <div className="text-xs text-muted-foreground">
              High-signal cards showing how Harmonyk is moving your accounts,
              contracts, and decks.
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Range</span>
            <select
              className="h-7 rounded-md border border-border bg-background px-2 text-xs"
              value={range}
              onChange={(event) => {
                const nextRange = event.target.value as InsightsRange;
                if (nextRange === range) {
                  return;
                }

                phCapture("insights_range_changed", {
                  from: range,
                  to: nextRange,
                });

                setRange(nextRange);

                if (rangeChangeTimeoutRef.current !== null) {
                  window.clearTimeout(rangeChangeTimeoutRef.current);
                }

                rangeChangeTimeoutRef.current = window.setTimeout(() => {
                  void fetchCards(nextRange);
                }, 250);
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
        <div className="p-4">
          {cardsError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {cardsError}
            </div>
          )}
          {!cards && isLoadingCards && !cardsError && (
            <div className="text-[11px] text-muted-foreground">
              Loading insight cards…
            </div>
          )}
          {cards && cards.length === 0 && !cardsError && !isLoadingCards && (
            <div className="text-[11px] text-muted-foreground">
              No high-signal cards yet – run an Accounts pack or move a
              contract or deck through the pipeline.
            </div>
          )}
          {cards && cards.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className="flex flex-col rounded-md border border-border/60 bg-background/80 p-3 text-left text-xs hover:bg-background/90"
                  onClick={() => {
                    phCapture("insights_card_clicked", {
                      card_id: card.id,
                      kind: card.kind,
                    });
                    if (card.cta?.href) {
                      window.location.href = card.cta.href;
                    }
                  }}
                >
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {card.title}
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {card.value ?? 0}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {card.period}
                  </div>
                  {card.cta && (
                    <div className="mt-1 text-[10px] text-primary">
                      {card.cta.label}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Docs Created */}
        <div
          className="rounded-lg border border-border/60 bg-background/60 p-4 cursor-pointer hover:bg-background/80 transition flex flex-col min-h-[100px]"
          onClick={() => {
            phCapture("insights_tile_clicked", { tile: "docs_created", value: metrics.docsCreated7d });
            window.location.href = "/activity?groups=docs";
          }}
        >
          <div className="text-2xl font-semibold">{metrics.docsCreated7d}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Docs created (7d)
          </div>
          {metrics.docsCreated7d === 0 && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              Generate and send a contract to see signed vs draft ratios.
            </div>
          )}
        </div>

        {/* Mono Questions */}
        <div
          className="rounded-lg border border-border/60 bg-background/60 p-4 cursor-pointer hover:bg-background/80 transition flex flex-col min-h-[100px]"
          onClick={() => {
            phCapture("insights_tile_clicked", { tile: "mono_questions", value: metrics.monoQuestions7d });
            window.location.href = "/activity?groups=mono";
          }}
        >
          <div className="text-2xl font-semibold">{metrics.monoQuestions7d}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Mono questions (7d)
          </div>
        </div>

        {/* Connector Syncs */}
        <div
          className="rounded-lg border border-border/60 bg-background/60 p-4 cursor-pointer hover:bg-background/80 transition flex flex-col min-h-[100px]"
          onClick={() => {
            phCapture("insights_tile_clicked", { tile: "connector_syncs", value: metrics.connectorSyncs7d });
            window.location.href = "/activity?groups=connectors";
          }}
        >
          <div className="text-2xl font-semibold">{metrics.connectorSyncs7d}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Connector syncs (7d)
          </div>
          {providerBreakdown && (
            <div className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
              {providerBreakdown}
            </div>
          )}
        </div>

        {/* Signatures Completed */}
        <div
          className="rounded-lg border border-border/60 bg-background/60 p-4 cursor-pointer hover:bg-background/80 transition flex flex-col min-h-[100px]"
          onClick={() => {
            phCapture("insights_tile_clicked", { tile: "signatures_completed", value: metrics.signaturesCompleted7d });
            window.location.href = "/activity?groups=signatures";
          }}
        >
          <div className="text-2xl font-semibold">{metrics.signaturesCompleted7d}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Signatures completed (7d)
          </div>
          {metrics.signaturesCompleted7d === 0 && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              Generate and send a contract to see signed vs draft ratios.
            </div>
          )}
        </div>

        {/* Active Docs (optional) */}
        {metrics.activeDocs7d > 0 && (
          <div
            className="rounded-lg border border-border/60 bg-background/60 p-4 sm:col-span-2 lg:col-span-1 cursor-pointer hover:bg-background/80 transition flex flex-col min-h-[100px]"
            onClick={() => {
              phCapture("insights_tile_clicked", { tile: "active_docs", value: metrics.activeDocs7d });
              window.location.href = "/activity?groups=docs";
            }}
          >
            <div className="text-2xl font-semibold">{metrics.activeDocs7d}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Active docs (7d)
            </div>
          </div>
        )}
      </div>

      {/* Decks Insights Row */}
      {decks && (
        <div className="rounded-lg border border-border/60 bg-background/60">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Decks
              </div>
              <div className="text-xs text-muted-foreground">
                Decks generated, saved, and exported over the last 30 days.
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                phCapture("insights_decks_cta_clicked", {});
                window.location.href = "/builder?tab=decks";
              }}
            >
              Open Decks Builder
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            {/* KPI tiles */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border/60 bg-background/80 p-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Generated
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {decks.generated_30d}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Last 30 days
                </div>
                {decks.generated_30d === 0 && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Create a deck and share it to see engagement metrics.
                  </div>
                )}
              </div>
              <div className="rounded-md border border-border/60 bg-background/80 p-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Saved to Vault
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {decks.saved_to_vault_30d}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Last 30 days
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-background/80 p-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Exported
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {decks.exported_30d}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Last 30 days
                </div>
              </div>
            </div>

            {/* Recent decks table */}
            <div className="rounded-md border border-border/60 bg-background/80">
              <div className="border-b px-3 py-2 text-[11px] font-medium text-muted-foreground">
                Recent decks
              </div>
              {decks.recent_decks.length === 0 ? (
                <div className="px-3 py-3 text-[11px] text-muted-foreground">
                  No decks found yet – generate one from the Decks Builder.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto">
                  <table className="min-w-full text-[11px]">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                          Title
                        </th>
                        <th className="px-3 py-2 text-left font-medium whitespace-nowrap">
                          Updated
                        </th>
                        <th className="px-3 py-2 text-right font-medium whitespace-nowrap">
                          Open
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {decks.recent_decks.map((deck) => (
                        <tr
                          key={deck.id}
                          className="border-t hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            {deck.title}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {deck.updatedAt
                              ? deck.updatedAt.slice(0, 10)
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              className="text-[11px] text-primary underline-offset-2 hover:underline"
                              onClick={() => {
                                phCapture("insights_deck_open_clicked", {
                                  deckId: deck.id,
                                });
                                window.location.href = `/vault?docId=${encodeURIComponent(
                                  deck.id,
                                )}`;
                              }}
                            >
                              Open in Vault
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contracts Insights Row */}
      {contracts && (
        <div className="rounded-lg border border-border/60 bg-background/60">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contracts
              </div>
              <div className="text-xs text-muted-foreground">
                Drafts, sends, and signed contracts over the last 30 days.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
            {/* Drafts created (30d) */}
            <div className="rounded-md border border-border/60 bg-background/80 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Drafts created
              </div>
              <div className="mt-1 text-lg font-semibold">
                {contracts.drafts_30d}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Last 30 days
              </div>
              {contracts.drafts_30d === 0 && (
                <div className="mt-1 text-[10px] text-muted-foreground">
                  Generate and send a contract to see signed vs draft ratios.
                </div>
              )}
            </div>

            {/* Sent for signature (30d) */}
            <div className="rounded-md border border-border/60 bg-background/80 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Sent for signature
              </div>
              <div className="mt-1 text-lg font-semibold">
                {contracts.sent_for_signature_30d}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Last 30 days
              </div>
            </div>

            {/* Signed (30d) */}
            <div className="rounded-md border border-border/60 bg-background/80 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Signed
              </div>
              <div className="mt-1 text-lg font-semibold">
                {contracts.signed_30d}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Last 30 days
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Insights Row */}
      {accounts && (
        <div className="rounded-lg border border-border/60 bg-background/60">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Accounts
              </div>
              <div className="text-xs text-muted-foreground">
                Signals from Monthly SaaS and Investor Snapshot packs.
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                phCapture("insights_accounts_cta_clicked", {});
                window.location.href = "/builder?tab=accounts";
              }}
            >
              Open Accounts
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            {/* Monthly SaaS card */}
            <div className="rounded-md border border-border/60 bg-background/80 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Monthly SaaS
              </div>
              {accounts.monthly_saas.last_run_at ? (
                <>
                  <div className="mt-1 text-lg font-semibold">
                    {accounts.monthly_saas.total ?? 0}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Top vendors:{" "}
                    {accounts.monthly_saas.top_vendors_count ?? 0}
                    {" · "}
                    Last run{" "}
                    {accounts.monthly_saas.last_run_at.slice(0, 10)}
                  </div>
                </>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground">
                  Run an Accounts pack to see burn and runway.
                </div>
              )}
            </div>

            {/* Investor Snapshot card */}
            <div className="rounded-md border border-border/60 bg-background/80 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Investor Snapshot
              </div>
              {accounts.investor_snapshot.last_run_at ? (
                <>
                  <div className="mt-1 text-lg font-semibold">
                    {accounts.investor_snapshot.runway_months ?? 0}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      months runway
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Burn: {accounts.investor_snapshot.burn ?? 0}
                    {" · "}
                    Last run{" "}
                    {accounts.investor_snapshot.last_run_at.slice(0, 10)}
                  </div>
                </>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground">
                  Run an Accounts pack to see burn and runway.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Trends Table */}
      <div className="rounded-lg border border-border/60 bg-background/60">
        <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">
          Recent trends (last 7 days)
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Day</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Docs</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Mono</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Syncs</th>
                <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Signatures</th>
              </tr>
            </thead>
            <tbody>
              {dailyCounts.map((day) => (
                <tr key={day.day} className="border-t hover:bg-muted/50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap">{day.dayFormatted}</td>
                  <td className="px-3 py-2 text-right">{day.docsCreated}</td>
                  <td className="px-3 py-2 text-right">{day.monoQuestions}</td>
                  <td className="px-3 py-2 text-right">{day.connectorSyncs}</td>
                  <td className="px-3 py-2 text-right">{day.signaturesCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

