'use client';

// Week 7 Day 3: RunPlaybookOnSelectionButton
// - Calls /api/playbooks/run with the given playbookId
// - Supports dry-run vs live mode
// - Notifies parent via onRunCompleted so it can refresh run history

import { useState } from 'react';

type RunMode = 'dry-run' | 'live';

export interface RunPlaybookOnSelectionButtonProps {
  playbookId?: string;
  defaultMode?: RunMode;
  onRunCompleted?: () => void;
}

export function RunPlaybookOnSelectionButton(
  props: RunPlaybookOnSelectionButtonProps,
) {
  const { playbookId, defaultMode = 'dry-run', onRunCompleted } = props;
  const [mode, setMode] = useState<RunMode>(defaultMode);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  const handleClick = async () => {
    if (!playbookId) {
      setError('No playbook selected.');
      return;
    }

    try {
      setIsPending(true);
      setError(null);

      const res = await fetch('/api/playbooks/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playbook_id: playbookId,
          scope: {}, // selection scope will be wired later in Week 7
          dryRun: mode === 'dry-run',
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
          ok?: boolean;
          message?: string;
          mode?: string;
          runId?: string;
        }
        | null;

      console.log('[Playbooks] Run result', {
        status: res.status,
        data,
      });

      if (res.ok && data?.ok) {
        setLastStatus(`${data.mode ?? mode} · runId=${data.runId ?? '—'}`);
        if (onRunCompleted) {
          onRunCompleted();
        }
      }

      if (!res.ok || !data?.ok) {
        setError(data?.message ?? `Run failed with status ${res.status}`);
        setLastStatus(null);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending || !playbookId}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <span>Running…</span>
          ) : (
            <>
              <span>Run Playbook</span>
              <span className="rounded bg-neutral-100 px-1 py-0.5 text-[10px] uppercase tracking-wide">
                {mode === 'dry-run' ? 'Dry-run' : 'Live'}
              </span>
            </>
          )}
        </button>
        <select
          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-[11px] text-neutral-700"
          value={mode}
          onChange={(e) => setMode(e.target.value as RunMode)}
          disabled={isPending}
        >
          <option value="dry-run">Dry-run</option>
          <option value="live">Live</option>
        </select>
      </div>
      {error && (
        <p className="text-[10px] text-red-600 max-w-xs text-right">
          {error}
        </p>
      )}
      {lastStatus && !error && (
        <p className="text-[10px] text-neutral-500 max-w-xs text-right">
          Last run: {lastStatus}
        </p>
      )}
    </div>
  );
}
