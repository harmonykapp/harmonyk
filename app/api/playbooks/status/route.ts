// Week 7 Day 3: POST /api/playbooks/status
// Toggle or set playbook status: draft / enabled / disabled.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type AllowedStatus = 'draft' | 'enabled' | 'disabled';

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
          playbook_id?: string;
          status?: string;
        }
      | null;

    const playbookId = body?.playbook_id;
    const status = body?.status as AllowedStatus | undefined;

    if (!playbookId) {
      return NextResponse.json(
        { ok: false, message: 'playbook_id is required' },
        { status: 400 },
      );
    }

    const allowed: AllowedStatus[] = ['draft', 'enabled', 'disabled'];

    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "status is required and must be one of 'draft', 'enabled', or 'disabled'",
        },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('playbooks')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playbookId)
      .select('id, name, status, updated_at')
      .single();

    if (error) {
      console.error('Error updating playbook status:', error);
      const msgParts = [
        'SUPABASE_QUERY_ERROR',
        error.message ?? '',
        error.details ?? '',
        error.code ? `code=${error.code}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      return NextResponse.json(
        {
          ok: false,
          message: msgParts || 'Failed to update playbook status',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        item: data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/playbooks/status:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'UNEXPECTED_ERROR: Failed to update playbook status.',
      },
      { status: 500 },
    );
  }
}

