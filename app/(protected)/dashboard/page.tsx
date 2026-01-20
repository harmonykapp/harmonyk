"use client";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import {
  FunnelCard,
  KpiCard,
  LinkLeaderboardCard,
  RankedListCard,
  SparklineCard,
  WidgetCard,
  WidgetRow,
} from "@/components/widgets";
import {
  mockActivityTrend,
  mockAtRiskItems,
  mockDashboardPriorities,
  mockDealFunnelStages,
  mockLinkLeaderboard,
  mockSignatureLoad,
} from "@/lib/mock/widgets";
import { getUserProgressNarration, type UserProgressSignals } from "@/lib/user-progress";
import { track } from "@/lib/telemetry/events";
import Link from "next/link";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";

type OnboardingStatus = {
  hasConnectedGoogleDrive: boolean;
  hasDraftedContract: boolean;
  hasDraftedDeck: boolean;
  hasVaultDoc: boolean;
  hasRunAccountsPack: boolean;
};

export default function DashboardPage() {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    track("ui.sidebar.toggle", { boot: true });
    (async () => {
      try {
        const response = await fetch("/api/onboarding/status", {
          cache: "no-store",
        });
        if (cancelled) return;
        if (response.ok) {
          const data = (await response.json()) as { ok: boolean } & OnboardingStatus;
          if (data.ok) {
            setOnboardingStatus({
              hasConnectedGoogleDrive: data.hasConnectedGoogleDrive,
              hasDraftedContract: data.hasDraftedContract,
              hasDraftedDeck: data.hasDraftedDeck,
              hasVaultDoc: data.hasVaultDoc,
              hasRunAccountsPack: data.hasRunAccountsPack,
            });
          }
        }
      } catch (err) {
        console.warn("[dashboard] Failed to load onboarding status", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const progressSignals: UserProgressSignals = useMemo(() => {
    // Safe defaults: keep the dashboard non-blank even if onboarding status fails to load.
    // We'll deepen these signals later (tasks, playbooks, metadata) once we wire real analytics.
    const hasConnectedAnyConnector = onboardingStatus?.hasConnectedGoogleDrive ?? false;
    const hasAnyDocsInVault = onboardingStatus?.hasVaultDoc ?? false;
    const hasCreatedAnyDealOrWorkflow =
      (onboardingStatus?.hasDraftedContract ?? false) ||
      (onboardingStatus?.hasDraftedDeck ?? false) ||
      (onboardingStatus?.hasRunAccountsPack ?? false);

    return {
      hasConnectedAnyConnector,
      hasImportedAnyDocs: hasAnyDocsInVault,
      hasAnyDocsInVault,
      hasCompletedMetadataBasics: false,
      hasCreatedAnyDealOrWorkflow,
      hasRunAnyPlaybook: false,
      hasAnyTasks: false,
    };
  }, [onboardingStatus]);

  const narration = useMemo(() => getUserProgressNarration(progressSignals), [progressSignals]);

  // Dashboard rule: no scrollbars inside widgets. Show fewer rows instead.
  const prioritiesToShow = mockDashboardPriorities.slice(0, 3);
  const atRiskToShow = mockAtRiskItems.slice(0, 3);
  const topLinksToShow = mockLinkLeaderboard.slice(0, 3);
  const showQuickStart = !(onboardingStatus?.hasConnectedGoogleDrive ?? false);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4">
        {/* Slim banner at top */}
        <div className="col-span-12">
          <DashboardHero narration={narration} progressState={onboardingStatus ?? undefined} />
        </div>

        {/* Maestro Next Steps (compact): 3 recommended next actions */}
        {showQuickStart ? (
          <WidgetCard
            title="Next Steps recommended by Maestro"
            subtitle="3 quick wins to unlock the dashboard"
            density="compact"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/integrations"
                className="rounded-2xl border border-border/60 bg-background px-4 py-3 hover:bg-muted transition-colors"
              >
                <div className="text-sm font-semibold">Connect Google Drive</div>
                <div className="mt-1 text-xs text-muted-foreground">Import docs into Vault</div>
              </Link>
              <Link
                href="/integrations"
                className="rounded-2xl border border-border/60 bg-background px-4 py-3 hover:bg-muted transition-colors"
              >
                <div className="text-sm font-semibold">Connect Gmail</div>
                <div className="mt-1 text-xs text-muted-foreground">Find docs in email threads</div>
              </Link>
              <Link
                href="/share"
                className="rounded-2xl border border-border/60 bg-background px-4 py-3 hover:bg-muted transition-colors"
              >
                <div className="text-sm font-semibold">Create a share link</div>
                <div className="mt-1 text-xs text-muted-foreground">Track views + follow-ups</div>
              </Link>
            </div>
          </WidgetCard>
        ) : null}

        {/* Row 1: 3 widgets (standard) */}
        <WidgetRow
          title="Today's Focus"
          subtitle="Priorities, at-risk deals, and signatures"
          storageKey="row:dashboard:focus"
          className="mt-8"
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:h-[280px]">
              <WidgetCard title="Today's Priorities" subtitle="Do next" density="compact" className="h-full">
                {prioritiesToShow.length === 0 ? (
                  <div className="px-2 pb-3">
                    <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-4">
                      <div className="text-sm font-medium">No priorities yet</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Once you start working in Workbench, Maestro will surface next actions here.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prioritiesToShow.map((item) => {
                      const Row: React.ElementType = item.href ? Link : "div";
                      const rowProps = item.href ? { href: item.href } : {};
                      return (
                        <Row
                          key={item.id}
                          {...rowProps}
                          className={[
                            "block rounded-xl px-3 py-2 hover:bg-muted transition-colors",
                            item.href ? "cursor-pointer" : "",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="truncate text-sm font-medium">{item.title}</div>
                                {item.tag ? (
                                  <div className="shrink-0 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {item.tag}
                                  </div>
                                ) : null}
                              </div>
                              {item.subtitle ? (
                                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                                  {item.subtitle}
                                </div>
                              ) : null}
                            </div>
                            {item.valueLabel ? (
                              <div className="shrink-0 text-xs text-muted-foreground">
                                {item.valueLabel}
                              </div>
                            ) : null}
                          </div>
                          {typeof item.valuePct === "number" ? (
                            <div className="mt-2">
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-indigo-500/25 dark:bg-indigo-400/20"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, item.valuePct))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : null}
                        </Row>
                      );
                    })}
                  </div>
                )}
              </WidgetCard>
            </div>
            <div className="lg:col-span-4 lg:h-[280px]">
              <RankedListCard
                title="At-Risk Deals"
                items={atRiskToShow}
                emptyTitle="No at-risk deals"
                emptyDescription="All deals are on track."
                className="h-full"
              />
            </div>

            <div className="lg:col-span-4 lg:h-[280px]">
              <WidgetCard
                title="Signature Load"
                subtitle="What needs signing next"
                density="compact"
                className="h-full"
              >
                {/* Keep everything visible inside the fixed 1/3 widget height */}
                <div className="flex h-full min-h-0 flex-col gap-2">
                  <Link href="/share/signatures" className="block">
                    <KpiCard
                      label="Waiting on me"
                      value={mockSignatureLoad.waitingOnMe}
                      helper="Review"
                      tone="purple"
                      className="cursor-pointer hover:bg-muted py-2"
                    />
                  </Link>
                  <Link href="/share/signatures" className="block">
                    <KpiCard
                      label="Waiting on others"
                      value={mockSignatureLoad.waitingOnOthers}
                      helper="Nudge"
                      tone="purple"
                      className="cursor-pointer hover:bg-muted py-2"
                    />
                  </Link>

                  {/* Compact bottom section (no clipping) */}
                  <div className="mt-auto pt-1">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Waiting on me</span>
                      <span>
                        {mockSignatureLoad.waitingOnMe + mockSignatureLoad.waitingOnOthers}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-purple-600/70 dark:bg-purple-400/70"
                        style={{
                          width: `${Math.round(
                            (mockSignatureLoad.waitingOnMe /
                              Math.max(
                                1,
                                mockSignatureLoad.waitingOnMe + mockSignatureLoad.waitingOnOthers,
                              )) *
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </WidgetCard>
            </div>
          </div>
        </WidgetRow>

        {/* Row 2: 3 widgets (standard) */}
        <WidgetRow
          title="Analytics"
          subtitle="Funnel, activity trend, and top links"
          storageKey="row:dashboard:analytics"
          className="mt-10"
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:h-[280px]">
              <FunnelCard
                title="Deal Funnel"
                subtitle="Documents by stage"
                stages={mockDealFunnelStages}
                onClick={() => console.log("Funnel clicked")}
                tone="blue"
                className="h-full"
              />
            </div>

            <div className="lg:col-span-4 lg:h-[280px]">
              <SparklineCard
                title="Activity Trend"
                subtitle="Last 12 days"
                points={mockActivityTrend}
                onClick={() => console.log("Activity trend clicked")}
                tone="emerald"
                className="h-full"
              />
            </div>

            <div className="lg:col-span-4 lg:h-[280px]">
              <LinkLeaderboardCard
                title="Top Share Links"
                subtitle="Views + last activity"
                rows={topLinksToShow}
                href="/share"
                className="h-full"
              />
            </div>
          </div>
        </WidgetRow>
      </div>
    </div>
  );
}
