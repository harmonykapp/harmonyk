// Week 17 Day 5: Accounts playbook templates
// GA-ready template for investor snapshot → investor update recommended playbook

import type { SupabaseLikeClient } from "../../activity-log";
import type {
  PlaybookTrigger,
  PlaybookCondition,
  PlaybookAction,
  PlaybookStatus,
} from "../types";

const ACCOUNTS_INVESTOR_PLAYBOOK_NAME = "Investor snapshot → investor update recommended";

interface PlaybookInsert {
  name: string;
  trigger: PlaybookTrigger;
  conditions: PlaybookCondition[];
  actions: PlaybookAction[];
  status: PlaybookStatus;
}

function getAccountsInvestorPlaybookDefinition(): PlaybookInsert {
  return {
    name: ACCOUNTS_INVESTOR_PLAYBOOK_NAME,
    trigger: "accounts_pack_run",
    conditions: [
      {
        field: "metrics.pack_type",
        op: "equals",
        value: "investor_accounts_snapshot",
      },
      {
        field: "metrics.estimatedRunwayMonths",
        op: "lt",
        value: 6,
      },
      {
        field: "metrics.totalMonthlyBurn",
        op: "gt",
        value: 0,
      },
    ],
    actions: [
      {
        type: "log_activity",
        params: {
          type: "investor_update_recommended",
          feature: "accounts",
          category: "investor_snapshot",
        },
      },
      {
        type: "enqueue_task",
        params: {
          taskType: "investor_update_followup",
          feature: "accounts",
          category: "investor_snapshot",
        },
      },
    ],
    status: "active",
  };
}

export async function ensureAccountsPlaybooksForOrg(params: {
  client: SupabaseLikeClient;
  orgId: string;
}): Promise<void> {
  const { client, orgId } = params;

  const { data: existing, error: selectError } = await client
    .from("playbooks")
    .select("id")
    .eq("org_id", orgId)
    .eq("name", ACCOUNTS_INVESTOR_PLAYBOOK_NAME)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    // Fail closed; optionally log via ActivityLog if needed.
    return;
  }

  if (existing) {
    return;
  }

  const definition = getAccountsInvestorPlaybookDefinition();

  const { error: insertError } = await client.from("playbooks").insert({
    org_id: orgId,
    name: definition.name,
    trigger: definition.trigger,
    conditions: definition.conditions,
    actions: definition.actions,
    status: definition.status,
  });

  if (insertError) {
    // Fail closed; optionally log via ActivityLog if needed.
    return;
  }
}

