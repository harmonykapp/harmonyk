import { AppShell } from '@/components/shell/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Clock, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

const suggestedPlaybooks = [
  {
    name: 'Inbound NDA Processor',
    description: 'Automatically save, analyze, send for signature, and share NDAs',
    runs: 24,
    lastRun: '2 hours ago',
  },
  {
    name: 'Aging Proposal Nudger',
    description: 'Find stale proposals and send follow-up reminders',
    runs: 12,
    lastRun: '1 day ago',
  },
  {
    name: 'Weekly Ops Brief Generator',
    description: 'Generate comprehensive activity summary every Monday',
    runs: 8,
    lastRun: '3 days ago',
  },
];

const myPlaybooks = [
  {
    name: 'Contract Review & Approval',
    description: 'Route contracts through legal and exec approval chain',
    status: 'active',
    runs: 47,
  },
  {
    name: 'Document Expiry Monitor',
    description: 'Alert team 30 days before document expiration',
    status: 'active',
    runs: 15,
  },
];

export default function PlaybooksPage() {
  return (
    <AppShell monoContext="dashboard">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Playbooks</h1>
            <p className="text-muted-foreground mt-1">
              Automate repetitive document workflows with AI
            </p>
          </div>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Create Playbook
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">106</div>
              <p className="text-xs text-muted-foreground mt-1">+18 this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Playbooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground mt-1">2 scheduled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4h</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Playbooks</CardTitle>
            <CardDescription>
              Popular automation workflows for your document tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedPlaybooks.map((playbook) => (
              <div
                key={playbook.name}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex gap-4 flex-1">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium">{playbook.name}</h3>
                    <p className="text-sm text-muted-foreground">{playbook.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {playbook.runs} runs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {playbook.lastRun}
                      </span>
                    </div>
                  </div>
                </div>
                <Button>
                  Enable
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Playbooks</CardTitle>
            <CardDescription>Your custom automation workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {myPlaybooks.map((playbook) => (
              <div
                key={playbook.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-medium">{playbook.name}</h3>
                    <p className="text-sm text-muted-foreground">{playbook.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{playbook.runs} runs</Badge>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Active
                  </Badge>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
