'use client';

import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Search,
  Folder,
  Star,
  Clock,
  Users,
  FileSignature,
  Archive,
  ChevronRight,
  MoreVertical,
  Upload,
  Download,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const folders = [
  { icon: Star, label: 'Starred', count: 8, color: 'text-yellow-600' },
  { icon: Clock, label: 'Recent', count: 24, color: 'text-blue-600' },
  { icon: Users, label: 'Shared with me', count: 12, color: 'text-green-600' },
  { icon: FileSignature, label: 'Signed Documents', count: 34, color: 'text-purple-600' },
  { icon: Archive, label: 'Archived', count: 156, color: 'text-gray-600' },
];

const documents = [
  {
    id: '1',
    name: 'Partnership Agreement - Acme Corp',
    type: 'PDF',
    size: '2.4 MB',
    modified: '2 hours ago',
    versions: 3,
    tags: ['Contract', 'Active'],
  },
  {
    id: '2',
    name: 'Employee Handbook 2024',
    type: 'PDF',
    size: '5.1 MB',
    modified: '1 day ago',
    versions: 7,
    tags: ['Policy', 'HR'],
  },
  {
    id: '3',
    name: 'Q4 Financial Report',
    type: 'PDF',
    size: '1.8 MB',
    modified: '3 days ago',
    versions: 2,
    tags: ['Finance', 'Report'],
  },
  {
    id: '4',
    name: 'Product Roadmap 2024',
    type: 'PDF',
    size: '3.2 MB',
    modified: '5 days ago',
    versions: 5,
    tags: ['Product', 'Strategy'],
  },
  {
    id: '5',
    name: 'NDA - CloudSystems',
    type: 'PDF',
    size: '890 KB',
    modified: '1 week ago',
    versions: 2,
    tags: ['Contract', 'Signed'],
  },
  {
    id: '6',
    name: 'Sales Proposal - TechStart',
    type: 'PDF',
    size: '2.1 MB',
    modified: '2 weeks ago',
    versions: 4,
    tags: ['Sales', 'Proposal'],
  },
];

export default function VaultPage() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDocument = documents.find((doc) => doc.id === selectedDoc);

  return (
    <AppShell monoContext="vault">
      <div className="h-full flex">
        <div className="w-64 border-r bg-sidebar overflow-auto">
          <div className="p-4 border-b">
            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>

          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-1">
              {folders.map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.label}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-active/50 transition-colors text-sm"
                  >
                    <Icon className={`h-4 w-4 ${folder.color}`} />
                    <span className="flex-1 text-left">{folder.label}</span>
                    <span className="text-xs text-muted-foreground">{folder.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Folders
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  +
                </Button>
              </div>
              <div className="space-y-1">
                {['Contracts', 'HR Documents', 'Financial', 'Marketing', 'Legal'].map((folder) => (
                  <button
                    key={folder}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-active/50 transition-colors text-sm"
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-left">{folder}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">All Documents</h1>
                <p className="text-muted-foreground mt-1">
                  {documents.length} documents
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Grid View
                </Button>
                <Button variant="outline" size="sm">
                  List View
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className={cn('flex-1 overflow-auto p-6', selectedDoc && 'max-w-[60%]')}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className={cn(
                      'p-4 cursor-pointer transition-all hover:shadow-md',
                      selectedDoc === doc.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => setSelectedDoc(doc.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                            {doc.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {doc.type} · {doc.size}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>{doc.modified}</span>
                        <span>{doc.versions} versions</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {selectedDocument && (
              <div className="w-[40%] border-l bg-card overflow-auto">
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="space-y-1 flex-1">
                        <h2 className="text-xl font-semibold">{selectedDocument.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedDocument.type} · {selectedDocument.size}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDoc(null)}
                      >
                        ×
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedDocument.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Last Modified</span>
                        <p className="text-muted-foreground mt-1">
                          {selectedDocument.modified}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Versions</span>
                        <p className="text-muted-foreground mt-1">
                          {selectedDocument.versions} versions available
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-3">Version History</h3>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {[
                          { version: 'v3', date: '2 hours ago', author: 'You', changes: 'Updated terms in section 4' },
                          { version: 'v2', date: '2 days ago', author: 'Sarah Chen', changes: 'Legal review comments' },
                          { version: 'v1', date: '1 week ago', author: 'You', changes: 'Initial draft' },
                        ].map((version) => (
                          <div key={version.version} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                              {version.version}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{version.author}</span>
                                <span className="text-xs text-muted-foreground">
                                  {version.date}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {version.changes}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="border-t pt-6 space-y-2">
                    <h3 className="font-medium mb-3">Actions</h3>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      Add to Starred
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Archive className="h-4 w-4 mr-2" />
                      Move to Archive
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
