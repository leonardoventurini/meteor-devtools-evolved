# Connection-scoped Minimongo Query Persistence

## Problem

Minimongo query state is process-local and global. Reloading DevTools loses the
query, while changing the active DDP connection can apply the previous
connection's query to unrelated captured documents.

## Evidence

- `MinimongoStore` owns a single `query`, `queryInput`, and `queryError`.
- `PanelStore.setActiveConnectionId` clears captured data but does not swap
  query state.
- The query drawer keeps its draft only in component-local React state.

## Scope and contracts

- Persist query state in `localStorage` under a versioned key containing the
  encoded inspected-tab scope and connection ID.
- Persist both the last valid applied input and the current drawer draft.
- Restore and apply the last valid query synchronously on reload.
- Restore invalid drafts as text without applying them.
- Swap query, draft, and validation state whenever the active connection
  changes; never reuse another connection's or inspected tab's values.
- Clearing removes only the active connection's persisted state.
- Retain records for connections absent from the current discovery result.
- Treat unavailable or malformed storage as empty state without breaking the
  panel.

## Uncertainty

Connection IDs are stable only to the degree guaranteed by the existing
connection registry. This change scopes strictly to those IDs and does not add
new connection identity behavior.

## Risks and recovery

Local storage can contain stale or manually edited values. Runtime shape checks
and the existing query parser prevent malformed values from becoming active.
The feature can be rolled back by removing the persistence adapter and the
connection-switch hook; stored keys are inert if left behind.

## Executable checklist

- [x] Test reload restoration of applied queries and drafts.
- [x] Test strict isolation while switching connections.
- [x] Test invalid drafts, corrupt storage, clearing, and unavailable storage.
- [x] Implement versioned per-connection persistence.
- [x] Move drawer drafts into the connection-aware store.
- [x] Wire connection selection to query-state switching.
- [x] Update changelog and architectural decision records.
- [x] Run full tests, lint, typecheck, Chrome build, and whitespace checks.

## Direct rollout

Ship directly with the next extension build. Existing users begin with empty
per-connection state because no prior query storage key exists.

## Verification

Acceptance requires a valid query and an invalid in-progress draft to survive a
new store instance, connection and inspected-tab scopes to restore only their
own state, clear to remove only the active record, malformed storage to fall
back safely, and the complete project verification suite to pass.
