// Week 17 Day 3: Contracts playbook templates
// GA-ready template for contract signed → renewal reminder playbook

import type { SupabaseLikeClient } from "../../activity-log";
import type {
  PlaybookTrigger,
  PlaybookCondition,
  PlaybookAction,
  PlaybookStatus,
} from "../types";

const CONTRACT_RENEWAL_PLAYBOOK_NAME = "Contract signed → renewal reminder";

interface PlaybookInsert {
  name: string;
  trigger: PlaybookTrigger;
  conditions: PlaybookCondition[];
  actions: PlaybookAction[];
  status: PlaybookStatus;
}

function getContractRenewalPlaybookDefinition(): PlaybookInsert {
  return {
    name: CONTRACT_RENEWAL_PLAYBOOK_NAME,
    trigger: "activity_event",
    conditions: [
      {
        field: "activity.type",
        op: "equals",
        value: "contract_signed",
      },
      {
        field: "activity.metadata.status",
        op: "equals",
        value: "active",
      },
      // Optional: only fire when days_until_renewal is below a threshold.
      // If this field is missing, the condition will simply fail.
      {
        field: "activity.metadata.days_until_renewal",
        op: "lte",
        value: 30,
      },
    ],
    actions: [
      {
        type: "log_activity",
        params: {
          // This will be used as the ActivityLog `type` via engine support added below.
          type: "contract_renewal_reminder_created",
          feature: "contracts",
          category: "renewal",
        },
      },
      {
        type: "enqueue_task",
        params: {
          taskType: "contract_renewal_reminder",
          feature: "contracts",
          category: "renewal",
        },
      },
    ],
    status: "active",
  };
}

export async function ensureContractPlaybooksForOrg(params: {
  client: SupabaseLikeClient;
  orgId: string;
}): Promise<void> {
  const { client, orgId } = params;

  const { data: existing, error: selectError } = await client
    .from("playbooks")
    .select("id")
    .eq("org_id", orgId)
    .eq("name", CONTRACT_RENEWAL_PLAYBOOK_NAME)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    // Fail closed but do not throw; engine path should keep working even if seeding fails.
    // Note: optionally log this via ActivityLog if needed.
    return;
  }

  if (existing) {
    return;
  }

  const definition = getContractRenewalPlaybookDefinition();

  const { error: insertError } = await client.from("playbooks").insert({
    org_id: orgId,
    name: definition.name,
    trigger: definition.trigger,
    conditions: definition.conditions,
    actions: definition.actions,
    status: definition.status,
  });

  if (insertError) {
    // Note: optionally log this via ActivityLog if needed.
    return;
  }
}

