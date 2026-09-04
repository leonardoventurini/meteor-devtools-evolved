# DDP History Start Boundary

> The standalone Options-page placement in this decision was superseded by
> `2026-09-04-devtools-native-settings.md`.

**Date:** 2026-09-03<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>

## Context

The extension captures DDP traffic before its DevTools panel opens and replays
the per-tab background cache when the panel connects. This makes preceding
activity inspectable, but large histories can delay the workflow of users who
only want to observe new traffic.

The panel's existing settings live in panel-owned IndexedDB. A Manifest V3
background service worker cannot use that store as a reliable synchronous
startup contract, and the repository's placeholder Options component was not a
packaged extension page.

## Decision

- Package a browser Options page with a DDP startup-history preference.
- Persist one allowlisted string in extension-local browser storage, using the
  explicitly approved `storage` permission.
- Keep `show-history` as the missing, invalid, and unreadable-value default.
- Resolve the preference in the background worker when the panel initializes.
- For `show-history`, replay cached messages in capture order before registering
  the panel for live forwarding.
- For `start-from-now`, delete the entire cache for the inspected tab before
  registering the panel for live forwarding.
- Keep caches, settings, and cleanup isolated by browser tab.

The delete-and-register operation runs synchronously after the storage lookup.
Browser runtime callbacks queued before that operation contribute to the
discarded cache; callbacks processed afterward become the new live session.

## Rejected alternatives

### Clear after panel replay

This would still transfer, parse, format, and render the history that causes the
reported delay. It also creates a visible flash of unwanted data.

### Default every installation to start from now

This would silently remove the extension's established ability to inspect DDP
activity that occurred before the panel opened.

### Store the preference in panel IndexedDB

The background worker needs the value before panel initialization, and sharing
the panel's Dexie lifecycle would add a fragile cross-context dependency.

### Encode the policy in the panel initialization request

The panel would first need to hydrate persisted settings, delaying bridge
initialization and potentially losing messages during setup. It would also make
the panel responsible for a background cache policy.

### Clear only DDP event objects from the cache

The cache may also contain stale snapshots and status messages from an earlier
panel session. Clearing the inspected tab's complete transient cache establishes
a simpler session boundary; authoritative connection, subscription, Minimongo,
and stats state is requested again after the bridge connects.

## Rationale

The background worker owns both capture history and the panel connection, so it
is the only layer that can avoid replay costs and define an atomic boundary.
Extension-local storage is the browser-supported cross-context persistence
mechanism and holds no inspected-page data.

## Consequences

- Existing and new installations retain the previous replay behavior until the
  user explicitly selects Start from now.
- Start from now resets historical rows and byte counters because those events
  never reach the newly constructed panel store.
- The `storage` permission appears in Chrome and Firefox manifests.
- Changing the option affects subsequent panel initialization; it does not
  mutate an already open panel session.
- Storage failures favor diagnostic preservation by falling back to history
  replay.
