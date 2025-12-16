import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  FileText,
  Search,
  Plus,
  Clock,
} from 'lucide-react';

export default function DraftsPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Heading + tagline */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-4 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Drafts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your saved document drafts ready for editing and completion.
          </p>
        </div>
      </div>

      {/* Top tabs (My Files / My Drafts) — second tab links to drafts page */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <Link
            href="/vault"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            My Files
          </Link>
          <Link
            href="/builder/draft"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-foreground shadow-sm"
          >
            My Drafts
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Drafts</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Your saved document drafts
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Draft
          </Button>
        </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search drafts..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Drafts</CardTitle>
          <CardDescription>
            Documents you've started but haven't completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No drafts yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating a document in the Builder to save drafts here.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Draft
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
