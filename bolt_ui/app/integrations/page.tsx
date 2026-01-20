import { AppShell } from '@/components/shell/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Check, Plus } from 'lucide-react';

const connectedIntegrations = [
  {
    name: 'Google Drive',
    description: 'Access and sync files from Google Drive',
    category: 'Storage',
    status: 'connected',
    accounts: 2,
    lastSync: '2 minutes ago',
  },
  {
    name: 'Gmail',
    description: 'Import attachments and email documents',
    category: 'Email',
    status: 'connected',
    accounts: 1,
    lastSync: '5 minutes ago',
  },
  {
    name: 'Google Docs',
    description: 'Edit and create documents in Google Docs',
    category: 'Documents',
    status: 'connected',
    accounts: 1,
    lastSync: '10 minutes ago',
  },
  {
    name: 'Slack',
    description: 'Share documents and get notifications in Slack',
    category: 'Communication',
    status: 'connected',
    accounts: 1,
    lastSync: '1 hour ago',
  },
];

const availableIntegrations = [
  {
    name: 'Microsoft OneDrive',
    description: 'Connect to Microsoft OneDrive for file storage',
    category: 'Storage',
  },
  {
    name: 'Dropbox',
    description: 'Sync files with Dropbox',
    category: 'Storage',
  },
  {
    name: 'Notion',
    description: 'Import and sync Notion pages',
    category: 'Documents',
  },
  {
    name: 'Outlook',
    description: 'Access Outlook email attachments',
    category: 'Email',
  },
  {
    name: 'Box',
    description: 'Enterprise file storage and collaboration',
    category: 'Storage',
  },
  {
    name: 'Salesforce',
    description: 'Sync documents with Salesforce records',
    category: 'CRM',
  },
  {
    name: 'HubSpot',
    description: 'Integrate with HubSpot CRM',
    category: 'CRM',
  },
  {
    name: 'Asana',
    description: 'Link documents to Asana tasks',
    category: 'Project Management',
  },
];

export default function IntegrationsPage() {
  return (
    <AppShell monoContext="/integrations">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect your favorite tools and services to Harmonyk
            </p>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search integrations..." className="pl-9" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedIntegrations.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active integrations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connectedIntegrations.reduce((sum, int) => sum + int.accounts, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all services</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Documents Synced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2m</div>
              <p className="text-xs text-muted-foreground mt-1">All systems active</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connected Integrations</CardTitle>
            <CardDescription>
              Manage your active connections and sync settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {connectedIntegrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{integration.name}</h3>
                      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        <Check className="h-3 w-3" />
                        Connected
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {integration.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{integration.accounts} account(s)</span>
                      <span>•</span>
                      <span>Last synced {integration.lastSync}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                    <Button variant="ghost" size="sm">
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Integrations</CardTitle>
            <CardDescription>
              Connect more services to expand your workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableIntegrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {integration.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {integration.category}
                    </Badge>
                  </div>
                  <Button size="sm" className="ml-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
