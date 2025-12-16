# Harmonyk — Post-GA Product Specifications (prioritized)

| Area | What ships post-GA (prioritized) | Notes |
|---|---|---|
| **Integrations (Tiered)** | **Phase 1 (breadth, T0/T1):** Dropbox, OneDrive, Box, Notion, Slack, DocuSign, DocSend, **Google Calendar (RO)**, Adobe Sign, Dropbox Sign. **Phase 2 (depth, T2):** webhooks/deltas for Dropbox, Notion, Slack, OneDrive. **Phase 3 (hard, T2/T3):** SharePoint/Teams, HubSpot/Pipedrive, QuickBooks/Xero (RO), Pitch, Airtable. | Tiers: T0=list, T1=+fetch→Vault, T2=+webhooks/deltas, T3=+actions. |
| **Accounts Builder (PG upgrades)** | **Live Google Sheets pull (RO)**; **QuickBooks/Xero RO**; multi-entity rollups; scheduled **snapshot cadences**; richer KPI packs; cohort charts; **variance explanations** by Maestro. | Write-backs later; finance connectors RO first. |
| **Decks Builder (PG)** | Deck components library; brand presets; auto-pull blocks from Accounts; Pitch.com import/export. | Marketplace later. |
| **Contracts Builder (PG)** | ClauseGraph v2 (related clauses, risk heat); negotiation aid (positioning suggestions); org clause catalogs; redline import. | Still human-in-loop. |
| **Playbooks v2** | External triggers (Calendar event, CRM stage, e-sign completion across vendors); outbound webhooks (Slack/Teams); email sequences; conditional branches/loops with retries. | Draft → simulate → approve → run. |
| **Tasks/Calendar** | **Google Calendar RO** mapping; optional write-back (event create) behind opt-in; task SLA windows; saved task views. | Privacy-first (select calendars). |
| **Workbench (PG)** | Saved Views, freshness badges per connector, federated keyword search across connectors, "stale doc" prompts. | Semantics remain Vault-only. |
| **Guest Spaces & Smart Share** | Branded guest portal; project/deal-scoped access; link analytics; bulk revocation. | Team/Pro focus. |
| **Insights (PG)** | Time-saved by Playbooks; bottleneck analysis; per-deal/role drilldowns; scheduled reports. | CSV/PDF + email. |
| **Governance** | Template/Playbook permissions; approval queues; light SSO. | Team tier+. |
| **Packaging** | Connector caps by plan; Tier-2 (webhooks) unlocks on Pro+. | Clear upsell nudges. |

