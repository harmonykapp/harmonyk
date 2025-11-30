# Decks Playbooks Integration Notes

This document outlines how decks will integrate with the Playbooks automation system in the future. This is a specification-level document; no Playbooks code is implemented yet.

## Overview

Decks saved to Vault include structured metadata (from Week 13 Day 5) that enables future Playbook automation. The metadata is stored in the document version content as JSON and includes:

- `doc_type: "deck"`
- `deck_type: "fundraising" | "investor_update"`
- `company_name`
- `stage` (optional)
- `round_size` (optional)
- `has_key_metrics` (boolean)
- `outline_sections` (array of section metadata)

## Playbook Concept: "Fundraising Deck → Outreach Tasks"

### Trigger

When a document is saved with:
- `doc_type === "deck"` (or `kind: "deck"` in document table)
- `deck_type === "fundraising"`

Optional filters:
- `stage` matches a specific value (e.g. "Seed", "Pre-Seed", "Series A")
- `round_size` is present (indicating active fundraising)

### Actions (Conceptual)

1. **Create Investor Outreach Tasks**
   - Create a batch of "Investor Outreach" tasks in the Tasks system
   - Each task includes:
     - A link to the deck in Vault
     - Round information (`stage`, `round_size`)
     - Company name (`company_name`)
     - A due date (e.g., within 7 days of deck save)
   - Task description could include:
     - Deck type and key sections from `outline_sections`
     - Round details

2. **Schedule Follow-up Playbook**
   - Optionally schedule a reminder Playbook for:
     - "Send updated deck" in X weeks (e.g., 4-6 weeks)
     - "Check on fundraising progress" reminder

### Inputs

Available from deck metadata:
- `docId` (document ID)
- `orgId` (from document record)
- `deck_type`: "fundraising"
- `company_name`
- `stage` (optional)
- `round_size` (optional)
- `has_key_metrics` (boolean)
- `outline_sections` (for context)

### Guardrails

- Only trigger once per deck per `(stage, round_size)` combo (deduplication)
- Allow opt-out: User can set a flag like "Do not auto-create outreach tasks for this deck"
- Respect user/org preferences for task creation
- Rate limiting: Don't create excessive tasks if user saves multiple drafts

### Example Flow

1. User saves "Acme Corp — Fundraising Deck" with `stage: "Seed"`, `round_size: "$500k"`
2. Playbook triggers and creates tasks:
   - Task 1: "Outreach to Investor A — Share Acme Corp Seed deck"
   - Task 2: "Outreach to Investor B — Share Acme Corp Seed deck"
   - Task 3: "Follow-up on Acme Corp Seed round in 4 weeks"
3. Each task links back to the deck document in Vault

---

## Playbook Concept: "Investor Update Deck → Update Distribution Tasks"

### Trigger

When a document is saved with:
- `doc_type === "deck"`
- `deck_type === "investor_update"`

### Actions (Conceptual)

1. **Create Distribution Tasks**
   - Create tasks to:
     - Email the update to an "Investor Updates" contact list
     - Post a sanitized version internally to team channels (if connectors exist)
   - Each task includes:
     - Link to deck in Vault
     - Company name
     - Suggested distribution date (e.g., same day or next business day)

2. **Future Integration Points**
   - Gmail connector: Auto-draft email with deck link
   - Slack/Teams connector: Post announcement to channel
   - Calendar: Schedule distribution time

### Inputs

Available from deck metadata:
- `docId`
- `orgId`
- `deck_type`: "investor_update"
- `company_name`
- `outline_sections` (for email context)

### Guardrails

- Only trigger once per deck (not on every version update)
- Allow opt-out: "Do not auto-create distribution tasks"
- Respect privacy settings: Don't auto-share sensitive information

---

## Metadata Design Rationale

The deck metadata structure (from Day 5) is specifically designed to feed these Playbooks:

- `doc_type`: Distinguishes decks from contracts/other docs
- `deck_type`: Determines which Playbook pattern to trigger
- `company_name`: Used in task descriptions and email subjects
- `stage` & `round_size`: Key filters for fundraising workflows
- `has_key_metrics`: Indicates deck completeness/quality
- `outline_sections`: Provides context about deck content without full body

---

## Implementation Notes

- Playbooks engine should query `document` table with `kind: "deck"` filter
- Parse metadata from version `content` field (HTML comment format)
- Use existing Playbooks trigger infrastructure (event-driven or scheduled)
- Integration points:
  - Tasks API for creating tasks
  - Gmail/connector APIs for distribution
  - Calendar API for scheduling
- Telemetry: Log Playbook trigger events with deck metadata

---

## Future Enhancements

- Deck version tracking: Trigger on major version bumps (not drafts)
- Custom Playbook definitions: Let users define their own deck→action workflows
- Multi-step Playbooks: Combine deck save → task creation → reminder scheduling
- Integration with external tools: Pitch, DocSend, email marketing platforms

