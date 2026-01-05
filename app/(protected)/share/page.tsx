"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Copy, Eye, FileSignature, LayoutDashboard, Link2, Lock, Trash2, Users } from 'lucide-react';
import Link from "next/link";
import { useState } from "react";

type SharePermission = "view" | "comment" | "edit";

type ShareProtection = {
  passcodeEnabled: boolean;
  watermarkEnabled: boolean;
  expiresAt: string | null;  // ISO
};

type ShareStats = {
  views: number;
  downloads: number;
  lastViewedAt: string | null; // ISO
};

type ShareLinkSummary = {
  id: string;
  docTitle: string;
  createdAt: string;  // ISO
  createdBy: string;  // simple string for now (e.g. "You")
  permission: SharePermission;
  protection: ShareProtection;
  stats: ShareStats;
};

const DEMO_SHARE_LINKS: ShareLinkSummary[] = [
  {
    id: "share-001",
    docTitle: "Partnership Agreement - Acme Corp",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    createdBy: "You",
    permission: "view",
    protection: {
      passcodeEnabled: true,
      watermarkEnabled: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    },
    stats: {
      views: 12,
      downloads: 3,
      lastViewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
  },
  {
    id: "share-002",
    docTitle: "Q4 Financial Report - Draft",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
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
      lastViewedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    },
  },
  {
    id: "share-003",
    docTitle: "Product Roadmap 2024",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
    createdBy: "You",
    permission: "comment",
    protection: {
      passcodeEnabled: false,
      watermarkEnabled: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    },
    stats: {
      views: 45,
      downloads: 12,
      lastViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
  },
  {
    id: "share-004",
    docTitle: "NDA - Mutual Confidentiality",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    createdBy: "You",
    permission: "view",
    protection: {
      passcodeEnabled: true,
      watermarkEnabled: false,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    },
    stats: {
      views: 3,
      downloads: 0,
      lastViewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    },
  },
];

// GA behaviour:
// - In production, we currently do not surface real share links here.
// - This page acts as a Share Center shell; management is a post-GA enhancement.
const isDemoEnvironment = process.env.NODE_ENV !== "production";

// Free plan cap: up to 10 active share links.
// Starter/Pro/Teams are effectively unlimited; this text is just surfacing
// the model, not enforcing anything yet.
const FREE_SHARE_LINK_LIMIT = 10;

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

export default function SharePage() {
  const { toast } = useToast();

  const [shareLinks, setShareLinks] = useState<ShareLinkSummary[]>(() =>
    isDemoEnvironment ? DEMO_SHARE_LINKS : []
  );
  const shareActionsEnabled = isFeatureEnabled("FEATURE_SHARE_ACTIONS");
  const totalViews = shareLinks.reduce((sum, link) => sum + link.stats.views, 0);
  const protectedCount = shareLinks.filter(
    (link) => link.protection.passcodeEnabled || link.protection.watermarkEnabled
  ).length;
  const activeLinks = shareLinks.length;

  function buildShareUrl(link: ShareLinkSummary): string {
    // Public share slug; in GA this will map to the real share route.
    const path = `/s/${link.id}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }

  function handleOpenLink(link: ShareLinkSummary) {
    if (!shareActionsEnabled) {
      toast({
        title: "Share actions coming soon",
        description: "Link management will be fully wired after GA. For now, use document-level share & signature flows.",
      });
      return;
    }

    const url = buildShareUrl(link);
    window.open(url, "_blank", "noopener,noreferrer");
    toast({
      title: "Share link opened",
      description: "We opened the shared view in a new tab.",
    });
  }

  async function handleCopyLink(link: ShareLinkSummary) {
    if (!shareActionsEnabled) {
      toast({
        title: "Share actions coming soon",
        description: "Copy and revoke will be fully wired after GA. For now, use document-level share & signature flows.",
      });
      return;
    }

    const url = buildShareUrl(link);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }
      toast({
        title: "Link copied",
        description: "Share URL copied to your clipboard.",
      });
    } catch {
      toast({
        title: "Could not copy link",
        description: "Please copy the link manually from your browser.",
        variant: "destructive",
      });
    }
  }

  function handleRevokeLink(link: ShareLinkSummary) {
    if (!shareActionsEnabled) {
      toast({
        title: "Share actions coming soon",
        description: "Bulk revoke and fine-grained controls will be added post-GA.",
      });
      return;
    }

    // Demo-only revoke behaviour: update local state so the UI reflects the change.
    setShareLinks((prev) => prev.filter((l) => l.id !== link.id));
    toast({
      title: "Share link revoked",
      description: "This change is local to this demo environment.",
    });
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
      {/* Top tabs: Overview / Share Links / Signatures / Contacts */}
      <div className="w-fit">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <Link
            href="/share"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-foreground shadow-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>
          <Link
            href="/share/links"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shareLinks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all links</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Protected Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{protectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Password or watermark</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Guest Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">From shared links</p>
          </CardContent>
        </Card>
      </div>

      <Card id="links">
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
          {shareLinks.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No share links yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isDemoEnvironment
                  ? "Create a secure link to share documents with passcodes, watermarks, and expiry."
                  : "Share link management from this dashboard will be added after GA. For now, use document-level share and signature flows."}
              </p>
              <Button>
                <Link2 className="h-4 w-4 mr-2" />
                Create a share link
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Protection</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Last Viewed</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{link.docTitle}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPermissionLabel(link.permission)}</Badge>
                    </TableCell>
                    <TableCell>
                      {getProtectionLabel(link.protection) !== "None" ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          {getProtectionLabel(link.protection)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        {link.stats.views}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTimeAgo(link.stats.lastViewedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatExpiresAt(link.protection.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Open link"
                          type="button"
                          onClick={() => handleOpenLink(link)}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Copy link"
                          type="button"
                          onClick={() => {
                            void handleCopyLink(link);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Revoke"
                          type="button"
                          onClick={() => handleRevokeLink(link)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
