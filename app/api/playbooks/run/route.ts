// Week 7 Day 2: real executor for /api/playbooks/run
// - Loads playbook from Supabase
// - Executes definition_json deterministically (dry-run or live)
// - Logs playbook_runs + playbook_steps
// NOTE: Actions are currently "simulated" (no real Save→Vault/Share/Sign yet).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  PlaybookDefinition,
  PlaybookRunStats,
  PlaybookStep as PlaybookStepDef,
} from '@/lib/playbooks/types';

type ExecutionMode = 'dry_run' | 'live';

interface ExecuteStepResult {
  idx: number;
  type: PlaybookStepDef['type'];
  kind: string;
  status: 'completed' | 'failed' | 'skipped';
  note?: string;
}

interface ExecuteResult {
  steps: ExecuteStepResult[];
  stats: PlaybookRunStats;
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase URL or service role key missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.',
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}

function executeDefinition(
  definition: PlaybookDefinition,
  mode: ExecutionMode,
): ExecuteResult {
  const steps: ExecuteStepResult[] = [];

  let totalSteps = 0;
  let completedSteps = 0;
  let failedSteps = 0;
  let actionCount = 0;

  for (const step of definition.steps || []) {
    totalSteps += 1;

    const base: ExecuteStepResult = {
      idx: step.idx,
      type: step.type,
      kind: step.kind,
      status: 'completed',
    };

    switch (step.type) {
      case 'condition': {
        // For now we just record that the condition would be evaluated.
        steps.push({
          ...base,
          note:
            'Condition evaluated (stub). Real condition logic to be implemented later.',
        });
        completedSteps += 1;
        break;
      }
      case 'action': {
        actionCount += 1;
        steps.push({
          ...base,
          note:
            mode === 'dry_run'
              ? 'Action simulated (dry-run). No side effects executed.'
              : 'Action executed (stub). Hook into real side effects in later tasks.',
        });
        completedSteps += 1;
        break;
      }
      case 'wait': {
        steps.push({
          ...base,
          note:
            'Wait step acknowledged. Actual delay/backoff handled by scheduler in later iteration.',
        });
        completedSteps += 1;
        break;
      }
      case 'retry': {
        steps.push({
          ...base,
          note:
            'Retry policy recorded. Actual retry mechanics handled by scheduler in later iteration.',
        });
        completedSteps += 1;
        break;
      }
      case 'trigger':
      default: {
        steps.push({
          ...base,
          note: 'Trigger/other step recorded.',
        });
        completedSteps += 1;
        break;
      }
    }
  }

  // Rough time-saved estimate: 60s per action for now.
  const timeSavedSeconds = actionCount * 60;

  const stats: PlaybookRunStats = {
    totalSteps,
    completedSteps,
    failedSteps,
    timeSavedSeconds,
  };

  return { steps, stats };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      playbook_id?: string;
      scope?: unknown;
      dryRun?: boolean;
    };

    if (!body.playbook_id) {
      return NextResponse.json(
        { ok: false, message: 'playbook_id is required' },
        { status: 400 },
      );
    }

    const mode: ExecutionMode = body.dryRun ? 'dry_run' : 'live';
    const supabase = getSupabaseServerClient();

    // 1) Load the playbook definition.
    const { data: playbook, error: playbookError } = await supabase
      .from('playbooks')
      .select(
        'id, owner_id, name, status, scope_json, definition_json, created_at, updated_at',
      )
      .eq('id', body.playbook_id)
      .single();

    if (playbookError || !playbook) {
      console.error('Failed to load playbook:', playbookError);
      return NextResponse.json(
        { ok: false, message: 'Playbook not found' },
        { status: 404 },
      );
    }

    const definition = (playbook.definition_json ||
      {}) as PlaybookDefinition;

    // 2) Insert initial run row.
    const initialStatus = mode === 'dry_run' ? 'dry_run' : 'started';

    const { data: run, error: runError } = await supabase
      .from('playbook_runs')
      .insert({
        playbook_id: playbook.id,
        status: initialStatus,
        stats_json: {},
      })
      .select('id, started_at')
      .single();

    if (runError || !run) {
      console.error('Failed to create playbook_run:', runError);
      return NextResponse.json(
        { ok: false, message: 'Failed to create playbook run' },
        { status: 500 },
      );
    }

    // 3) Execute definition (in-memory) and build stats.
    const { steps, stats } = executeDefinition(definition, mode);

    // 4) Write step rows.
    if (steps.length > 0) {
      const stepRows = steps.map((step) => ({
        run_id: run.id,
        step_idx: step.idx,
        type: step.type,
        input_json: {}, // Placeholder for now; later: actual inputs per step.
        output_json: {
          kind: step.kind,
          note: step.note,
          mode,
        },
        status: step.status,
      }));

      const { error: stepsError } = await supabase
        .from('playbook_steps')
        .insert(stepRows);

      if (stepsError) {
        console.error('Failed to insert playbook_steps:', stepsError);
      }
    }

    // 5) Finalize run row with stats.
    const finalStatus = mode === 'dry_run' ? 'dry_run' : 'completed';

    const { error: updateError } = await supabase
      .from('playbook_runs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        stats_json: stats,
      })
      .eq('id', run.id);

    if (updateError) {
      console.error('Failed to update playbook_run stats:', updateError);
    }

    // TODO (later in Week 7): insert ActivityLog events playbook_run_started/completed.

    return NextResponse.json(
      {
        ok: true,
        mode,
        runId: run.id,
        stats,
        steps,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in /api/playbooks/run:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Unexpected error in /api/playbooks/run.',
      },
      { status: 500 },
    );
  }
}
