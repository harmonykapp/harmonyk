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
  Clock,
  Copy,
  FileSignature,
  LayoutDashboard,
  Link2,
  Mail,
  Users,
} from "lucide-react";
import Link from "next/link";

type ContactSource = "auto" | "google" | "manual";

type ContactSummary = {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  tags: string[];
  lastSharedAt: string | null;
  lastSignedAt: string | null;
  totalShares: number;
  totalSignatures: number;
  source: ContactSource;
};

const isDemoEnvironment = process.env.NODE_ENV !== "production";

const DEMO_CONTACTS: ContactSummary[] = [
  {
    id: "ct-001",
    name: "Alice Rivera",
    email: "alice@example.com",
    company: "Acme Corp",
    role: "VP Partnerships",
    tags: ["Warm", "Prospect"],
    lastSharedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    lastSignedAt: null,
    totalShares: 4,
    totalSignatures: 0,
    source: "auto",
  },
  {
    id: "ct-002",
    name: "Jordan Smith",
    email: "jordan@example.com",
    company: "Beta Systems",
    role: "Founder / CEO",
    tags: ["Customer", "Signed"],
    lastSharedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    lastSignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    totalShares: 6,
    totalSignatures: 2,
    source: "auto",
  },
  {
    id: "ct-003",
    name: "Sam Taylor",
    email: "sam@example.com",
    company: "Northline Ventures",
    role: "Partner",
    tags: ["Investor"],
    lastSharedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    lastSignedAt: null,
    totalShares: 3,
    totalSignatures: 0,
    source: "google",
  },
  {
    id: "ct-004",
    name: "Chris Johnson",
    email: "chris@example.com",
    company: "Gamma Labs",
    role: "Head of Sales",
    tags: ["Lead"],
    lastSharedAt: null,
    lastSignedAt: null,
    totalShares: 0,
    totalSignatures: 0,
    source: "manual",
  },
];

function formatDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
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

function formatSource(source: ContactSource): string {
  switch (source) {
    case "auto":
      return "Auto (shares / signatures)";
    case "google":
      return "Google Contacts";
    case "manual":
      return "Manual";
  }
}

export default function ContactsPage() {
  const baseContacts = isDemoEnvironment ? DEMO_CONTACTS : [];
  const [contacts] = useState<ContactSummary[]>(() => baseContacts);
  const { toast } = useToast();

  // Reuse share actions flag for now; full contacts CRUD is post-GA.
  const contactActionsEnabled = isFeatureEnabled("FEATURE_SHARE_ACTIONS");

  const warmContactsCount = contacts.filter(
    (c) => c.totalShares + c.totalSignatures > 0,
  ).length;
  const signedContactsCount = contacts.filter(
    (c) => c.totalSignatures > 0,
  ).length;
  const investorCount = contacts.filter((c) =>
    c.tags.some((t) => t.toLowerCase() === "investor"),
  ).length;

  const ensureActionsEnabled = (): boolean => {
    if (contactActionsEnabled) return true;
    toast({
      title: "Coming soon",
      description:
        "Contact management from this dashboard is a post-GA enhancement. For now, contacts are auto-created from share and signature flows.",
    });
    return false;
  };

  const handleCopyEmail = async (contact: ContactSummary) => {
    if (!ensureActionsEnabled()) return;

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast({
        title: "Contact email",
        description: contact.email,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(contact.email);
      toast({
        title: "Email copied",
        description: `${contact.email} copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description:
          "We couldn't copy the email. You can still click through and copy it manually.",
        variant: "destructive",
      });
    }
  };

  const handleViewActivity = (contact: ContactSummary) => {
    if (!ensureActionsEnabled()) return;
    toast({
      title: "Contact activity (demo)",
      description:
        `In production, this would open a filtered view of share links and signatures for ${contact.name}.`,
    });
  };

  const handleAddContact = () => {
    if (!ensureActionsEnabled()) return;
    toast({
      title: "Add contact (post-GA)",
      description:
        "Manual contact creation will be added after GA. For now, contacts are auto-created when you share or request signatures.",
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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-foreground shadow-sm"
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
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In this workspace</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Warm Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warmContactsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Have recent share or signature activity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Signed Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signedContactsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Have signed at least once</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investorCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Tagged as investors</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>People you&apos;re working with</CardTitle>
            <CardDescription>
              Contacts are built from your share links and signature requests.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddContact}>
            <Users className="h-4 w-4 mr-2" />
            Add contact
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Once you start sharing documents or sending signature requests, contacts will
                appear here automatically.
              </p>
              <Button type="button" onClick={handleAddContact}>
                <Users className="h-4 w-4 mr-2" />
                Add contact
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company / Role</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium truncate">{contact.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contact.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      <div className="truncate">{contact.company}</div>
                      <div className="text-xs truncate">{contact.role}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Shared: {formatTimeAgo(contact.lastSharedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <FileSignature className="h-3 w-3" />
                        <span>
                          Signed: {formatTimeAgo(contact.lastSignedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{contact.totalShares} shares</div>
                      <div>{contact.totalSignatures} signatures</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatSource(contact.source)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View activity"
                          onClick={() => handleViewActivity(contact)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Copy email"
                          onClick={() => {
                            void handleCopyEmail(contact);
                          }}
                        >
                          <Copy className="h-4 w-4" />
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
