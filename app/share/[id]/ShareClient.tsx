"use client";

import { MonoLite } from "@/components/mono/mono-lite";
import useScrollEvents from "@/components/share/useScrollEvents";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

// PGW10 Day 1 (baseline types only):
// Share currently renders HTML returned by /api/shares/render (no PDF viewer yet).
// These minimal types define the future PDF anchor model for pinned comments (Days 2–5).
// Anchors are PDF-artifact based (no doc-type branching).
type PdfAnchor = {
  page: number;
  // Normalized coordinates in [0..1] relative to the rendered PDF page box.
  x: number;
  y: number;
  // Optional normalized region anchor (selection rectangle) in [0..1].
  w?: number;
  h?: number;
};

type PinnedCommentDraft = {
  id: string;
  anchor: PdfAnchor;
  text: string;
  // Local-only timestamp placeholder for Day 1; persistence comes later.
  createdAt: string;
};

type ShareResponse = {
  title: string;
  html: string;
  docId: string;
  requiresPasscode: boolean;
};

type State =
  | { status: "loading" }
  | { status: "passcode" }
  | { status: "ready"; title: string; html: string }
  | { status: "error"; error: string };

type Props = {
  shareId: string;
  // PGW10 Day 1: plumbing placeholder (unused for now).
  // Day 2+ PDF viewer can call this when a user clicks a PDF canvas to propose an anchor.
  onPdfCanvasClick?: (anchor: PdfAnchor) => void;
  // PGW10 Day 1: optional draft placeholder (unused for now).
  pinnedCommentDraft?: PinnedCommentDraft | null;
};

export default function ShareClient({ shareId }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isSubmittingPasscode, setIsSubmittingPasscode] = useState(false);

  useScrollEvents({ shareId });

  const loadShare = useCallback(async () => {
    setState({ status: "loading" });
    setPasscodeError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`/api/shares/render?id=${encodeURIComponent(shareId)}`, {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });

      if (res.status === 401) {
        setState({ status: "passcode" });
        return;
      }

      if (res.status === 403) {
        setState({ status: "error", error: "blocked" });
        return;
      }

      if (!res.ok) {
        setState({ status: "error", error: "invalid" });
        return;
      }

      const data = (await res.json()) as ShareResponse;
      if (!data?.html) {
        setState({ status: "error", error: "invalid" });
        return;
      }
      setState({ status: "ready", title: data.title, html: data.html });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setState({ status: "error", error: "invalid" });
        return;
      }
      setState({ status: "error", error: "invalid" });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [shareId]);

  useEffect(() => {
    void loadShare();
  }, [loadShare]);

  const handleSubmitPasscode = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!passcode.trim()) {
        setPasscodeError("Passcode is required");
        return;
      }

      setIsSubmittingPasscode(true);
      setPasscodeError(null);
      try {
        const res = await fetch("/api/shares/passcode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: shareId, passcode }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || "Invalid passcode");
        }

        setPasscode("");
        await loadShare();
      } catch (error) {
        setPasscodeError(
          error instanceof Error ? error.message : "Could not validate passcode."
        );
      } finally {
        setIsSubmittingPasscode(false);
      }
    },
    [loadShare, passcode, shareId]
  );

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <div className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      );
    }

    if (state.status === "error") {
      const title =
        state.error === "blocked"
          ? "This share link is restricted."
          : "This share link is invalid or expired.";
      const description =
        state.error === "blocked"
          ? "You don't have permission to view this document."
          : "The document may have been deleted or the link has expired.";
      return (
        <EmptyState
          title={title}
          description={description}
          action={
            <Button asChild>
              <Link href="/share">Back to Share Hub</Link>
            </Button>
          }
        />
      );
    }

    if (state.status === "passcode") {
      return (
        <div className="max-w-md space-y-4 rounded-xl border border-border/60 bg-background p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Passcode required</h2>
            <p className="text-sm text-muted-foreground">
              Enter the passcode shared with you to view this document.
            </p>
          </div>
          <form onSubmit={handleSubmitPasscode} className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="share-passcode">
                Passcode
              </label>
              <input
                id="share-passcode"
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter passcode"
                disabled={isSubmittingPasscode}
              />
            </div>
            {passcodeError ? <p className="text-sm text-red-600">{passcodeError}</p> : null}
            <Button type="submit" disabled={isSubmittingPasscode}>
              {isSubmittingPasscode ? "Unlocking…" : "Unlock"}
            </Button>
          </form>
        </div>
      );
    }

    const { title, html } = state;
    return (
      <>
        <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
        <article
          className="prose prose-neutral dark:prose-invert max-w-none"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </>
    );
  }, [handleSubmitPasscode, isSubmittingPasscode, passcode, passcodeError, state]);

  return (
    <div className="min-h-screen w-full bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {state.status === "ready" ? null : <h1 className="mb-4 text-2xl font-semibold">Share</h1>}
        {content}
      </div>
      <MonoLite />
    </div>
  );
}
