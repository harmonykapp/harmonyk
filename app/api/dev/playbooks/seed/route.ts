// Week 7 Day 5 (pulled forward): Seed Playbooks Library
//
// POST /api/dev/playbooks/seed
//
// Body:
// {
//   "owner_id": "uuid-of-your-user"
// }
//
// Behaviour:
//  - Upserts 3 seed playbooks for the given owner_id:
//      1) Inbound NDA → Save→Sign→Share
//      2) Aging Proposals → Reminder / Share bump
//      3) Receipt detected → Create expense doc → File to Accounts/Month
//  - Uses fixed IDs so it can be safely re-run without creating duplicates.
//
// Notes:
//  - This is a DEV-ONLY endpoint. Do not expose it in production UIs.
//  - Definitions are compatible with the current Playbooks executor (manual trigger + simple actions).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { PlaybookDefinition } from '@/lib/playbooks/types';

type AllowedStatus = 'draft' | 'enabled' | 'disabled';

interface PlaybookSeed {
  id: string;
  owner_id: string;
  name: string;
  status: AllowedStatus;
  scope_json: unknown;
  definition_json: PlaybookDefinition;
}

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

function buildSeeds(ownerId: string): PlaybookSeed[] {
  const now = new Date().toISOString();

  const inboundNda: PlaybookSeed = {
    id: '00000000-0000-0000-0000-000000000101',
    owner_id: ownerId,
    name: 'Inbound NDA → Save→Sign→Share',
    status: 'draft',
    scope_json: {
      mode: 'selection',
      description: 'Run against selected NDA doc(s) in Workbench.',
    },
    definition_json: {
      trigger: {
        type: 'manual',
      },
      steps: [
        {
          idx: 0,
          type: 'trigger',
          kind: 'manual',
          input: {},
        },
        {
          idx: 1,
          type: 'action',
          kind: 'log_selection',
          input: {
            note: 'Prepare NDA for signature and sharing.',
          },
        },
        {
          idx: 2,
          type: 'action',
          kind: 'prepare_signature_envelope',
          input: {
            role: 'counterparty',
          },
        },
        {
          idx: 3,
          type: 'action',
          kind: 'prepare_share_link',
          input: {
            link_type: 'external',
            expiry_days: 7,
          },
        },
      ],
      meta: {
        created_at: now,
        template: 'inbound_nda_v1',
      },
    } as PlaybookDefinition & { meta?: { created_at: string; template: string } },
  };

  const agingProposals: PlaybookSeed = {
    id: '00000000-0000-0000-0000-000000000102',
    owner_id: ownerId,
    name: 'Aging Proposals → Reminder / Share bump',
    status: 'draft',
    scope_json: {
      mode: 'saved_view',
      view_id: 'contracts:aging_proposals',
      description: 'Proposals not updated in 7+ days.',
    },
    definition_json: {
      trigger: {
        type: 'manual',
      },
      steps: [
        {
          idx: 0,
          type: 'trigger',
          kind: 'manual',
          input: {},
        },
        {
          idx: 1,
          type: 'condition',
          kind: 'doc_age_greater_than_days',
          input: {
            days: 7,
          },
        },
        {
          idx: 2,
          type: 'action',
          kind: 'log_selection',
          input: {
            note: 'Prepare reminder for stale proposals.',
          },
        },
        {
          idx: 3,
          type: 'action',
          kind: 'prepare_share_link',
          input: {
            link_type: 'external',
            expiry_days: 3,
          },
        },
      ],
      meta: {
        created_at: now,
        template: 'aging_proposals_v1',
      },
    } as PlaybookDefinition & { meta?: { created_at: string; template: string } },
  };

  const receiptToVault: PlaybookSeed = {
    id: '00000000-0000-0000-0000-000000000103',
    owner_id: ownerId,
    name: 'Receipt detected → Create expense doc → File to Accounts/Month',
    status: 'draft',
    scope_json: {
      mode: 'selection',
      description: 'Run on imported receipts, file to Accounts workspace.',
    },
    definition_json: {
      trigger: {
        type: 'manual',
      },
      steps: [
        {
          idx: 0,
          type: 'trigger',
          kind: 'manual',
          input: {},
        },
        {
          idx: 1,
          type: 'action',
          kind: 'log_selection',
          input: {
            note: 'Extract receipt details and create expense record.',
          },
        },
        {
          idx: 2,
          type: 'action',
          kind: 'create_expense_document',
          input: {
            target_folder: 'Accounts/This Month',
          },
        },
      ],
      meta: {
        created_at: now,
        template: 'receipt_to_vault_v1',
      },
    } as PlaybookDefinition & { meta?: { created_at: string; template: string } },
  };

  return [inboundNda, agingProposals, receiptToVault];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          owner_id?: string;
        }
      | null;

    const ownerId = body?.owner_id;

    if (!ownerId) {
      return NextResponse.json(
        { ok: false, message: 'owner_id is required' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const seeds = buildSeeds(ownerId);

    const { data, error } = await supabase
      .from('playbooks')
      .upsert(seeds, {
        onConflict: 'id',
      })
      .select();

    if (error) {
      console.error('Error seeding playbooks:', error);
      return NextResponse.json(
        {
          ok: false,
          message: error.message ?? 'Failed to seed playbooks',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        count: data?.length ?? seeds.length,
        ids: seeds.map((s) => s.id),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/dev/playbooks/seed:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'UNEXPECTED_ERROR: Failed to seed playbooks.',
      },
      { status: 500 },
    );
  }
}

