// Week 7 Day 3: Playbooks list + detail UI (client-side)
// - Gated by NEXT_PUBLIC_FEATURE_PLAYBOOKS_V1
// - Left: list of playbooks
// - Right: detail panel with status, scope, last runs, and Run button

'use client';

import { RunPlaybookOnSelectionButton } from '@/components/playbooks/RunPlaybookOnSelectionButton';
import type { PlaybookDefinition } from '@/lib/playbooks/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

const PLAYBOOKS_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_PLAYBOOKS_V1 === 'true';

type PlaybookRow = {
  id: string;
  name: string;
  status: string;
  scope_json: unknown;
  definition_json: PlaybookDefinition | null;
  created_at: string;
  updated_at: string;
};

type PlaybookRunRow = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  stats_json: {
    totalSteps?: number;
    completedSteps?: number;
    failedSteps?: number;
    timeSavedSeconds?: number;
  } | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function formatTimeSaved(run: PlaybookRunRow) {
  const seconds = run.stats_json?.timeSavedSeconds ?? 0;
  if (!seconds) return '—';
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return '<1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}

function prettyScope(scope: unknown) {
  try {
    return JSON.stringify(scope ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

async function togglePlaybookStatus(playbookId: string, nextStatus: string) {
  const res = await fetch('/api/playbooks/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playbook_id: playbookId,
      status: nextStatus,
    }),
  });

  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; message?: string }
    | null;

  if (!res.ok || !data?.ok) {
    throw new Error(data?.message ?? `Failed to update status (${res.status})`);
  }
}

function PlaybooksPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [playbooks, setPlaybooks] = useState<PlaybookRow[]>([]);
  const [runs, setRuns] = useState<PlaybookRunRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIdFromUrl = searchParams.get('id') ?? undefined;

  const selectedId = useMemo(() => {
    if (selectedIdFromUrl && playbooks.some((p) => p.id === selectedIdFromUrl)) {
      return selectedIdFromUrl;
    }
    return playbooks[0]?.id;
  }, [selectedIdFromUrl, playbooks]);

  const selected =
    selectedId != null
      ? playbooks.find((p) => p.id === selectedId) ?? null
      : null;

  // Load playbooks
  useEffect(() => {
    if (!PLAYBOOKS_ENABLED) return;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/playbooks/all');
        const data = (await res.json().catch(() => null)) as
          | { ok: boolean; message?: string; items?: PlaybookRow[] }
          | null;

        if (!res.ok || !data?.ok) {
          const errorMessage =
            data?.message ??
            `Failed to load playbooks${res.status ? ` (${res.status})` : ''}`;
          throw new Error(errorMessage);
        }

        if (!data.items) {
          throw new Error('Invalid response format from playbooks API');
        }

        setPlaybooks(data.items);
      } catch (err) {
        console.error('Failed to load playbooks (client):', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load playbooks.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const reloadRuns = useCallback(async () => {
    if (!selectedId) {
      setRuns([]);
      return;
    }

    try {
      const res = await fetch(`/api/playbooks/runs?playbook_id=${selectedId}`);
      if (!res.ok) {
        setRuns([]);
        return;
      }

      const data = (await res.json()) as {
        ok: boolean;
        items: PlaybookRunRow[];
      };

      if (!data.ok) {
        setRuns([]);
        return;
      }

      setRuns(data.items);
    } catch (err) {
      console.error('Failed to load playbook runs (client):', err);
      setRuns([]);
    }
  }, [selectedId]);

  // Initial + on-change runs load
  useEffect(() => {
    void reloadRuns();
  }, [reloadRuns]);

  useEffect(() => {
    // Keep URL in sync with selected playbook (first one, if none provided).
    if (!selectedId || !PLAYBOOKS_ENABLED) return;
    if (selectedIdFromUrl === selectedId) return;

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('id', selectedId);
    router.replace(`/playbooks?${params.toString()}`);
  }, [selectedId, selectedIdFromUrl, searchParams, router]);

  if (!PLAYBOOKS_ENABLED) {
    return (
      <main className="p-8 space-y-3">
        <h1 className="text-2xl font-semibold">Playbooks</h1>
        <p className="text-sm text-neutral-600">
          Playbooks v1 is not enabled for this workspace.
        </p>
        <p className="text-xs text-neutral-500">
          Set <code className="font-mono">NEXT_PUBLIC_FEATURE_PLAYBOOKS_V1=true</code>{' '}
          in your environment to enable the Playbooks engine for internal testing.
        </p>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Playbooks</h1>
        <p className="text-sm text-neutral-600 max-w-xl">
          Deterministic workflows for your document flows. This is the Week 7
          Playbooks engine v1 UI: list, detail, dry-run, and basic run history.
        </p>
      </header>

      {/* Main layout */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)]">
        {/* List column */}
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-medium text-neutral-800">
              Playbook Library
            </h2>
            <p className="text-xs text-neutral-500">
              Seed library: Inbound NDA, Aging Proposals, Receipt→Vault (coming
              later this week).
            </p>
          </div>

          {isLoading ? (
            <div className="p-4 text-sm text-neutral-600">
              Loading playbooks…
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">
              {error}
            </div>
          ) : playbooks.length === 0 ? (
            <div className="p-4 text-sm text-neutral-600">
              No playbooks yet. They will appear here once created or seeded.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {playbooks.map((p) => {
                const isActive = p.id === selectedId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams(
                          Array.from(searchParams.entries()),
                        );
                        params.set('id', p.id);
                        router.replace(`/playbooks?${params.toString()}`);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${isActive
                        ? 'bg-violet-50 text-neutral-900'
                        : 'hover:bg-neutral-50 text-neutral-800'
                        }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-xs text-neutral-500">
                          Created {formatDate(p.created_at)}
                        </span>
                      </div>
                      <span
                        className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${p.status === 'enabled'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.status === 'disabled'
                            ? 'bg-neutral-100 text-neutral-600'
                            : 'bg-amber-50 text-amber-700'
                          }`}
                      >
                        {p.status}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detail column */}
        <div className="space-y-4">
          {!selected ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
              Select a playbook on the left to see details, runs, and dry-run
              options.
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">
                      {selected.name}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Status: <span className="font-medium">{selected.status}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RunPlaybookOnSelectionButton
                      playbookId={selected.id}
                      defaultMode="dry-run"
                      onRunCompleted={reloadRuns}
                    />
                    <PlaybookStatusToggle
                      playbookId={selected.id}
                      status={selected.status}
                      onStatusChanged={(nextStatus) => {
                        setPlaybooks((prev) =>
                          prev.map((p) =>
                            p.id === selected.id ? { ...p, status: nextStatus } : p,
                          ),
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-neutral-700">
                      Scope (read-only v1)
                    </p>
                    <pre className="max-h-40 overflow-auto rounded-md bg-neutral-50 p-2 text-[11px] font-mono text-neutral-700">
                      {prettyScope(selected.scope_json)}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-neutral-700">
                      Last 5 runs
                    </p>
                    {runs.length === 0 ? (
                      <p className="text-xs text-neutral-500">
                        No runs yet. Use <span className="font-mono">Run Playbook</span>{' '}
                        to dry-run this definition.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {runs.map((run) => (
                          <li
                            key={run.id}
                            className="flex items-center justify-between rounded-md bg-neutral-50 px-2 py-1.5 text-[11px]"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {run.status.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                {formatDate(run.started_at)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] text-neutral-500">
                                Time saved
                              </span>
                              <span className="text-[11px] font-semibold">
                                {formatTimeSaved(run)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-[11px] text-neutral-600">
                <p>
                  Steps and branching remain read-only for v1. This week focuses on
                  deterministic execution, dry-run guardrails, and logging. Editor
                  UX, branching, and seed library wiring land in later Week 7 days.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-4">
          <PlaybookEventTester />
        </div>
      )}
    </main>
  );
}

export default function PlaybooksPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8 space-y-4">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Playbooks</h1>
            <p className="text-sm text-neutral-600 max-w-xl">
              Loading...
            </p>
          </header>
        </main>
      }
    >
      <PlaybooksPageContent />
    </Suspense>
  );
}

interface PlaybookStatusToggleProps {
  playbookId: string;
  status: string;
  onStatusChanged: (status: 'enabled' | 'disabled' | 'draft') => void;
}

function PlaybookStatusToggle({
  playbookId,
  status,
  onStatusChanged,
}: PlaybookStatusToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus: 'enabled' | 'disabled' =
    status === 'enabled' ? 'disabled' : 'enabled';

  const handleClick = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      await togglePlaybookStatus(playbookId, nextStatus);
      onStatusChanged(nextStatus);
    } catch (err) {
      console.error('Failed to toggle playbook status:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to update playbook status.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isUpdating}
        className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUpdating ? 'Updating…' : nextStatus === 'enabled' ? 'Enable' : 'Disable'}
      </button>
      {error && (
        <p className="max-w-xs text-right text-[10px] text-red-600">{error}</p>
      )}
    </div>
  );
}

// Dev-only helper card to exercise queuePlaybooksForEvent via /api/dev/playbooks/test-event.
function PlaybookEventTester() {
  const [eventType, setEventType] = useState<"share_link_created" | "signature_completed">(
    "share_link_created",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/dev/playbooks/test-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: eventType,
          payload:
            eventType === "share_link_created"
              ? {
                share_id: "dev-share-id",
                document_id: "dev-document-id",
                owner_id: "dev-owner-id",
              }
              : {
                envelope_id: "dev-envelope-id",
                signer_email: "dev@example.com",
              },
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string | null; count?: number }
        | null;

      if (!res.ok || !data?.ok) {
        const msg =
          data?.message ?? `Test event failed with status ${res.status}`;
        setError(msg);
        return;
      }

      setMessage(
        `Event sent. Enabled playbooks seen: ${data.count ?? 0}. ${data.message ?? ""}`,
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error during test.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-xs text-neutral-700">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold">Dev: Test Playbook Event</div>
          <div className="text-[11px] text-neutral-500">
            Sends a fake event into queuePlaybooksForEvent via
            /api/dev/playbooks/test-event. Dev-only.
          </div>
        </div>
        <span className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700">
          Dev only
        </span>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-[11px]"
          value={eventType}
          onChange={(e) =>
            setEventType(e.target.value as "share_link_created" | "signature_completed")
          }
          disabled={isSubmitting}
        >
          <option value="share_link_created">share_link_created</option>
          <option value="signature_completed">signature_completed</option>
        </select>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send test event"}
        </button>
      </div>
      {message && (
        <div className="mt-2 text-[11px] text-green-700">{message}</div>
      )}
      {error && (
        <div className="mt-2 text-[11px] text-red-700">{error}</div>
      )}
    </div>
  );
}
