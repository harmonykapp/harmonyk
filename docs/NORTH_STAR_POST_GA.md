# NORTH_STAR_POST_GA.md — Harmonyk (post-GA vision, read-only during GA)

## One-liner

**All your docs, wherever they live. One brain that actually follows through.**

## Principles (unchanged)

- Document-first (contracts, decks, investor snapshots).  

- Maestro is assistant, not autonomous (proposes; you approve).  

- Metadata-first ingestion; Vault-only semantics for RAG/search.  

- Explainability + Undo on every AI/automation.

## Big Objectives (first 90–180 days after GA)

1) **Integrations:** ship a broad but sane set so Workbench is truly single-view.  

2) **Calendar-aware Tasks:** read **Google Calendar (RO first)** to time tasks and Playbooks.  

3) **Playbooks v2:** accept external triggers (calendar, CRM, e-sign) and add outbound actions (Slack/Teams webhooks, email sequences).

## Integration Strategy

**Tiers:** T0=metadata list · T1=+on-demand fetch→Vault · T2=+webhooks/deltas · T3=+actions/domain behaviors.  

**Phase 0 (3 days):** Connector SDK (OAuth wrapper, pagination/backoff, job contracts, metrics), UnifiedItem mapping, test harness, DoD checklist.  

**Phase 1 (2 weeks):** 6–8 Tier-0/1 connectors for wide visibility — Dropbox, OneDrive, Box, Notion, Slack, DocuSign, DocSend, **Google Calendar (RO)**.  

**Phase 2 (2–3 weeks):** deepen 4–6 to Tier-2 (webhooks/deltas) — Dropbox, Notion, Slack, OneDrive.  

**Phase 3 (3–4 weeks):** hard ones (pick 3–5) — SharePoint/Teams, HubSpot/Pipedrive, QuickBooks/Xero, Pitch.com, Airtable.

**Top-20 targets (after Drive+Gmail):** Google Calendar, Dropbox, OneDrive, Box, Notion, Slack, DocuSign, DocSend, Adobe Sign, Dropbox Sign, Trello, Asana, HubSpot, Pipedrive, QuickBooks, Xero, Microsoft Teams, SharePoint, Pitch.com, Airtable.

## Calendar & Tasks

- **Google Calendar (RO):** pull selected calendars; map Tasks to events; triggers like "After Board meeting → generate Investor Update deck."  

- **Privacy:** explicit calendar selection; don't copy private notes by default.  

- **Later:** optional write-back (event creation) behind clear opt-in.

## Playbooks (post-GA)

- New triggers: Calendar event, CRM stage change, 3rd-party e-sign completion.  

- New actions: Slack/Teams webhooks, CRM notes, scheduled email sequences.  

- Still human-in-the-loop: Maestro drafts changes; user accepts.

## UX notes

- Workbench: connector filter chips, Saved Views (e.g., "Investor docs last 30d"), freshness badges.  

- Integrations cards: scopes, state (Connected/Error/Reauth), last sync, throttle.  

- Vault copy flow: always show **GB impact**; heavy media stays reference-only.

## Packaging (initial stance)

- Connector caps by plan (e.g., Free:1 · Starter:3 · Pro:6 · Team:12).  

- Tier-2 (webhooks/deltas) unlocks on **Pro+**.

## KPIs

- Connect Rate (≥3 connectors/workspace), Coverage (items surfaced), Vault Lift (items copied), Time-to-Signal, Task Follow-through, Stability (<0.5% error/connector).

> This file is guidance only until GA ships. Treat it as a roadmap, not scope.

