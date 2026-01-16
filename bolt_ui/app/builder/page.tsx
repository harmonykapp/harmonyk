'use client';

import { AppShell } from '@/components/shell/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Eye,
  FileSignature,
  FileText,
  Save,
  Search,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

const templates = [
  {
    category: 'Core Operational Contracts',
    items: [
      { name: 'NDA - Mutual', description: 'Standard mutual NDA for protecting confidential information' },
      { name: 'NDA - One-Way', description: 'One-way NDA where only one party discloses confidential information' },
      { name: 'Employment Contract', description: 'Defines employment relationship, duties, compensation, and termination' },
      { name: 'Independent Contractor Agreement', description: 'Defines scope, payment, and independence of a freelance contractor' },
      { name: 'Service Agreement / MSA', description: 'Outlines terms for ongoing service delivery relationships' },
      { name: 'Consulting Agreement', description: 'Defines terms for hiring a consultant' },
    ],
  },
  {
    category: 'Commercial & Deal-Making',
    items: [
      { name: 'Sales Agreement', description: 'Terms for sale of goods or services' },
      { name: 'Purchase Order', description: 'Buyer\'s intent to purchase specific goods/services' },
      { name: 'Partnership Agreement', description: 'Defines collaboration between two or more parties' },
      { name: 'Joint Venture Agreement', description: 'Establishes a new business entity between parties' },
    ],
  },
  {
    category: 'Corporate & Finance',
    items: [
      { name: 'Operating Agreement (LLC)', description: 'Governs internal operations of an LLC' },
      { name: 'Shareholders Agreement', description: 'Rights and obligations of company shareholders' },
      { name: 'Convertible Note', description: 'Debt that converts to equity' },
      { name: 'SAFE Agreement', description: 'Simple Agreement for Future Equity' },
    ],
  },
];

export default function BuilderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppShell monoContext="builder">
      <div className="h-full flex">
        <div className="w-80 border-r bg-sidebar overflow-auto">
          <div className="p-4 border-b space-y-3">
            <h2 className="font-semibold">Templates</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-6">
              {templates.map((category) => (
                <div key={category.category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {category.category}
                  </h3>
                  <div className="space-y-1">
                    {category.items.map((template) => (
                      <button
                        key={template.name}
                        onClick={() => setSelectedTemplate(template.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTemplate === template.name
                            ? 'bg-sidebar-active text-primary'
                            : 'hover:bg-sidebar-active/50'
                          }`}
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {template.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedTemplate ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Start Building</h2>
                  <p className="text-muted-foreground">
                    Select a template from the sidebar to begin creating your document.
                    Maestro will help you draft, review, and refine the content.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-mono" />
                  <span>AI-assisted document generation</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      ← Back
                    </Button>
                    <div>
                      <Badge variant="outline">{selectedTemplate}</Badge>
                      <h1 className="text-2xl font-bold mt-2">New Document</h1>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button size="sm">
                      <FileSignature className="h-4 w-4 mr-2" />
                      Send for Signature
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-mono" />
                        AI-Assisted Generation
                      </CardTitle>
                      <CardDescription>
                        Describe what you need and Maestro will draft the document for you
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Example: Create an NDA between Acme Corp and my company for a partnership discussion about cloud infrastructure. Standard terms, mutual confidentiality, 2 year duration."
                        className="min-h-[120px]"
                      />
                      <Button className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Document
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Document Content</CardTitle>
                      <CardDescription>
                        Edit and refine your document
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Document Title
                        </label>
                        <Input
                          placeholder="Enter document title..."
                          value={documentTitle}
                          onChange={(e) => setDocumentTitle(e.target.value)}
                        />
                      </div>

                      <Tabs defaultValue="editor" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="editor">Editor</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="editor" className="space-y-4">
                          <div className="border rounded-lg p-6 bg-background min-h-[600px] font-mono text-sm">
                            <p className="text-muted-foreground italic">
                              Your document content will appear here after generation...
                            </p>
                          </div>
                        </TabsContent>
                        <TabsContent value="preview">
                          <div className="border rounded-lg p-8 bg-background min-h-[600px]">
                            <p className="text-muted-foreground italic text-center py-20">
                              Preview will appear here after generation...
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="justify-start">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Review & Tighten Language
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Add Missing Clauses
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Check for Legal Issues
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Simplify Complex Terms
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
