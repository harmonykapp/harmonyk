"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Clock,
  FileSignature,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { CheckCircle2 as CheckCircle } from "lucide-react";

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);

  useEffect(() => {
    // Load user ID
    let cancelled = false;
    (async () => {
      try {
        const { data } = await sb.auth.getUser();
        if (cancelled) return;
        if (data?.user) {
          setUserId(data.user.id);
        }
      } catch {
        // Ignore errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

  // Load onboarding status
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

  useEffect(() => {
    // Check if welcome card should be shown
    const baseKey = "monolyth_onboarding_seen_v1";
    let storageKey = baseKey;

    // Use per-user key if we have a user ID
    if (userId) {
      storageKey = `${baseKey}:${userId}`;
    }

    try {
      const seen = window.localStorage.getItem(storageKey);
      if (!seen) {
        setShowWelcome(true);
      } else {
        setShowWelcome(false);
      }
    } catch {
      // If localStorage fails, default to showing once
      setShowWelcome(true);
    }
  }, [userId]);

  const handleDismissWelcome = () => {
    const baseKey = "monolyth_onboarding_seen_v1";
    let storageKey = baseKey;

    // Use per-user key if we have a user ID
    if (userId) {
      storageKey = `${baseKey}:${userId}`;
    }

    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore localStorage failures
    }
    setShowWelcome(false);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your document activity and insights at a glance
        </p>
      </div>

      {showWelcome && (
        <div className="mb-4 rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Welcome to Harmonyk Beta</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s the golden path we&apos;d like you to test:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                <li>Go to <strong>Workbench</strong> and analyze a document.</li>
                <li>Use <strong>Builder</strong> to generate a Version 1 draft.</li>
                <li><strong>Save to Vault</strong> so it becomes a tracked asset.</li>
                <li>Open <strong>Activity</strong> to see what happened.</li>
                <li>Ask <strong>Mono</strong> questions about your docs.</li>
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Feedback focus for this Beta: clarity of the golden path, missing steps,
                and where you get stuck or confused.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDismissWelcome}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Getting Started Card */}
      {onboardingStatus && (
        (() => {
          const isOnboarded = onboardingStatus.hasDraftedContract && 
                              onboardingStatus.hasDraftedDeck && 
                              onboardingStatus.hasVaultDoc;
          if (isOnboarded) return null;
          
          return (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Getting started with Harmonyk</CardTitle>
                <CardDescription>
                  Complete these steps to get the most out of Harmonyk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {onboardingStatus.hasConnectedGoogleDrive ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div className="flex-1">
                      {onboardingStatus.hasConnectedGoogleDrive ? (
                        <span className="text-sm text-muted-foreground line-through">
                          Connect Google Drive
                        </span>
                      ) : (
                        <Link href="/integrations?source=onboarding" className="text-sm hover:underline">
                          Connect Google Drive
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {onboardingStatus.hasDraftedContract ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div className="flex-1">
                      {onboardingStatus.hasDraftedContract ? (
                        <span className="text-sm text-muted-foreground line-through">
                          Generate your first contract
                        </span>
                      ) : (
                        <Link href="/builder?tab=contracts&source=onboarding" className="text-sm hover:underline">
                          Generate your first contract
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {onboardingStatus.hasDraftedDeck ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div className="flex-1">
                      {onboardingStatus.hasDraftedDeck ? (
                        <span className="text-sm text-muted-foreground line-through">
                          Generate your first deck
                        </span>
                      ) : (
                        <Link href="/builder?tab=decks&source=onboarding" className="text-sm hover:underline">
                          Generate your first deck
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {onboardingStatus.hasVaultDoc ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div className="flex-1">
                      {onboardingStatus.hasVaultDoc ? (
                        <span className="text-sm text-muted-foreground line-through">
                          Save a document to Vault
                        </span>
                      ) : (
                        <Link href="/vault?source=onboarding" className="text-sm hover:underline">
                          Save a document to Vault
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {onboardingStatus.hasRunAccountsPack ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div className="flex-1">
                      {onboardingStatus.hasRunAccountsPack ? (
                        <span className="text-sm text-muted-foreground line-through">
                          (Optional) Run an Accounts pack
                        </span>
                      ) : (
                        <Link href="/builder?tab=accounts&source=onboarding" className="text-sm hover:underline">
                          (Optional) Run an Accounts pack
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()
      )}

      <div className="mb-4 rounded-lg border bg-background p-4">
        <h2 className="text-sm font-semibold">What the main sections do</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>Workbench</strong> – analyze and compare your documents.
          </li>
          <li>
            <strong>Builder</strong> – generate and edit new drafts with AI.
          </li>
          <li>
            <strong>Vault</strong> – the single source of truth for your saved docs.
          </li>
          <li>
            <strong>Activity</strong> – timeline of what&apos;s happened to your docs.
          </li>
          <li>
            <strong>Mono</strong> – ask questions and run deeper analysis across docs.
          </li>
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Deals & Workflows</CardTitle>
            <CardDescription>Documents currently in progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDeals.map((deal) => (
              <div key={deal.name} className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium leading-none truncate">{deal.name}</p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Recommendations from Mono</CardDescription>
            </div>
            <Sparkles className="h-5 w-5 text-mono" />
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight) => (
              <div key={insight.title} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                      insight.priority === 'high'
                        ? 'bg-red-500'
                        : insight.priority === 'medium'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-medium leading-none">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  {insight.action}
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Edited</CardTitle>
          <CardDescription>Documents you've worked on recently</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{doc.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
