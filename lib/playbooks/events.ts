// Week 7 Day 4: Playbook event helpers
// Week 17 Day 2: Refactored to wire into execution engine
//
// This centralises how "events" (share_link_created, signature_completed, etc.)
// map to playbook runs.
//
// This file now acts as a thin adapter from existing call-sites into the new engine.

import { createClient } from '@supabase/supabase-js';
import type { PlaybookDefinition } from './types';
import { runPlaybooksForEvent, type PlaybookEvent as EnginePlaybookEvent } from './engine';
import type { PlaybookTrigger } from './types';
import { ensureContractPlaybooksForOrg } from './templates/contracts';
import { ensureDeckPlaybooksForOrg } from './templates/decks';
import { ensureAccountsPlaybooksForOrg } from './templates/accounts';

export type PlaybookEventType =
  | 'share_link_created'
  | 'signature_completed'
  | 'accounts_pack_run';

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

// Legacy PlaybookRow shape used by early Week 7 endpoints; kept for compatibility
// while the normalized GA Playbooks API rolls out.
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
 * Week 17 Day 2: Refactored to use execution engine.
 * Maps legacy event types to PlaybookTrigger and delegates to runPlaybooksForEvent.
 *
 * Maintains backward compatibility with existing call-sites.
 */
export async function queuePlaybooksForEvent(event: PlaybookEvent) {
  const client = getSupabaseServerClient();

  console.log('[Playbooks][events] Received event', event.type, event.payload);

  // Map legacy event type to PlaybookTrigger
  let trigger: PlaybookTrigger | null = null;
  let activityType: string | undefined;

  // Map activity-related events to activity_event trigger
  if (event.type === 'share_link_created' || event.type === 'signature_completed') {
    trigger = 'activity_event';
    activityType = event.type;
  } else if (event.type === 'accounts_pack_run') {
    trigger = 'accounts_pack_run';
  }

  // If event type doesn't map to a known trigger, return early
  if (!trigger) {
    console.warn('[Playbooks][events] Unknown event type, skipping:', event.type);
    return {
      ok: false as const,
      message: `Unknown event type: ${event.type}`,
      count: 0,
    };
  }

  // Extract orgId from payload
  // Try workspace_id (legacy) or org_id (new schema)
  const orgId =
    (event.payload as { org_id?: string; workspace_id?: string })?.org_id ??
    (event.payload as { org_id?: string; workspace_id?: string })?.workspace_id;

  if (!orgId) {
    console.warn('[Playbooks][events] No orgId found in payload, skipping:', event.payload);
    return {
      ok: false as const,
      message: 'No orgId found in event payload',
      count: 0,
    };
  }

  // Structure payload for activity_event trigger to be contracts/decks-friendly
  // Ensure activity.type and activity.metadata are accessible
  // For accounts_pack_run, ensure metrics and pack type are accessible
  let structuredPayload: unknown;
  if (trigger === 'activity_event') {
    // If payload already has activity structure, use it; otherwise wrap it
    const payload = event.payload as { activity?: unknown; [key: string]: unknown };
    if (payload.activity && typeof payload.activity === 'object') {
      structuredPayload = event.payload;
    } else {
      // Wrap payload in activity structure for playbook conditions
      // This ensures activity.type and activity.metadata are accessible for:
      // - Contracts: activity.type = "contract_signed", activity.metadata.status, etc.
      // - Decks: activity.type = "deck_saved_to_vault" or "deck_exported", activity.metadata.deck_category, etc.
      structuredPayload = {
        ...event.payload,
        activity: {
          type: activityType ?? event.type,
          metadata: payload.metadata ?? payload.context ?? {},
        },
      };
    }
  } else if (trigger === 'accounts_pack_run') {
    // Ensure metrics and pack_type are accessible for playbook conditions
    const payload = event.payload as {
      metrics?: unknown;
      type?: string;
      pack_type?: string;
      [key: string]: unknown;
    };
    // If payload already has metrics, use it; otherwise structure it
    if (payload.metrics && typeof payload.metrics === 'object') {
      // Ensure pack_type is in metrics if not already present
      const metrics = payload.metrics as { pack_type?: string; [key: string]: unknown };
      if (!metrics.pack_type && payload.type) {
        structuredPayload = {
          ...event.payload,
          metrics: {
            ...metrics,
            pack_type: payload.type,
          },
        };
      } else {
        structuredPayload = event.payload;
      }
    } else {
      // Wrap payload to ensure metrics structure exists
      structuredPayload = {
        ...event.payload,
        metrics: {
          ...(payload.metrics && typeof payload.metrics === 'object' ? payload.metrics : {}),
          pack_type: payload.type ?? payload.pack_type,
        },
      };
    }
  } else {
    structuredPayload = event.payload;
  }

  // Construct engine event
  const engineEvent: EnginePlaybookEvent = {
    trigger,
    payload: structuredPayload,
  };

  // Ensure playbook templates exist for activity_event triggers
  if (trigger === "activity_event") {
    const activity = structuredPayload as { activity?: { type?: string } };
    const activityType = activity?.activity?.type;
    
    if (activityType === "contract_signed") {
      await ensureContractPlaybooksForOrg({ client, orgId }).catch(() => {
        // Ignore seeding failures; engine should still run
      });
    }
    
    // Check for deck-related events (deck_saved_to_vault, deck_exported, etc.)
    if (activityType && typeof activityType === "string" && activityType.startsWith("deck_")) {
      await ensureDeckPlaybooksForOrg({ client, orgId }).catch(() => {
        // Ignore seeding failures; engine should still run
      });
    }
  }

  // Ensure accounts playbook template exists for accounts_pack_run triggers
  if (trigger === "accounts_pack_run") {
    await ensureAccountsPlaybooksForOrg({ client, orgId }).catch(() => {
      // Ignore seeding failures; engine should still run
    });
  }

  // Run playbooks (never throws, all errors are logged internally)
  try {
    await runPlaybooksForEvent({
      client,
      orgId,
      event: engineEvent,
    });

    return {
      ok: true as const,
      count: 0, // Count not available from engine (fire-and-forget)
    };
  } catch (err) {
    // This should never happen as runPlaybooksForEvent never throws,
    // but handle it just in case
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[Playbooks][events] Unexpected error in runPlaybooksForEvent:', errorMessage);
    return {
      ok: false as const,
      message: `Unexpected error: ${errorMessage}`,
      count: 0,
    };
  }
}

