"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileSignature, LayoutDashboard, Link2, Users } from 'lucide-react';
import Link from "next/link";
import { WidgetCard } from "@/components/widgets/WidgetCard";

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
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="w-fit mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6">
          <WidgetCard title="Top Share Links" subtitle="Most viewed" className="h-[320px]">
            <div className="space-y-1">
              {shareLinks.slice(0, 6).map((link) => (
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
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-3">
          <WidgetCard title="Engagement Trend" subtitle="Last 30 days" className="h-[320px]">
            <div className="h-full flex items-end justify-between gap-[2px] pb-4">
              {ENGAGEMENT_SPARKLINE.map((value, i) => {
                const height = (value / 100) * 220;
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

        <div className="md:col-span-3">
          <WidgetCard title="Follow-ups Due" subtitle="Action required" className="h-[320px]">
            <div className="space-y-2">
              {followups.map((item) => (
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
            </div>
          </WidgetCard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-[70px]">
        <div className="md:col-span-6">
          <WidgetCard title="Recipients / Companies" subtitle="Shared with" className="h-[320px]">
            <div className="space-y-1">
              {companies.slice(0, 6).map((company) => (
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
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-3">
          <WidgetCard title="Link Status Breakdown" subtitle="Distribution" className="h-[320px]">
            <div className="h-full flex items-center justify-center">
              <div className="relative" style={{ width: "180px", height: "180px" }}>
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
            <div className="grid grid-cols-1 gap-2 text-[10px] mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400/40" />
                  <span>Active</span>
                </div>
                <span className="font-medium">64%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400/40" />
                  <span>Expired</span>
                </div>
                <span className="font-medium">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-400/40" />
                  <span>Revoked</span>
                </div>
                <span className="font-medium">16%</span>
              </div>
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-3">
          <WidgetCard title="Drop-off Points" subtitle="Conversion funnel" className="h-[320px]">
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

      {isDemoEnvironment && (
        <p className="text-[10px] text-muted-foreground mt-6">
          Demo data only. In production, this view will show real share analytics.
        </p>
      )}
    </div>
  );
}
