"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileSignature,
  LayoutDashboard,
  Link2,
  Mail,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type SignatureStatus = "pending" | "completed" | "declined" | "expired";

type SignatureEnvelopeSummary = {
  id: string;
  docTitle: string;
  signerName: string;
  signerEmail: string;
  sentAt: string; // ISO
  lastActivityAt: string | null; // ISO
  completedAt: string | null; // ISO
  status: SignatureStatus;
  source: "Vault" | "Workbench" | "Upload";
};

const isDemoEnvironment = process.env.NODE_ENV !== "production";

const DEMO_SIGNATURE_ENVELOPES: SignatureEnvelopeSummary[] = [
  {
    id: "env-001",
    docTitle: "NDA — ACME & Harmonyk",
    signerName: "Alice Rivera",
    signerEmail: "alice@example.com",
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    status: "pending",
    source: "Vault",
  },
  {
    id: "env-002",
    docTitle: "Master Services Agreement — Beta Customer",
    signerName: "Jordan Smith",
    signerEmail: "jordan@example.com",
    sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    source: "Workbench",
  },
  {
    id: "env-003",
    docTitle: "Offer Letter — Head of Sales",
    signerName: "Sam Taylor",
    signerEmail: "sam@example.com",
    sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    status: "declined",
    source: "Upload",
  },
  {
    id: "env-004",
    docTitle: "Renewal — Q4 Platform License",
    signerName: "Chris Johnson",
    signerEmail: "chris@example.com",
    sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivityAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    status: "expired",
    source: "Vault",
  },
];

function formatDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

function getStatusLabel(status: SignatureStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "completed":
      return "Completed";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
  }
}

