"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { MaestroQuickStart } from "@/components/dashboard/MaestroQuickStart";
import { Widget } from "@/components/ui/widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tokens } from "@/lib/ui/tokens";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import {
  AlertCircle,
  ArrowRight,
  FileSignature,
  FileText,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const summaryCards = [
  {
    title: 'Docs in Motion',
    value: '12',
    change: '+3 today',
    icon: FileText,
    color: 'text-blue-600',
  },
  {
    title: 'Pending Signatures',
    value: '5',
    change: '2 urgent',
    icon: FileSignature,
    color: 'text-orange-600',
  },
  {
    title: 'Recent Imports',
    value: '18',
    change: 'Last 24h',
    icon: TrendingUp,
    color: 'text-green-600',
  },
  {
    title: 'Action Required',
    value: '7',
    change: 'Needs review',
    icon: AlertCircle,
    color: 'text-red-600',
  },
];

const activeDeals = [
  {
    name: 'Acme Corp Partnership Agreement',
    status: 'In Review',
    owner: 'Sarah Chen',
    updated: '2 hours ago',
    progress: 75,
  },
  {
    name: 'Q4 Sales Proposal - TechStart Inc',
    status: 'Awaiting Signature',
    owner: 'Mike Johnson',
    updated: '4 hours ago',
    progress: 90,
  },
  {
    name: 'Vendor NDA - CloudSystems',
    status: 'Draft',
    owner: 'You',
    updated: '1 day ago',
    progress: 40,
  },
];

const aiInsights = [
  {
    title: 'Expiring NDAs',
    description: '3 NDAs expire in the next 30 days. Review and renew if needed.',
    action: 'Review Now',
    priority: 'medium',
  },
  {
    title: 'Stale Proposals',
    description: '5 proposals haven\'t been updated in 2 weeks. Follow up with owners.',
    action: 'View All',
    priority: 'low',
  },
  {
    title: 'Missing Signatures',
    description: 'Acme Corp agreement has been pending signature for 5 days.',
    action: 'Send Reminder',
    priority: 'high',
  },
];

type OnboardingStatus = {
  hasConnectedGoogleDrive: boolean;
  hasDraftedContract: boolean;
  hasDraftedDeck: boolean;
  hasVaultDoc: boolean;
  hasRunAccountsPack: boolean;
};

export default function DashboardPage() {
  const sb = useMemo(() => getBrowserSupabaseClient(), []);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);

  useEffect(() => {
    let cancelled = false;
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
      } finally {
        if (!cancelled) {
          setLoadingOnboarding(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: tokens.spacing[8], maxWidth: tokens.layout.pageMaxWidth, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[6] }}>
        <PageHeader
          title="Dashboard"
          subtitle="Your document activity and insights at a glance"
        />

        {onboardingStatus && (
          <DashboardHero progressState={onboardingStatus} />
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Widget key={card.title}>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">{card.title}</div>
                  <Icon className={card.color} style={{ width: tokens.iconSize.sm, height: tokens.iconSize.sm }} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
                </div>
              </Widget>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {onboardingStatus && (
            <MaestroQuickStart progressState={onboardingStatus} />
          )}

          <Widget
            title="Active Deals & Workflows"
            description="Documents currently in progress"
          >
            <div className="space-y-4">
              {activeDeals.map((deal) => (
                <div key={deal.name} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-medium leading-none truncate" style={{ fontSize: tokens.fontSize.sm }}>{deal.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {deal.status}
                        </Badge>
                        <span>•</span>
                        <span className="truncate">{deal.owner}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {deal.updated}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${deal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Widget>

          <Widget
            title="AI Insights"
            description="Recommendations from Maestro"
            headerActions={
              <Sparkles className="text-mono" style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }} />
            }
          >
            <div className="space-y-4">
              {aiInsights.map((insight) => (
                <div key={insight.title} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${insight.priority === 'high'
                        ? 'bg-red-500'
                        : insight.priority === 'medium'
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                        }`}
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="font-medium leading-none" style={{ fontSize: tokens.fontSize.sm }}>{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    {insight.action}
                    <ArrowRight className="ml-2" style={{ width: tokens.iconSize.xs, height: tokens.iconSize.xs }} />
                  </Button>
                </div>
              ))}
            </div>
          </Widget>
        </div>

        <Widget
          title="Recently Edited"
          description="Documents you've worked on recently"
        >
          <div className="space-y-3">
            {[
              {
                name: 'Employment Agreement - Jane Doe',
                type: 'Contract',
                time: '30 minutes ago',
              },
              {
                name: 'Q1 Financial Report',
                type: 'Report',
                time: '2 hours ago',
              },
              {
                name: 'Product Roadmap Deck',
                type: 'Presentation',
                time: '1 day ago',
              },
            ].map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-muted-foreground" style={{ width: tokens.iconSize.md, height: tokens.iconSize.md }} />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{doc.time}</span>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </div>
  );
}
