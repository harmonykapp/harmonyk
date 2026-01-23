"use client";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CollapsibleHeaderButton } from "@/components/ui/collapsible-header-button";
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
import { ChevronDown } from "lucide-react";
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
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupHydrated, setSetupHydrated] = useState(false);
  const setupContentId = React.useId();

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

  useEffect(() => {
    setSetupHydrated(true);
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
  const prioritiesToShow = mockDashboardPriorities.slice(0, 2);
  const atRiskToShow = mockAtRiskItems.slice(0, 2);
  const topLinksToShow = mockLinkLeaderboard.slice(0, 3);
  const showQuickStart = !(onboardingStatus?.hasConnectedGoogleDrive ?? false);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold text-foreground">
            Your next best actions across docs, sharing, and signing.
          </p>
          <Button size="sm" disabled title="Use the Ask Maestro button in the top bar.">
            Ask Maestro
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/builder?tab=contracts">New Document</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/share/links">Create Share Link</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/signatures">Request Signature</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/workbench#insightsStrip">Open Review Queue</Link>
          </Button>
          <Button variant="outline" size="sm" disabled title="Use the Ask Maestro button in the top bar.">
            Ask Maestro
          </Button>
        </div>

        {/* Slim banner at top */}
        {showQuickStart ? (
          <section className="overflow-x-hidden">
            {!setupHydrated ? (
              <div>
                <div className="flex min-h-9 w-full items-start justify-between gap-3 rounded-md px-2 py-1.5">
                  <span className="flex min-w-0 items-start gap-2">
                    <span className="min-w-0">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-base font-semibold">Setup</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        Connect tools and unlock the dashboard
                      </span>
                    </span>
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/integrations">Connect connectors</Link>
                  </Button>
                </div>
                <div className="pt-4" />
              </div>
            ) : (
              <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
                <div className="flex items-start justify-between gap-3">
                  <CollapsibleHeaderButton
                    title="Setup"
                    subtitle="Connect tools and unlock the dashboard"
                    open={setupOpen}
                    controlsId={setupContentId}
                    buttonClassName="flex-1 w-auto"
                  />
                  {!setupOpen ? (
                    <Button asChild size="sm" variant="outline" className="mt-0.5 shrink-0">
                      <Link href="/integrations">Connect connectors</Link>
                    </Button>
                  ) : null}
                </div>

                {setupOpen ? (
                  <CollapsibleContent id={setupContentId} className="pt-4 overflow-x-hidden">
                    <div className="flex flex-col gap-5">
                      <div className="col-span-12">
                        <DashboardHero narration={narration} progressState={onboardingStatus ?? undefined} />
                      </div>
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
                            <div className="mt-1 text-xs text-muted-foreground">
                              Find docs in email threads
                            </div>
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
                    </div>
                  </CollapsibleContent>
                ) : null}
              </Collapsible>
            )}
          </section>
        ) : (
          <div className="col-span-12">
            <DashboardHero narration={narration} progressState={onboardingStatus ?? undefined} />
          </div>
        )}

        {/* Row 1: 3 widgets (standard) */}
        <WidgetRow
          title="Today's Focus"
          subtitle="Priorities, at-risk deals, and signatures"
          storageKey="row:dashboard:focus"
          defaultOpen={false}
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <WidgetCard
                title="Today's Priorities"
                subtitle="Do next"
                density="compact"
                className="min-h-[280px]"
              >
                {prioritiesToShow.length === 0 ? (
                  <div className="px-2 pb-3">
                    <EmptyState
                      title="No priorities yet"
                      description="Once you start working in Workbench, Maestro will surface next actions here."
                      className="items-start text-left bg-muted/40"
                    />
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
                                  className="h-2 rounded-full bg-primary/30 dark:bg-primary/20"
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
            <div className="lg:col-span-4">
              <RankedListCard
                title="At-Risk Deals"
                items={atRiskToShow}
                emptyTitle="No at-risk deals"
                emptyDescription="All deals are on track."
                className="min-h-[280px]"
              />
            </div>

            <div className="lg:col-span-4">
              <WidgetCard
                title="Signature Load"
                subtitle="What needs signing next"
                density="compact"
                className="min-h-[280px]"
                bodyClassName="py-2"
              >
                {/* Keep everything visible inside the fixed 1/3 widget height */}
                <div className="flex h-full min-h-0 flex-col gap-1.5">
                  <Link href="/share/signatures" className="block">
                    <KpiCard
                      label="Waiting on me"
                      value={mockSignatureLoad.waitingOnMe}
                      helper="Review"
                      tone="accent"
                      className="cursor-pointer hover:bg-muted py-1.5"
                    />
                  </Link>
                  <Link href="/share/signatures" className="block">
                    <KpiCard
                      label="Waiting on others"
                      value={mockSignatureLoad.waitingOnOthers}
                      helper="Nudge"
                      tone="accent"
                      className="cursor-pointer hover:bg-muted py-1.5"
                    />
                  </Link>

                  {/* Compact bottom section (no clipping) */}
                  <div className="mt-auto pt-0.5">
                    <div className="mb-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Waiting on me</span>
                      <span>
                        {mockSignatureLoad.waitingOnMe + mockSignatureLoad.waitingOnOthers}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary/70"
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
          defaultOpen={false}
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:h-[280px]">
              <FunnelCard
                title="Deal Funnel"
                subtitle="Documents by stage"
                stages={mockDealFunnelStages}
                onClick={() => console.log("Funnel clicked")}
                tone="accent"
                className="h-full"
              />
            </div>

            <div className="lg:col-span-4 lg:h-[280px]">
              <SparklineCard
                title="Activity Trend"
                subtitle="Last 12 days"
                points={mockActivityTrend}
                onClick={() => console.log("Activity trend clicked")}
                tone="accent"
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