function buildStatusBadge(status: SignatureStatus) {
  const baseClasses = "gap-1 text-xs";

  if (status === "completed") {
    return (
      <Badge
        variant="secondary"
        className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`}
      >
        <CheckCircle2 className="h-3 w-3" />
        {getStatusLabel(status)}
      </Badge>
    );
  }

  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className={`${baseClasses} border-amber-300 text-amber-700`}
      >
        <Clock className="h-3 w-3" />
        {getStatusLabel(status)}
      </Badge>
    );
  }

  if (status === "declined") {
    return (
      <Badge
        variant="outline"
        className={`${baseClasses} border-red-300 text-red-700`}
      >
        <AlertTriangle className="h-3 w-3" />
        {getStatusLabel(status)}
      </Badge>
    );
  }

  // expired
  return (
    <Badge
      variant="outline"
      className={`${baseClasses} border-slate-300 text-slate-600`}
    >
      <Clock className="h-3 w-3" />
      {getStatusLabel(status)}
    </Badge>
  );
}

export default function SignaturesPage() {
  const baseEnvelopes = isDemoEnvironment ? DEMO_SIGNATURE_ENVELOPES : [];
  const [envelopes, setEnvelopes] = useState<SignatureEnvelopeSummary[]>(() => baseEnvelopes);
  const { toast } = useToast();

  const signatureActionsEnabled = isFeatureEnabled("FEATURE_SIGNATURE_ACTIONS");

  const pendingCount = envelopes.filter((env) => env.status === "pending").length;
  const completedCount = envelopes.filter((env) => env.status === "completed").length;
  const problemCount = envelopes.filter(
    (env) => env.status === "declined" || env.status === "expired",
  ).length;

  const completedWithTurnaround = envelopes.filter(
    (env) => env.status === "completed" && env.completedAt,
  );

  let avgTurnaroundLabel = "—";
  if (completedWithTurnaround.length > 0) {
    const totalDays = completedWithTurnaround.reduce((sum, env) => {
      const sent = new Date(env.sentAt).getTime();
      const done = new Date(env.completedAt as string).getTime();
      const diffDays = (done - sent) / 86400000;
      return sum + (diffDays > 0 ? diffDays : 0);
    }, 0);
    const avgDays = totalDays / completedWithTurnaround.length;
    avgTurnaroundLabel = `${avgDays.toFixed(1)} days`;
  }

  const ensureActionsEnabled = (): boolean => {
    if (signatureActionsEnabled) return true;
    toast({
      title: "Coming soon",
      description:
        "Signature management from this dashboard is a post-GA enhancement. For now, use document-level Sign buttons in Vault or Workbench.",
    });
    return false;
  };

  const buildEnvelopeUrl = (envelope: SignatureEnvelopeSummary): string => {
    if (typeof window === "undefined") {
      // Fallback string for non-browser environments; this should never be shown to end users.
      return `/sign/demo/${encodeURIComponent(envelope.id)}`;
    }
    return `${window.location.origin}/sign/demo/${encodeURIComponent(envelope.id)}`;
  };

  const handleOpenEnvelope = (envelope: SignatureEnvelopeSummary) => {
    if (!ensureActionsEnabled()) return;
    if (typeof window === "undefined") return;

    const url = buildEnvelopeUrl(envelope);
    window.open(url, "_blank", "noopener,noreferrer");
    toast({
      title: "Envelope opened (demo)",
      description: "In production, this would open the live Documenso envelope.",
    });
  };

  const handleCopyLink = async (envelope: SignatureEnvelopeSummary) => {
    if (!ensureActionsEnabled()) return;

    const url = buildEnvelopeUrl(envelope);

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast({
        title: "Share link",
        description: url,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Signature link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description:
          "We couldn't copy the link. You can still open it and copy from the address bar.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEnvelope = (envelope: SignatureEnvelopeSummary) => {
    if (!ensureActionsEnabled()) return;

    setEnvelopes((prev) =>
      prev.map((env) =>
        env.id === envelope.id
          ? {
              ...env,
              status: "expired",
              lastActivityAt: new Date().toISOString(),
            }
          : env,
      ),
    );

    toast({
      title: "Signature cancelled (demo only)",
      description:
        "In a real environment this would void the outstanding envelope and stop reminders.",
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
      {/* Tabs stay — topbar should show "Share Hub" via page-titles.ts */}
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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Link2 className="h-4 w-4" />
            Share Links
          </Link>
          <Link
            href="/signatures"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-foreground shadow-sm"
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

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Waiting on recipients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Fully signed envelopes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Attention Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{problemCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Declined or expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Turnaround</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTurnaroundLabel}</div>
            <p className="text-xs text-muted-foreground mt-1">From send to complete</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signature Requests</CardTitle>
          <CardDescription>
            Track pending, completed, and stalled signature envelopes.
          </CardDescription>
          {!signatureActionsEnabled && (
            <p className="text-xs text-muted-foreground mt-1">
              Row-level actions here are read-only for GA. Advanced signature management (void,
              resend, reminder tuning) will be added after GA. Use document-level Sign buttons in
              Vault or Workbench to send signatures.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {envelopes.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileSignature className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No signature activity yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Send a document for signature from Vault or Workbench and it will appear here once
                envelope tracking is fully wired in.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Signer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envelopes.map((env) => (
                  <TableRow key={env.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{env.docTitle}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{env.signerName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {env.signerEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{buildStatusBadge(env.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(new Date(env.sentAt))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTimeAgo(env.lastActivityAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{env.source}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Open envelope"
                          onClick={() => handleOpenEnvelope(env)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Copy link"
                          onClick={() => {
                            void handleCopyLink(env);
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Resend"
                          onClick={() => {
                            if (!ensureActionsEnabled()) return;
                            toast({
                              title: "Reminder sent (demo)",
                              description:
                                "In production, the recipient would receive a fresh reminder email.",
                            });
                            setEnvelopes((prev) =>
                              prev.map((p) =>
                                p.id === env.id
                                  ? {
                                      ...p,
                                      lastActivityAt: new Date().toISOString(),
                                    }
                                  : p,
                              ),
                            );
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Cancel"
                          onClick={() => handleCancelEnvelope(env)}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
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
