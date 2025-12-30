"use client";

import { MonoLite } from "@/components/mono/mono-lite";
import useScrollEvents from "@/components/share/useScrollEvents";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

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

    try {
      const res = await fetch(`/api/shares/render?id=${encodeURIComponent(shareId)}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        setState({ status: "passcode" });
        return;
      }

      if (!res.ok) {
        if (res.status === 404) {
          setState({ status: "error", error: "invalid" });
          return;
        }
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || `Render failed (${res.status})`);
      }

      const data = (await res.json()) as ShareResponse;
      if (!data?.html) {
        setState({ status: "error", error: "invalid" });
        return;
      }
      setState({ status: "ready", title: data.title, html: data.html });
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load share.",
      });
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
      return <p className="text-sm text-neutral-500">Loading share…</p>;
    }

    if (state.status === "error") {
      if (state.error === "invalid") {
        return (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="mb-2 text-2xl font-semibold">This share link is invalid or expired.</h1>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              The document may have been deleted or the link has expired.
            </p>
            <Link
              href="/vault"
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Back to Vault
            </Link>
          </div>
        );
      }
      return (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      );
    }

    if (state.status === "passcode") {
      return (
        <form onSubmit={handleSubmitPasscode} className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="share-passcode">
              Passcode required
            </label>
            <input
              id="share-passcode"
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Enter passcode"
              disabled={isSubmittingPasscode}
            />
          </div>
          {passcodeError ? <p className="text-sm text-red-600">{passcodeError}</p> : null}
          <button
            type="submit"
            disabled={isSubmittingPasscode}
            className="inline-flex items-center justify-center rounded bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {isSubmittingPasscode ? "Unlocking…" : "Unlock"}
          </button>
        </form>
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
