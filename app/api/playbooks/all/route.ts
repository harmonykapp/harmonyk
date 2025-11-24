// Week 7 Day 3: GET /api/playbooks/all
// Returns the list of playbooks for the workspace.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { PlaybookDefinition } from '@/lib/playbooks/types';

type PlaybookRow = {
  id: string;
  name: string;
  status: string;
  scope_json: unknown;
  definition_json: PlaybookDefinition | null;
  created_at: string;
  updated_at: string;
};

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Make config issues painfully obvious.
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

export async function GET(_req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('playbooks')
      .select(
        'id, name, status, scope_json, definition_json, created_at, updated_at',
      )
      .order('created_at', { ascending: false });

    if (error) {
      // Surface full Supabase error details so we can see them in the UI.
      const msgParts = [
        'SUPABASE_QUERY_ERROR',
        error.message ?? '',
        error.details ?? '',
        error.code ? `code=${error.code}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      console.error('Error fetching playbooks (api):', error);

      return NextResponse.json(
        {
          ok: false,
          message: msgParts || 'SUPABASE_QUERY_ERROR: Failed to load playbooks',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        items: (data ?? []) as PlaybookRow[],
      },
      { status: 200 },
    );
  } catch (error) {
    // This will catch config errors and any other unexpected exceptions.
    console.error('Unexpected error in GET /api/playbooks/all:', error);

    let message = 'UNEXPECTED_ERROR: Failed to load playbooks.';
    if (error instanceof Error && error.message) {
      message = error.message;
    }

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
