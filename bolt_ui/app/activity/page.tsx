import { AppShell } from '@/components/shell/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FileText,
  Upload,
  Download,
  Share2,
  FileSignature,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

const activityFeed = [
  {
    id: '1',
    type: 'signature_completed',
    user: 'Sarah Chen',
    action: 'signed',
    target: 'Partnership Agreement - Acme Corp',
    time: '2 hours ago',
    icon: FileSignature,
    color: 'text-green-600',
  },
  {
    id: '2',
    type: 'document_uploaded',
    user: 'You',
    action: 'uploaded',
    target: 'Q4 Financial Report',
    time: '4 hours ago',
    icon: Upload,
    color: 'text-blue-600',
  },
  {
    id: '3',
    type: 'document_shared',
    user: 'Mike Johnson',
    action: 'shared',
    target: 'Product Roadmap 2024',
    time: '5 hours ago',
    icon: Share2,
    color: 'text-purple-600',
  },
  {
    id: '4',
    type: 'document_edited',
    user: 'You',
    action: 'edited',
    target: 'Employee Handbook 2024',
    time: '1 day ago',
    icon: Edit,
    color: 'text-orange-600',
  },
  {
    id: '5',
    type: 'document_viewed',
    user: 'Lisa Wong',
    action: 'viewed',
    target: 'Sales Proposal - TechStart Inc',
    time: '1 day ago',
    icon: Eye,
    color: 'text-gray-600',
  },
  {
    id: '6',
    type: 'signature_sent',
    user: 'David Park',
    action: 'sent for signature',
    target: 'NDA - CloudSystems Vendor',
    time: '2 days ago',
    icon: FileSignature,
    color: 'text-blue-600',
  },
  {
    id: '7',
    type: 'document_downloaded',
    user: 'Emily Rodriguez',
    action: 'downloaded',
    target: 'Data Processing Agreement',
    time: '3 days ago',
    icon: Download,
    color: 'text-teal-600',
  },
  {
    id: '8',
    type: 'document_deleted',
    user: 'You',
    action: 'deleted',
    target: 'Old Contract Draft v2',
    time: '4 days ago',
    icon: Trash2,
    color: 'text-red-600',
  },
];

export default function ActivityPage() {
  return (
    <AppShell monoContext="/activity">
      <div className="p-8 max-w-[1200px] mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground mt-1">
            Track all document and workflow activities
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground mt-1">+4 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground mt-1">In last 24 hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Documents Touched</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              All document and user activity across your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityFeed.map((activity) => {
                const Icon = activity.icon;
                const initials = activity.user
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{activity.user}</span>
                        <span className="text-sm text-muted-foreground">{activity.action}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{activity.target}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className={`h-3 w-3 ${activity.color}`} />
                        <span>{activity.time}</span>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
