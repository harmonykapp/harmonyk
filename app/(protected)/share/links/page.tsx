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

export default function ShareLinksPage() {
  const [shareLinks, setShareLinks] = useState<ShareLinkSummary[]>(() =>
    isDemoEnvironment ? DEMO_SHARE_LINKS : []
  );
  const shareActionsEnabled = isFeatureEnabled("FEATURE_SHARE_ACTIONS");
  const { toast } = useToast();

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
      toast({
        title: "Copy failed",
        description: "We couldn't build a share URL in this environment.",
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

      toast({
        title: "Link copied",
        description: "Share link copied to your clipboard.",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[share-links] Failed to copy link", error);
      toast({
        title: "Copy failed",
        description: "We couldn't copy that link. Please try again.",
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
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
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
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Open link"
                          onClick={() => handleOpenLink(link.id)}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Copy link"
                          onClick={() => void handleCopyLink(link.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Revoke"
                          onClick={() => handleRevokeLink(link.id)}
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

