import { AppShell } from '@/components/shell/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileSignature, Send, CheckCircle2, Clock, AlertCircle, Eye, Download } from 'lucide-react';

const envelopes = [
  {
    id: '1',
    document: 'Partnership Agreement - Acme Corp',
    recipients: ['john@acme.com', 'sarah@acme.com'],
    status: 'Pending',
    sent: '2 days ago',
    signed: 1,
    total: 2,
  },
  {
    id: '2',
    document: 'Employment Agreement - Jane Doe',
    recipients: ['jane.doe@email.com'],
    status: 'Completed',
    sent: '1 week ago',
    signed: 1,
    total: 1,
  },
  {
    id: '3',
    document: 'NDA - CloudSystems Vendor',
    recipients: ['legal@cloudsystems.com'],
    status: 'Pending',
    sent: '3 days ago',
    signed: 0,
    total: 1,
  },
  {
    id: '4',
    document: 'Sales Agreement - TechStart Inc',
    recipients: ['ceo@techstart.com', 'legal@techstart.com'],
    status: 'Completed',
    sent: '2 weeks ago',
    signed: 2,
    total: 2,
  },
  {
    id: '5',
    document: 'Consulting Agreement - Mike Johnson',
    recipients: ['mike.johnson@consultant.com'],
    status: 'Expired',
    sent: '1 month ago',
    signed: 0,
    total: 1,
  },
];

const statusConfig: Record<string, { color: string; icon: any }> = {
  Pending: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100', icon: Clock },
  Completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', icon: CheckCircle2 },
  Expired: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', icon: AlertCircle },
};

export default function SignaturesPage() {
  const pendingCount = envelopes.filter((e) => e.status === 'Pending').length;
  const completedCount = envelopes.filter((e) => e.status === 'Completed').length;

  return (
    <AppShell monoContext="/signatures">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Signatures</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage document signature requests
            </p>
          </div>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Send for Signature
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3d</div>
              <p className="text-xs text-muted-foreground mt-1">30% faster than baseline</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Signature Requests</CardTitle>
            <CardDescription>
              All documents sent for signature via Documenso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envelopes.map((envelope) => {
                  const StatusIcon = statusConfig[envelope.status]?.icon || Clock;
                  return (
                    <TableRow key={envelope.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileSignature className="h-4 w-4 text-muted-foreground" />
                          {envelope.document}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {envelope.recipients.map((recipient, i) => (
                            <span key={i} className="text-sm text-muted-foreground">
                              {recipient}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusConfig[envelope.status]?.color || ''}
                          variant="secondary"
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {envelope.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${(envelope.signed / envelope.total) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {envelope.signed}/{envelope.total}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{envelope.sent}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {envelope.status === 'Completed' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {envelope.status === 'Pending' && (
                            <Button variant="outline" size="sm">
                              Remind
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
