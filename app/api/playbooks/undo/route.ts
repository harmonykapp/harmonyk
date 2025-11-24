// Week 7 Day 4: minimal /api/playbooks/undo implementation
// This defines the SHAPE of undo operations.
// For now it:
//  - Validates the run_id
//  - Looks up the run + steps
//  - Returns a clear "not yet implemented" response
//
// Later we can:
//  - Inspect playbook_steps.output_json for side-effect IDs (share links, signatures, tags)
//  - Reverse those side effects (e.g., delete share link, cancel signature envelope)

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type PlaybookRunRow = {
  id: string;
  playbook_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  stats_json: unknown;
};

type PlaybookStepRow = {
  id: string;
  run_id: string;
  step_idx: number;
  type: string;
  input_json: unknown;
  output_json: unknown;
  status: string;
};

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      `SUPABASE_CONFIG_ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. urlSet=${Boolean(
        url,
      )}, serviceKeySet=${Boolean(serviceKey)}`,
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
        run_id?: string;
      }
      | null;

    const runId = body?.run_id;

    if (!runId) {
      return NextResponse.json(
        { ok: false, message: 'run_id is required' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // 1) Look up the run
    const { data: run, error: runError } = await supabase
      .from('playbook_runs')
      .select(
        'id, playbook_id, status, started_at, completed_at, stats_json',
      )
      .eq('id', runId)
      .single();

    if (runError || !run) {
      console.error('Undo: failed to load playbook_run', runError);
      return NextResponse.json(
        { ok: false, message: 'Playbook run not found' },
        { status: 404 },
      );
    }

    // 2) Load steps for that run (we'll inspect these later when real undo is added)
    const { data: steps, error: stepsError } = await supabase
      .from('playbook_steps')
      .select(
        'id, run_id, step_idx, type, input_json, output_json, status',
      )
      .eq('run_id', run.id)
      .order('step_idx', { ascending: true });

    if (stepsError) {
      console.error('Undo: failed to load playbook_steps', stepsError);
      return NextResponse.json(
        {
          ok: false,
          message: 'Failed to load steps for the given run.',
        },
        { status: 500 },
      );
    }

    const typedRun = run as PlaybookRunRow;
    const typedSteps = (steps ?? []) as PlaybookStepRow[];

    // 3) For now, we do not perform destructive actions.
    //    We return a 501 with enough context so a human can see what would be undone.

    return NextResponse.json(
      {
        ok: false,
        message:
          'Undo is not implemented yet for this playbook. This endpoint is a scaffold and will be wired to reverse side effects later in Week 7.',
        run: {
          id: typedRun.id,
          playbook_id: typedRun.playbook_id,
          status: typedRun.status,
          started_at: typedRun.started_at,
          completed_at: typedRun.completed_at,
          stats_json: typedRun.stats_json,
        },
        steps: typedSteps.map((s) => ({
          id: s.id,
          step_idx: s.step_idx,
          type: s.type,
          status: s.status,
          output_json: s.output_json,
        })),
      },
      { status: 501 },
    );
  } catch (error) {
    console.error('Error in /api/playbooks/undo:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Unexpected error in /api/playbooks/undo.',
      },
      { status: 500 },
    );
  }
}
