// Week 7 Day 4: Playbook event helpers
//
// This centralises how "events" (share_link_created, signature_completed, etc.)
// map to playbook runs.
//
// For v1:
//  - We only define the types and a stubbed queue function.
//  - Actual wiring from Share/Sign events can be done by calling
//      queuePlaybooksForEvent({ type: 'share_link_created', payload: {...} })
//    from the relevant API routes.
//
// Later, this file can:
//  - Look up enabled playbooks with event triggers
//  - Insert playbook_runs rows with status 'started'
//  - Call the deterministic executor with a derived scope

import { createClient } from '@supabase/supabase-js';
import type { PlaybookDefinition } from './types';

export type PlaybookEventType =
  | 'share_link_created'
  | 'signature_completed';

export interface PlaybookEventPayload {
  // For share_link_created
  share_id?: string;
  document_id?: string;
  owner_id?: string;
  // For signature_completed
  envelope_id?: string;
  signer_email?: string;
  // Generic additions
  workspace_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface PlaybookEvent {
  type: PlaybookEventType;
  payload: PlaybookEventPayload;
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

type PlaybookRow = {
  id: string;
  owner_id: string;
  name: string;
  status: 'draft' | 'enabled' | 'disabled';
  scope_json: unknown;
  definition_json: PlaybookDefinition | null;
  created_at: string;
  updated_at: string;
};

/**
 * queuePlaybooksForEvent
 *
 * v1 behaviour:
 *  - Logs that an event was received.
 *  - Looks up enabled playbooks (to be filtered by event triggers later).
 *  - NO side effects yet (no automatic runs).
 *
 * Future behaviour (later in Week 7 / Week 8):
 *  - Filter playbooks whose definition_json contains an event trigger
 *    matching `event.type`.
 *  - Insert playbook_runs rows in 'started' status and call the executor.
 */
export async function queuePlaybooksForEvent(event: PlaybookEvent) {
  const supabase = getSupabaseServerClient();

  console.log('[Playbooks][events] Received event', event.type, event.payload);

  const { data, error } = await supabase
    .from('playbooks')
    .select('id, owner_id, name, status, scope_json, definition_json, created_at, updated_at')
    .eq('status', 'enabled');

  if (error) {
    console.error('[Playbooks][events] Failed to fetch enabled playbooks', error);
    return {
      ok: false as const,
      message: 'Failed to fetch enabled playbooks',
    };
  }

  const items = (data ?? []) as PlaybookRow[];

  // For now we just log which playbooks COULD run based on this event.
  console.log('[Playbooks][events] Enabled playbooks (no-op v1):', {
    count: items.length,
    ids: items.map((p) => p.id),
  });

  return {
    ok: true as const,
    count: items.length,
  };
}

