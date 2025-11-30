"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSignature, Send, CheckCircle2, Clock, AlertCircle, Eye, Download } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function SignaturesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendForSignature() {
    setIsLoading(true);
    try {
      // For now, redirect to workbench where users can actually send documents
      toast({
        title: "Send documents for signature",
        description: "Select a document from Workbench or Vault to send for signature.",
        duration: 5000,
      });
      router.push("/workbench");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open signature flow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Signatures</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Track and manage document signature requests
          </p>
        </div>
        <Button onClick={handleSendForSignature} disabled={isLoading} className="w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? "Loading..." : "Send for Signature"}
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg. Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">No data yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">No data yet</p>
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
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSignature className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">No signature requests yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md">
              Send documents for signature from the Workbench or Vault pages. Select a document and click "Send for Signature" to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Link href="/workbench" className="w-full sm:w-auto">
                <Button variant="default" className="w-full sm:w-auto">
                  Go to Workbench
                </Button>
              </Link>
              <Link href="/vault" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  Go to Vault
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

