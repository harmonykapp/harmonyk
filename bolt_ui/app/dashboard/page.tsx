import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  ArrowRight,
  FileSignature,
  FileText,
  Sparkles,
  TrendingUp
} from 'lucide-react';

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

export default function DashboardPage() {
  return (
    <AppShell monoContext="dashboard">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your document activity and insights at a glance
          </p>
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
                <CardDescription>Recommendations from Maestro</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-mono" />
            </CardHeader>
            <CardContent className="space-y-4">
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
    </AppShell>
  );
}
