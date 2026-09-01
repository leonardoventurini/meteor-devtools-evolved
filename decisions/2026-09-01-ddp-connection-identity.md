# DDP Connection Identity and Selection

**Date:** 2026-09-01<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>
**Issue:** [#10](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/10)

## Context

DDP interception, subscriptions, and Minimongo capture were hard-coded to
`Meteor.connection`. Meteor applications can create additional independent
connections with `DDP.connect`, but Meteor does not expose one public registry
containing every connection. Combining events from different servers without
identity would make logs, subscriptions, collection names, and status totals
ambiguous.

The default connection already exists when extension injection initializes.
Future connections pass through the global `DDP.connect` function. Classic
Meteor bundles can also create a connection and its Mongo collection before a
document-start extension script observes the DDP namespace.

## Decision

- Register `Meteor.connection` as identity `default`, displayed as
  `Default connection`.
- Proxy future `DDP.connect` calls and assign stable session identities
  `connection-1`, `connection-2`, and so on.
- Recover already-created connections from Meteor's registered Mongo
  collections before installing future interception. Ignore the default and
  local collections, and preserve object-identity deduplication.
- Preserve `DDP.connect` receiver, arguments, return value, and static behavior.
- Instrument each connection stream once and attach its identity to every DDP
  event.
- Expose one global connection selector in the DevTools navigation.
- Scope DDP rows and byte/count metrics, subscriptions, and Minimongo snapshots
  through the selected identity.
- Include connection identity in async snapshot responses and reject responses
  that arrive after the user selects a different connection.
- Associate named collections with their owning connection. Show unmanaged
  local collections only under the default connection.

## Rejected alternatives

### Merge all connections into existing views

This loses server identity and allows equal subscription IDs or collection
names from different connections to collide.

### Add independent selectors to every panel

Independent selectors can put DDP, subscriptions, and Minimongo into
inconsistent scopes. One global selector makes the active server an invariant.

### Discover connections by scanning arbitrary global objects

Meteor provides no stable public list, and application variables are not
reliably enumerable. Intercepting the creation API remains deterministic for
future connections; the narrow recovery path uses only connections already
owned by Meteor's registered collections.

### Infer connection identity from endpoint URL

Several connections may target the same endpoint with different options or
session state. Object identity, not URL, is the collision-free boundary.

## Rationale

The registry mirrors the successful constructor-interception approach used for
unnamed collections while retaining DDP's public creation semantics. Explicit
identity in every request and response prevents accidental cross-server data
merging and makes delayed responses safe.

## Consequences

- Connection labels are stable for a page session and reset after reload.
- Connections created before injection are recovered when referenced by a
  registered Mongo collection. Unreferenced historical connections remain
  undiscoverable because Meteor exposes no public all-connections registry.
- Adding a connection updates the selector without reloading DevTools.
- Existing captures remain in the bounded DDP store and reappear when their
  connection is selected.
- Future exports and query operations must include connection identity in their
  contracts.
