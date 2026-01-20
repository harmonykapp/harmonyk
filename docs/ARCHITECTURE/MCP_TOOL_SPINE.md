# MCP Tool Spine (Scaffolding)

Harmonyk needs a single, typed “tool spine” that the Maestro assistant (and later automation/playbooks) can call into.

This document describes the intended design and guardrails. The code for the contracts and spine lives in:

- `lib/tools/contracts.ts` (typed inputs/outputs)
- `lib/tools/spine.ts` (registry + `callTool()` + guardrail hooks)

## Why a tool spine?

Without a spine, every feature ends up with bespoke “agent helpers” and ad-hoc permission checks. A spine forces:

- **One entry point** to instrument, approve, audit, throttle, and rollback
- **Typed contracts** so tools can be swapped or evolved without breaking callers
- **Least privilege** so Maestro can’t “do everything” by default

## Tool categories (current scaffold)

Read-only tools (default safe):

- `vault.list` — list items in a folder (stub returns empty)
- `vault.search` — search items (stub returns empty)
- `vault.get` — get item (stub not wired yet)
- `vault.suggest_name` — suggest a filename (stub returns original)
- `rag.retrieve` — retrieve relevant chunks (stub returns empty)
- `events.log` — emit a tool log event (dev console only for now)

Write / sensitive tools (approval required):

- `vault.move` — move an item (requires approval, server-only; dry-run supported)
- `db.query` — query database (requires approval, server-only)

## Guardrails (required behavior)

The spine supports (and will enforce more strongly over time):

### 1) Allowlists (tool-level)

Callers should pass `ctx.allowlist` so a workflow can limit Maestro to only the tools it needs.

Example: “Rename docs” flow should allow only:

- `vault.search`
- `vault.suggest_name`
- `events.log`

### 2) Approvals (for write/sensitive tools)

Tools with `policy.requiresApproval = true` must be explicitly approved within the current call chain.

Mechanism:

- Caller sets `ctx.approvedTools = [...]` after UI approval.
- The spine blocks execution otherwise.

### 3) Runtime limits (server/client)

Some tools are **server-only**:

- `vault.move`
- `db.query`

Rationale:

- Secrets, privileged connectors, and data access must not run in the browser.

### 4) Dry-run (safe previews)

Write tools should support `dryRun` so Maestro can propose actions without taking them.

Current stub:

- `vault.move` returns `{ moved: false, dryRun: true }` when dry-run.

### 5) Auditing (append-only)

Every tool call should emit an audit record:

- tool name
- input (redacted)
- actor (user/org/session)
- approval state
- result summary

PGW4 only logs to console in dev; later this becomes an append-only event stream (DocSafe Ledger).

### 6) Rollback (where possible)

Write tools should define rollback semantics:

- `vault.move` rollback = move back to original folder
- `vault.rename` (future) rollback = rename back

Even when rollback isn’t possible (emails sent, external shares), the spine must record a receipt.

## How Maestro should use it (pattern)

1) **Plan**: propose a sequence of tool calls (no side effects).
2) **Preview**: run dry-run where supported; present user a summary.
3) **Approve**: user approves specific tools/actions (scoped).
4) **Execute**: run with `ctx.approvedTools` set for that call chain.
5) **Receipt**: log tool outputs (redacted) for later review.

## Next additions (planned)

Contracts to add next (not in PGW4 Day 6 scope):

- `vault.rename`
- `vault.copy`
- `share.create_link`
- `sign.send_request`
- `integrations.connect`
- `policy.evaluate` (DocSafe Ledger policy engine)

## Constraints (engineering)

- No new deps required for contracts/spine.
- Keep tool inputs/outputs JSON serializable.
- Never include raw secrets in inputs/outputs/logs.
