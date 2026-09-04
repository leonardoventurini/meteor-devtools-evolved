# Connection-scoped Query Persistence

## Context

Minimongo queries and drawer drafts were held in one in-memory store. Reloading
DevTools discarded them, and selecting another DDP connection retained query
state from the previous connection. Connection IDs such as `default` also recur
across inspected tabs, so a connection-only storage key would leak state
between unrelated applications.

## Decision

Persist one versioned query-state record per inspected DevTools tab ID and DDP
connection ID in the extension page's `localStorage`. Each record contains the
last successfully applied input and the current draft input. Restore the valid
applied query synchronously, preserve invalid drafts as editable text, and swap
the complete state when the active connection changes. Retain records when a
connection disappears, and remove only the active record when clearing.

## Rejected alternatives

- A single global record was rejected because it leaks filters between
  connections and inspected applications.
- Connection-only keys were rejected because common IDs repeat across tabs.
- Persisting only the applied query was rejected because users explicitly want
  in-progress and invalid drafts to survive reloads.
- Deleting records for absent connections was rejected because connections can
  disappear temporarily and return later.
- Extension-wide asynchronous storage was rejected because `localStorage` was
  requested and synchronous restoration avoids briefly displaying unfiltered
  state during hydration.

## Rationale

Combining the inspected tab and connection identities matches the existing data
isolation boundary. Separating applied input from draft input prevents malformed
drafts from changing active results while retaining user work.

## Consequences

Reloads in the same inspected tab restore both active filtering and draft text.
Closing a tab and opening the application in a new tab creates a new scope.
Unavailable, full, stale, or malformed local storage fails closed to defaults
without disabling query execution. Retained records are small but are not
automatically garbage-collected when old tabs or connections disappear.
