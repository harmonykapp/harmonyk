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
import { Link2, Eye, Copy, Send, Trash2, BarChart3, Lock } from 'lucide-react';

const shareLinks = [
  {
    id: '1',
    document: 'Partnership Agreement - Acme Corp',
    permission: 'View & Sign',
    protection: 'Password',
    views: 12,
    lastViewed: '2 hours ago',
    created: '2 days ago',
    expires: '30 days',
  },
  {
    id: '2',
    document: 'Q4 Financial Report',
    permission: 'View Only',
    protection: 'Watermark',
    views: 24,
    lastViewed: '5 hours ago',
    created: '1 week ago',
    expires: '60 days',
  },
  {
    id: '3',
    document: 'Product Roadmap 2024',
    permission: 'View & Comment',
    protection: 'None',
    views: 45,
    lastViewed: '1 day ago',
    created: '2 weeks ago',
    expires: 'Never',
  },
];

export default function SharePage() {
  return (
    <AppShell monoContext="dashboard">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Share Center</h1>
            <p className="text-muted-foreground mt-1">
              Manage document sharing and track viewer activity
            </p>
          </div>
          <Button>
            <Link2 className="h-4 w-4 mr-2" />
            Create Share Link
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shareLinks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">+2 this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shareLinks.reduce((sum, link) => sum + link.views, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all links</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Protected Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shareLinks.filter((link) => link.protection !== 'None').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Password or watermark</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Guest Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">From shared links</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Share Links</CardTitle>
            <CardDescription>
              Manage and monitor your shared document links
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <TableCell className="font-medium">{link.document}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{link.permission}</Badge>
                    </TableCell>
                    <TableCell>
                      {link.protection !== 'None' ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          {link.protection}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        {link.views}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {link.lastViewed}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{link.expires}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
