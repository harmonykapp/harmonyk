'use client';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  Share2,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

const mockDocuments = [
  {
    id: '1',
    name: 'Q4 Partnership Agreement - Acme Corp',
    type: 'Contract',
    source: 'Google Drive',
    status: 'In Review',
    lastActivity: '2 hours ago',
    owner: 'Sarah Chen',
  },
  {
    id: '2',
    name: 'Employee Handbook 2024',
    type: 'Policy Document',
    source: 'Harmonyk',
    status: 'Draft',
    lastActivity: '5 hours ago',
    owner: 'Mike Johnson',
  },
  {
    id: '3',
    name: 'NDA - CloudSystems Vendor',
    type: 'NDA',
    source: 'Gmail',
    status: 'Signed',
    lastActivity: '1 day ago',
    owner: 'You',
  },
  {
    id: '4',
    name: 'Product Roadmap Q1 2024',
    type: 'Presentation',
    source: 'Google Slides',
    status: 'Published',
    lastActivity: '2 days ago',
    owner: 'Emily Rodriguez',
  },
  {
    id: '5',
    name: 'Sales Proposal - TechStart Inc',
    type: 'Proposal',
    source: 'Google Docs',
    status: 'Awaiting Signature',
    lastActivity: '3 days ago',
    owner: 'David Park',
  },
  {
    id: '6',
    name: 'Data Processing Agreement',
    type: 'Contract',
    source: 'Harmonyk',
    status: 'In Review',
    lastActivity: '4 days ago',
    owner: 'Lisa Wong',
  },
];

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  'In Review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'Awaiting Signature': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  Signed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  Published: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  Archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function WorkbenchPage() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDocument = mockDocuments.find((doc) => doc.id === selectedDoc);

  return (
    <AppShell monoContext="workbench">
      <div className="h-full flex flex-col">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Workbench</h1>
              <p className="text-muted-foreground mt-1">
                All your documents in one place
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="google">Google Drive</SelectItem>
                  <SelectItem value="monolyth">Harmonyk</SelectItem>
                  <SelectItem value="gmail">Gmail</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={cn('flex-1 overflow-auto', selectedDoc && 'max-w-[60%]')}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className={cn(
                      'cursor-pointer',
                      selectedDoc === doc.id && 'bg-accent'
                    )}
                    onClick={() => setSelectedDoc(doc.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.name}
                      </div>
                    </TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[doc.status] || ''} variant="secondary">
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.lastActivity}</TableCell>
                    <TableCell>{doc.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selectedDocument && (
            <div className="w-[40%] border-l bg-card overflow-auto">
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="space-y-1 flex-1">
                      <h2 className="text-xl font-semibold">{selectedDocument.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedDocument.type}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedDoc(null)}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Status</span>
                      <div className="mt-1">
                        <Badge className={statusColors[selectedDocument.status] || ''} variant="secondary">
                          {selectedDocument.status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Source</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedDocument.source}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Owner</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedDocument.owner}
                      </p>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Last Activity</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedDocument.lastActivity}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-mono" />
                    <h3 className="font-medium">AI Analysis</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      This document is a partnership agreement between your organization and Acme Corp.
                      It includes standard terms for revenue sharing, intellectual property rights, and
                      termination clauses.
                    </p>
                    <div className="space-y-2">
                      <p className="font-medium">Key Points:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>5-year term with auto-renewal</li>
                        <li>60/40 revenue split in your favor</li>
                        <li>90-day termination notice required</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Next Actions:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Legal review pending from Sarah Chen</li>
                        <li>Schedule approval meeting with stakeholders</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-2">
                  <h3 className="font-medium mb-3">Quick Actions</h3>
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Open Document
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze with Maestro
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Document
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
