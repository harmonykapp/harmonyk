"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Copy, Eye, FileSignature, LayoutDashboard, Link2, Lock, Trash2, Users } from 'lucide-react';
import Link from "next/link";
import { useEffect, useState } from "react";

type SharePermission = "view" | "comment" | "edit";

type ShareProtection = {
  passcodeEnabled: boolean;
  watermarkEnabled: boolean;
  expiresAt: string | null;
};

type ShareStats = {
  views: number;
  downloads: number;
  lastViewedAt: string | null;
};

type ShareLinkSummary = {
  id: string;
  docTitle: string;
  createdAt: string;
  createdBy: string;
  permission: SharePermission;
  protection: ShareProtection;
  stats: ShareStats;
};

const DEMO_SHARE_LINKS: ShareLinkSummary[] = [
  {
    id: "share-001",
    docTitle: "Partnership Agreement - Acme Corp",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "You",
    permission: "view",
    protection: {
      passcodeEnabled: true,
      watermarkEnabled: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    stats: {
      views: 12,
      downloads: 3,
      lastViewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "share-002",
    docTitle: "Q4 Financial Report - Draft",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "You",
    permission: "edit",
    protection: {
      passcodeEnabled: false,
      watermarkEnabled: false,
      expiresAt: null,
    },
    stats: {
      views: 8,
      downloads: 1,
      lastViewedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "share-003",
    docTitle: "Product Roadmap 2024",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "You",
    permission: "comment",
    protection: {
      passcodeEnabled: false,
      watermarkEnabled: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    stats: {
      views: 45,
      downloads: 12,
      lastViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "share-004",
    docTitle: "NDA - Mutual Confidentiality",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "You",
    permission: "view",
    protection: {
      passcodeEnabled: true,
      watermarkEnabled: false,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    stats: {
      views: 3,
      downloads: 0,
      lastViewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  },
];

const isDemoEnvironment = process.env.NODE_ENV !== "production";

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function formatTimeAgo(isoString: string | null): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return formatDate(date);
}

function formatExpiresAt(isoString: string | null): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  return formatDate(date);
}

function getPermissionLabel(permission: SharePermission): string {
  switch (permission) {
    case "view":
      return "View Only";
    case "comment":
      return "View & Comment";
    case "edit":
      return "Edit";
  }
}

function getProtectionLabel(protection: ShareProtection): string {
  const parts: string[] = [];
  if (protection.passcodeEnabled) parts.push("Password");
  if (protection.watermarkEnabled) parts.push("Watermark");
  return parts.length > 0 ? parts.join(", ") : "None";
}

function getStatusLabel(protection: ShareProtection): { label: string; variant: "secondary" | "outline" } {
  if (!protection.expiresAt) {
    return { label: "Active", variant: "secondary" };
  }
  const expiresAt = new Date(protection.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return { label: "Expired", variant: "outline" };
  }
  return { label: "Active", variant: "secondary" };
}

export default function ShareLinksPage() {
  const [shareLinks, setShareLinks] = useState<ShareLinkSummary[]>(() =>
    isDemoEnvironment ? DEMO_SHARE_LINKS : []
  );
  const [isLoading, setIsLoading] = useState(true);
  const shareActionsEnabled = isFeatureEnabled("FEATURE_SHARE_ACTIONS");
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const buildShareUrl = (shareId: string): string | null => {
    if (typeof window === "undefined") return null;
    const origin = window.location.origin;
    return `${origin}/s/${encodeURIComponent(shareId)}`;
  };

  const handleOpenLink = (shareId: string) => {
    if (!shareActionsEnabled) {
      toast({
        title: "Share link management is coming soon",
        description: "Opening links from this dashboard will be enabled after GA.",
      });
      return;
    }

    const url = buildShareUrl(shareId);
    if (!url) {
      toast({
        title: "Link unavailable",
        description: "We couldn't build a share URL in this environment.",
        variant: "destructive",
      });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async (shareId: string) => {
    if (!shareActionsEnabled) {
      toast({
        title: "Share link management is coming soon",
        description: "Copying links from this dashboard will be enabled after GA.",
      });
      return;
    }

    const url = buildShareUrl(shareId);
    if (!url) {
      // eslint-disable-next-line no-console
      console.error("[share-links] Share URL unavailable");
      toast({
        title: "Couldn't copy link",
        variant: "destructive",
      });
      return;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      toast({ title: "Link copied" });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[share-links] Failed to copy link", error);
      toast({
        title: "Couldn't copy link",
        variant: "destructive",
      });
    }
  };

  const handleRevokeLink = (shareId: string) => {
    if (!shareActionsEnabled) {
      toast({
        title: "Share link management is coming soon",
        description: "Revoking links from this dashboard will be enabled after GA.",
      });
      return;
    }

    setShareLinks((prev) => prev.filter((link) => link.id !== shareId));

    toast({
      title: "Link revoked (demo)",
      description: "This removed the link from the list in this demo environment.",
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      {/* Tabs stay — topbar already shows "Share Hub" */}
      {/* Top tabs: Overview / Share Links / Signatures / Contacts */}
      <div className="w-fit">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <Link
            href="/share"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>
          <Link
            href="/share/links"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-foreground shadow-sm"
          >
            <Link2 className="h-4 w-4" />
            Share Links
          </Link>
          <Link
            href="/signatures"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <FileSignature className="h-4 w-4" />
            Signatures
          </Link>
          <Link
            href="/share/contacts"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Users className="h-4 w-4" />
            Contacts
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Share Links</CardTitle>
          <CardDescription>
            Manage and monitor your shared document links
          </CardDescription>
          {!shareActionsEnabled && (
            <p className="text-xs text-muted-foreground mt-1">
              Advanced share workflows (bulk revoke, guest accounts, deep analytics) are coming soon.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-lg border border-border/60 bg-background p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : shareLinks.length === 0 ? (
            <EmptyState
              title="No share links yet"
              description={
                isDemoEnvironment
                  ? "Create a secure link to share documents and track engagement."
                  : "Use a document share or signature flow to get started."
              }
              action={
                <>
                  <Button asChild>
                    <Link href="/share/links">
                      <Link2 className="h-4 w-4 mr-2" />
                      Create Share Link
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/signatures">
                      <FileSignature className="h-4 w-4 mr-2" />
                      Request Signature
                    </Link>
                  </Button>
                </>
              }
            />
          ) : (
            <div className="space-y-3">
              {shareLinks.map((link) => {
                const status = getStatusLabel(link.protection);
                const protectionLabel = getProtectionLabel(link.protection);
                return (
                  <div
                    key={link.id}
                    className="rounded-lg border border-border/60 bg-background p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{link.docTitle}</div>
                          </div>
                          <Badge variant={status.variant} className="text-[10px]">
                            {status.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {getPermissionLabel(link.permission)}
                          </Badge>
                          {protectionLabel !== "None" ? (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Lock className="h-3 w-3" />
                              {protectionLabel}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Unprotected</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>
                            Created {formatDate(new Date(link.createdAt))} · {link.createdBy}
                          </span>
                          <span>Last viewed {formatTimeAgo(link.stats.lastViewedAt)}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {link.stats.views} views
                          </span>
                          <span>Expires {formatExpiresAt(link.protection.expiresAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenLink(link.id)}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleCopyLink(link.id)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy link
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-600"
                          onClick={() => handleRevokeLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

