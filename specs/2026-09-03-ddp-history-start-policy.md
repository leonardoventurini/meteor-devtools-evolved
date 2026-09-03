# DDP History Start Policy

**Date:** 2026-09-03<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>
**Source:** [Meteor Forum feedback](https://forums.meteor.com/t/im-modernizing-the-meteor-devtools-looking-for-suggestions/64754/2)

## Problem

The background worker captures DDP messages before the DevTools panel connects
and replays up to 10,000 cached messages during panel initialization. This is
valuable for diagnosing activity that preceded inspection, but message-heavy
applications can spend substantial time transferring, parsing, formatting, and
rendering history that the user does not need.

Users need a persistent choice between retaining the existing diagnostic
history and opening the panel at the current point in the DDP stream.

## Evidence

- Forum feedback specifically requests discarding past DDP messages so the
  panel can focus on messages received from activation onward.
- `src/Browser/Background.ts` currently replays the complete per-tab cache when
  it receives the panel's initialization request.
- `src/Bridge.ts` connects the panel before its asynchronously persisted panel
  settings are available.
- The existing `Options` component is not packaged as an extension entrypoint,
  and its panel IndexedDB store is not an appropriate cross-context startup
  contract.

## Desired outcome

Add an extension Options setting named DDP startup history with two choices:

- **Show captured history** (default): preserve existing replay behavior.
- **Start from now**: discard the inspected tab's cached messages before the
  panel connection becomes active, then forward newly arriving messages.

Starting from now resets historical rows and byte counters because no cached
DDP events are delivered to the newly constructed panel store.

## Scope

### In scope

- A typed, persisted DDP history policy shared by the Options page and
  background worker.
- A packaged extension Options page.
- Atomic policy application during each panel initialization.
- Unit and browser-integration coverage proportionate to the initialization
  boundary.
- README, changelog, and architectural decision updates.

### Out of scope

- Changing the default away from history replay.
- Per-connection startup policies.
- Clearing bookmarks, subscriptions, Minimongo snapshots, or application data.
- Pausing live DDP capture after panel initialization.
- Replacing the existing in-panel clear action.

## Contracts

### Persisted setting

The extension-local storage key is stable and holds one of two string values:
`show-history` or `start-from-now`. Missing, inaccessible, or invalid storage
values resolve to `show-history` for backward compatibility.

### Panel initialization

The panel sends its tab ID in the existing initialization request. The
background worker resolves the persisted policy before it mutates the
connection map or replays messages.

For `show-history`, the worker registers the panel connection and replays the
tab cache in capture order.

For `start-from-now`, the worker deletes the complete per-tab background cache,
then registers the panel connection. JavaScript's run-to-completion semantics
make the delete-and-register boundary atomic relative to queued runtime message
callbacks: messages processed earlier are discarded; messages processed later
are forwarded and begin the new panel session.

The cache contains extension messages beyond DDP events, but startup requests
for connections, subscriptions, Minimongo, and stats run after the panel bridge
connects. Therefore clearing the pre-panel cache does not erase authoritative
state; those snapshots are requested again.

### Options UI

The Options page describes both behaviors, selects `show-history` by default,
persists changes immediately, and reports storage failures without claiming the
change succeeded.

## Uncertainty

- Firefox Manifest V2 and Chrome Manifest V3 expose different background
  lifecycles. The implementation will use WXT's normalized browser APIs and
  verify both generated manifests and production builds.
- Browser integration can reliably exercise the default replay path. Directly
  automating a browser's native Options UI may be disproportionately brittle;
  the storage policy and cache transition will receive deterministic unit
  coverage, with an end-to-end policy scenario added where the harness permits
  extension storage setup.

## Risks and mitigations

- **Race during initialization:** Resolve the policy inside the background
  connection callback and perform cache deletion before registering the port.
- **Invalid persisted data:** Validate against an explicit allowlist and fall
  back to `show-history`.
- **Worker restart or storage failure:** Treat failure as the backward-compatible
  default and log a diagnostic warning.
- **Unexpected state loss:** Delete only the cache for the inspected tab; never
  touch bookmark IndexedDB or page data.
- **Unbounded startup delay:** Extension-local storage is a single-key lookup;
  initialization remains asynchronous but bounded by the browser API.

## Recovery and rollback

The feature can be rolled back by removing the Options entrypoint and policy
lookup, restoring unconditional cache replay. Existing stored values are inert
after rollback. No persisted data migration or application recovery is needed.

## Direct rollout

Ship the setting enabled in the next extension build. Existing installations
have no stored value and continue to show captured history. Users must
explicitly choose Start from now.

## Executable checklist

- [ ] Add failing tests for defaulting, validation, persistence, history replay,
      cache discard, tab isolation, and the initialization race boundary.
- [ ] Add typed storage constants and policy helpers.
- [ ] Refactor the background cache into a testable typed unit.
- [ ] Apply the policy before replaying and registering the panel port.
- [ ] Package and implement the Options page.
- [ ] Add or extend browser-integration coverage where practical.
- [ ] Update README and `CHANGELOG.md`.
- [ ] Record the architectural decision.
- [ ] Run formatting, linting, typechecking, unit tests, Chrome and Firefox
      builds, build validation, and relevant browser integration.

## Acceptance criteria

1. With no saved value, opening the panel replays captured messages exactly as
   before.
2. With Show captured history selected, cached messages replay in capture order
   and live messages continue afterward.
3. With Start from now selected, no cached rows or cached byte totals reach the
   panel, while the first subsequently processed message appears normally.
4. Clearing for Start from now affects only the inspected tab and does not touch
   bookmarks or page data.
5. The choice persists across Options page and background-worker restarts.
6. Invalid or unreadable storage safely falls back to Show captured history.
7. Chrome and Firefox production artifacts expose an Options page and pass
   manifest validation.
8. Existing DDP, connection, subscription, Minimongo, and browser-integration
   behavior remains green.
