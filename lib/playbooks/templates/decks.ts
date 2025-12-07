// Week 17 Day 4: Decks playbook templates
// GA-ready template for deck saved/exported → outreach sequence playbook

import type { SupabaseLikeClient } from "../../activity-log";
import type {
  PlaybookTrigger,
  PlaybookCondition,
  PlaybookAction,
  PlaybookStatus,
} from "../types";

const DECK_OUTREACH_PLAYBOOK_NAME = "New deck in Vault → outreach sequence";

interface PlaybookInsert {
  name: string;
  trigger: PlaybookTrigger;
  conditions: PlaybookCondition[];
  actions: PlaybookAction[];
  status: PlaybookStatus;
}

function getDeckOutreachPlaybookDefinition(): PlaybookInsert {
  return {
    name: DECK_OUTREACH_PLAYBOOK_NAME,
    trigger: "activity_event",
    conditions: [
      {
        field: "activity.type",
        op: "includes",
        value: "deck_", // catches deck_saved_to_vault and deck_exported style names
      },
      // Optional filter by category if this metadata exists:
      // For example, only fundraising decks:
      // {
      //   field: "activity.metadata.deck_category",
      //   op: "equals",
      //   value: "fundraising",
      // },
    ],
    actions: [
      {
        type: "log_activity",
        params: {
          type: "deck_outreach_sequence_started",
          feature: "decks",
          category: "outreach",
        },
      },
      {
        type: "enqueue_task",
        params: {
          taskType: "deck_outreach_sequence",
          feature: "decks",
          category: "outreach",
          channel: "email",
          target: "investor_list",
        },
      },
    ],
    status: "active",
  };
}

export async function ensureDeckPlaybooksForOrg(params: {
  client: SupabaseLikeClient;
  orgId: string;
}): Promise<void> {
  const { client, orgId } = params;

  const { data: existing, error: selectError } = await client
    .from("playbooks")
    .select("id")
    .eq("org_id", orgId)
    .eq("name", DECK_OUTREACH_PLAYBOOK_NAME)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    // Fail closed but do not throw.
    // Note: optionally log via ActivityLog if needed.
    return;
  }

  if (existing) {
    return;
  }

  const definition = getDeckOutreachPlaybookDefinition();

  const { error: insertError } = await client.from("playbooks").insert({
    org_id: orgId,
    name: definition.name,
    trigger: definition.trigger,
    conditions: definition.conditions,
    actions: definition.actions,
    status: definition.status,
  });

  if (insertError) {
    // Note: optionally log via ActivityLog if needed.
    return;
  }
}

