// Week 7 Day 3: GET /api/playbooks/runs?playbook_id=...
// Returns last 5 runs for a given playbook.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const playbookId = url.searchParams.get('playbook_id');

    if (!playbookId) {
      return NextResponse.json(
        { ok: false, message: 'playbook_id is required' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('playbook_runs')
      .select('id, status, started_at, completed_at, stats_json')
      .eq('playbook_id', playbookId)
      .order('started_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching playbook runs (api):', error);
      return NextResponse.json(
        { ok: false, message: 'Failed to load playbook runs' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        items: (data ?? []) as PlaybookRunRow[],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/playbooks/runs:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Unexpected error loading playbook runs.',
      },
      { status: 500 },
    );
  }
}

