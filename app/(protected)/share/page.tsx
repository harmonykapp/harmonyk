"use client";

// PGW2 UI polish:
// Increase row heights so "Top Share Links" and "Breakdowns" sections can show full content
// without clipping (no inner scrolling).
const TOP_SHARE_LINKS_ROW_CARD_HEIGHT = "lg:h-[420px]";
const BREAKDOWNS_ROW_CARD_HEIGHT = "lg:h-[420px]";

import { Badge } from '@/components/ui/badge';
import { Eye, FileSignature, LayoutDashboard, Link2, Users } from 'lucide-react';
import Link from "next/link";
import { WidgetCard, WidgetRow } from "@/components/widgets";

const isDemoEnvironment = process.env.NODE_ENV !== "production";

const DEMO_SHARE_LINKS = [
  { id: "1", name: "Partnership Agreement - Acme", docType: "Contract", views: 42, lastView: "2h ago", status: "active" },
  { id: "2", name: "Q4 Pitch Deck v3", docType: "Deck", views: 38, lastView: "5h ago", status: "active" },
  { id: "3", name: "NDA - Mutual Confidentiality", docType: "Contract", views: 24, lastView: "1d ago", status: "active" },
  { id: "4", name: "Product Roadmap 2024", docType: "Deck", views: 19, lastView: "2d ago", status: "expired" },
  { id: "5", name: "Financial Pack Nov 2024", docType: "Financial", views: 15, lastView: "3d ago", status: "active" },
  { id: "6", name: "MSA - Beta Customer", docType: "Contract", views: 12, lastView: "4d ago", status: "revoked" },
];

const DEMO_COMPANIES = [
  { id: "1", name: "Acme Corp", docsShared: 8, lastActivity: "2h ago" },
  { id: "2", name: "Beta Labs", docsShared: 6, lastActivity: "5h ago" },
  { id: "3", name: "Gamma Industries", docsShared: 5, lastActivity: "1d ago" },
  { id: "4", name: "Delta Ventures", docsShared: 4, lastActivity: "2d ago" },
  { id: "5", name: "Epsilon Partners", docsShared: 3, lastActivity: "3d ago" },
  { id: "6", name: "Zeta Holdings", docsShared: 2, lastActivity: "5d ago" },
];

const DEMO_FOLLOWUPS = [
  { id: "1", title: "Partnership Agreement - Acme", dueDate: "Today", priority: "high" },
  { id: "2", title: "Q4 Pitch Deck v3", dueDate: "Tomorrow", priority: "medium" },
  { id: "3", title: "NDA - Beta Labs", dueDate: "In 2 days", priority: "medium" },
  { id: "4", title: "MSA Review", dueDate: "In 5 days", priority: "low" },
];

const ENGAGEMENT_SPARKLINE = [12, 18, 15, 22, 28, 24, 30, 35, 32, 38, 42, 40, 45, 48, 52, 55, 50, 58, 62, 60, 65, 68, 72, 70, 75, 78, 82, 80, 85, 88];

