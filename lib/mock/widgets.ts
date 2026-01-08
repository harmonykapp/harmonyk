import type { FilterChipItem } from "@/components/widgets/FilterChipsRow";
import type { RankedListItem } from "@/components/widgets/RankedListCard";
import type { Segment } from "@/components/widgets/SegmentBar";

export type SignatureLoad = {
  waitingOnMe: number;
  waitingOnOthers: number;
};

export const mockDashboardPriorities: RankedListItem[] = [
  {
    id: "p1",
    title: "Send signature request",
    subtitle: "SAFE — Seed Round",
    tag: "high",
    valueLabel: "Due today",
    valuePct: 80,
    href: "/workbench?focus=sign",
  },
  {
    id: "p2",
    title: "Review redlines",
    subtitle: "NDA — Acme Co",
    tag: "review",
    valueLabel: "2 changes",
    valuePct: 55,
    href: "/workbench?focus=review",
  },
  {
    id: "p3",
    title: "Follow up for view",
    subtitle: "Pitch Deck — Series A",
    tag: "follow-up",
    valueLabel: "No views",
    valuePct: 35,
    href: "/workbench?focus=followup",
  },
  {
    id: "p4",
    title: "Confirm recipients",
    subtitle: "MOU — Partner",
    tag: "share",
    valueLabel: "Draft ready",
    valuePct: 25,
    href: "/workbench?focus=share",
  },
  {
    id: "p5",
    title: "Finalize document",
    subtitle: "Employment Agreement — Contractor",
    tag: "draft",
    valueLabel: "1 section",
    valuePct: 15,
    href: "/workbench?focus=draft",
  },
];

export const mockSignatureLoad: SignatureLoad = {
  waitingOnMe: 2,
  waitingOnOthers: 6,
};

export const mockWorkbenchFocus: Segment[] = [
  { id: "overdue", label: "Overdue", value: 3, href: "/workbench?bucket=overdue" },
  { id: "today", label: "Due today", value: 5, href: "/workbench?bucket=today" },
  { id: "week", label: "Due this week", value: 9, href: "/workbench?bucket=week" },
];

export const mockVaultQuickFilters: FilterChipItem[] = [
  { id: "all", label: "All", count: 124 },
  { id: "contracts", label: "Contracts", count: 46 },
  { id: "decks", label: "Decks", count: 12 },
  { id: "invoices", label: "Invoices", count: 22 },
  { id: "shared", label: "Shared", count: 18 },
  { id: "signed", label: "Signed", count: 9 },
];

export type LinkLeaderboardRow = {
  id: string;
  name: string;
  docName: string;
  views: number;
  lastView: string;
  status: "active" | "expired";
};

export const mockLinkLeaderboard: LinkLeaderboardRow[] = [
  {
    id: "l1",
    name: "Deck — Investors",
    docName: "Pitch Deck",
    views: 32,
    lastView: "2h ago",
    status: "active",
  },
  {
    id: "l2",
    name: "NDA — Acme",
    docName: "NDA",
    views: 14,
    lastView: "1d ago",
    status: "active",
  },
  {
    id: "l3",
    name: "MOU — Partner",
    docName: "MOU",
    views: 7,
    lastView: "4d ago",
    status: "expired",
  },
];

export type TaskKpis = {
  open: number;
  done: number;
  overdue: number;
  total: number;
};

export const mockTaskKpis: TaskKpis = {
  open: 8,
  done: 21,
  overdue: 2,
  total: 29,
};

export type FunnelStage = {
  label: string;
  count: number;
};

export const mockDealFunnelStages: FunnelStage[] = [
  { label: "Created", count: 24 },
  { label: "In Review", count: 18 },
  { label: "Out for Sign", count: 12 },
  { label: "Signed", count: 8 },
  { label: "Active", count: 5 },
];

export const mockAtRiskItems: RankedListItem[] = [
  {
    id: "r1",
    title: "SAFE — Seed Round",
    subtitle: "Acme Ventures",
    tag: "high",
    valueLabel: "3 days overdue",
    valuePct: 95,
    href: "/workbench?focus=at-risk",
  },
  {
    id: "r2",
    title: "NDA — Partner Co",
    subtitle: "Blocking signature",
    tag: "medium",
    valueLabel: "1 week",
    valuePct: 75,
    href: "/workbench?focus=at-risk",
  },
  {
    id: "r3",
    title: "Employment Agreement",
    subtitle: "Jane Doe",
    tag: "medium",
    valueLabel: "2 weeks",
    valuePct: 60,
    href: "/workbench?focus=at-risk",
  },
  {
    id: "r4",
    title: "MOU — Strategic Partner",
    subtitle: "Pending review",
    tag: "low",
    valueLabel: "3 weeks",
    valuePct: 40,
    href: "/workbench?focus=at-risk",
  },
];

export const mockActivityTrend: number[] = [12, 15, 18, 14, 22, 19, 25, 28, 24, 30, 27, 32];