export default function SharePage() {
  const shareLinks = isDemoEnvironment ? DEMO_SHARE_LINKS : [];
  const companies = isDemoEnvironment ? DEMO_COMPANIES : [];
  const followups = isDemoEnvironment ? DEMO_FOLLOWUPS : [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex min-h-10 w-full flex-wrap items-center justify-center gap-1 rounded-md bg-muted p-1 text-muted-foreground sm:w-fit">
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

      <WidgetRow
        title="Share performance"
        subtitle="Links, trend, and follow-ups"
        storageKey="row:share:performance"
        className="mt-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className={`md:col-span-6 ${TOP_SHARE_LINKS_ROW_CARD_HEIGHT}`}>
          <WidgetCard title="Top Share Links" subtitle="Most viewed" className="h-full">
            <div className="space-y-1">
              {shareLinks.slice(0, 5).map((link) => (
                <div key={link.id} className="flex items-center justify-between gap-2 p-2 rounded border border-border/40 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{link.name}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{link.docType}</Badge>
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <Eye className="h-3 w-3" />
                    {link.views}
                  </div>
                  <div className="text-muted-foreground shrink-0 w-12">{link.lastView}</div>
                  <Badge
                    variant={link.status === "active" ? "secondary" : "outline"}
                    className="text-[10px] shrink-0"
                  >
                    {link.status}
                  </Badge>
                </div>
              ))}
              {shareLinks.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No share links yet
                </div>
              )}
              {shareLinks.length > 5 && (
                <div className="pt-2">
                  <Link
                    href="/share/links"
                    className="inline-flex text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    View all →
                  </Link>
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        <div className={`md:col-span-3 ${TOP_SHARE_LINKS_ROW_CARD_HEIGHT}`}>
          <WidgetCard title="Engagement Trend" subtitle="Last 30 days" className="h-full">
            <div className="h-full flex items-end justify-between gap-[2px] pb-2">
              {ENGAGEMENT_SPARKLINE.map((value, i) => {
                const height = (value / 100) * 180;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-emerald-400/40 rounded-t"
                      style={{ height: `${height}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </WidgetCard>
        </div>

        <div className={`md:col-span-3 ${TOP_SHARE_LINKS_ROW_CARD_HEIGHT}`}>
          <WidgetCard title="Follow-ups Due" subtitle="Action required" className="h-full">
            <div className="space-y-2">
              {followups.slice(0, 5).map((item) => (
                <div key={item.id} className="p-2 rounded border border-border/40">
                  <div className="text-sm font-medium truncate mb-1">{item.title}</div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={
                        item.priority === "high"
                          ? "text-[10px] bg-rose-50 border-rose-400/40 text-rose-700 dark:bg-rose-950/20"
                          : item.priority === "medium"
                          ? "text-[10px] bg-amber-50 border-amber-400/40 text-amber-700 dark:bg-amber-950/20"
                          : "text-[10px]"
                      }
                    >
                      {item.dueDate}
                    </Badge>
                  </div>
                </div>
              ))}
              {followups.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No follow-ups
                </div>
              )}
              {followups.length > 5 && (
                <div className="pt-1">
                  <Link
                    href="/tasks"
                    className="inline-flex text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    View all →
                  </Link>
                </div>
              )}
            </div>
          </WidgetCard>
        </div>
        </div>
      </WidgetRow>

      <WidgetRow
        title="Breakdowns"
        subtitle="Recipients and funnel"
        storageKey="row:share:breakdowns"
        className="mt-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className={`md:col-span-6 ${BREAKDOWNS_ROW_CARD_HEIGHT}`}>
          <WidgetCard title="Recipients / Companies" subtitle="Shared with" className="h-full">
            <div className="space-y-1">
              {companies.slice(0, 5).map((company) => (
                <div key={company.id} className="flex items-center justify-between gap-2 p-2 rounded border border-border/40 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{company.name}</div>
                  </div>
                  <div className="text-muted-foreground shrink-0">
                    {company.docsShared} docs
                  </div>
                  <div className="text-muted-foreground shrink-0 w-16">
                    {company.lastActivity}
                  </div>
                </div>
              ))}
              {companies.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No recipients yet
                </div>
              )}
              {companies.length > 5 && (
                <div className="pt-2">
                  <Link
                    href="/share/contacts"
                    className="inline-flex text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    View all →
                  </Link>
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        <div className={`md:col-span-3 ${BREAKDOWNS_ROW_CARD_HEIGHT}`}>
          <WidgetCard title="Link Status Breakdown" subtitle="Distribution" className="h-full" bodyClassName="flex flex-col">
            <div className="flex flex-col items-center justify-start">
              <div className="shrink-0 mb-2">
                <div className="grid grid-cols-1 gap-1.5 text-[9px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <div className="w-2 h-2 rounded-full bg-emerald-400/40" />
                      <span>Active</span>
                    </div>
                    <span className="font-medium ml-2">64%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <div className="w-2 h-2 rounded-full bg-amber-400/40" />
                      <span>Expired</span>
                    </div>
                    <span className="font-medium ml-2">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <div className="w-2 h-2 rounded-full bg-rose-400/40" />
                      <span>Revoked</span>
                    </div>
                    <span className="font-medium ml-2">16%</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-center flex-1 min-h-0">
                <div className="relative" style={{ width: "140px", height: "140px" }}>
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="20"
                      className="text-emerald-400/40"
                      strokeDasharray="160 251"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="20"
                      className="text-amber-400/40"
                      strokeDasharray="50 251"
                      strokeDashoffset="-160"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="20"
                      className="text-rose-400/40"
                      strokeDasharray="41 251"
                      strokeDashoffset="-210"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </WidgetCard>
        </div>

        <div className={`md:col-span-3 ${BREAKDOWNS_ROW_CARD_HEIGHT}`}>
          <WidgetCard title="Drop-off Points" subtitle="Conversion funnel" className="h-full">
            <div className="h-full flex flex-col justify-center gap-4 py-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Opened</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="h-6 bg-emerald-400/40 rounded" style={{ width: "100%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Viewed</span>
                  <span className="font-medium">124</span>
                </div>
                <div className="h-6 bg-blue-400/40 rounded" style={{ width: "79%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Replied</span>
                  <span className="font-medium">68</span>
                </div>
                <div className="h-6 bg-amber-400/40 rounded" style={{ width: "44%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Signed</span>
                  <span className="font-medium">42</span>
                </div>
                <div className="h-6 bg-slate-400/30 rounded" style={{ width: "27%" }} />
              </div>
            </div>
          </WidgetCard>
        </div>
        </div>
      </WidgetRow>

      {isDemoEnvironment && (
        <p className="text-[10px] text-muted-foreground mt-6">
          Demo data only. In production, this view will show real share analytics.
        </p>
      )}
    </div>
  );
}
