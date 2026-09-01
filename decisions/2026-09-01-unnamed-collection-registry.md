# Unnamed Collection Registry

**Date:** 2026-09-01<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>
**Issue:** [#5](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/5)

## Context

Meteor's connection registry exposes named live-data collections but does not
contain unmanaged collections created with `new Mongo.Collection(null)`.
Meteor 3 also exposes `Mongo._collections`, but that map is keyed by collection
name, so each new `null` collection replaces the previous `null` entry. A null
name therefore cannot discover or identify multiple local collections.

The extension injects at `document_start` and initializes when Meteor becomes
available. It can seed collection instances already exposed by Meteor and
observe future construction before application startup callbacks normally
create local collections.

## Decision

- Wrap `Mongo.Collection` with a JavaScript constructor proxy.
- Preserve the original prototype, static behavior, constructor arguments, and
  `instanceof` behavior through the proxy.
- Seed the registry from `Mongo._collections` when available.
- Deduplicate outer Mongo collection instances against local collections
  already exposed by the active connection.
- Assign unnamed collections stable session-local labels in construction order:
  `Local collection 1`, `Local collection 2`, and so on.
- Transport the actual `null` name separately as collection metadata.
- Exercise two unnamed collections in both maintained Meteor fixtures.

## Rejected alternatives

### Read only the connection registry

Unmanaged collections intentionally have no server connection and never appear
there.

### Read only `Mongo._collections`

The map retains at most one collection for the `null` key, so it cannot support
multiple unnamed collections or prevent display collisions.

### Replace null with a document-derived label

Document content is mutable and can be empty, duplicated, or sensitive. A
session-local sequence is stable, predictable, and independent of data.

### Mutate application collection names

Changing `_name` would misrepresent Meteor semantics and could affect
application behavior. The actual name remains null; only extension display
identity is synthesized.

## Rationale

A constructor proxy is the narrowest interception point that observes every
future unnamed instance without modifying Meteor's prototype methods or local
collection implementation. A weakly keyed label map avoids mutating application
objects and lets unreachable collection identities be collected.

## Consequences

- Labels are stable for one page session but intentionally reset on reload.
- The registry can seed the most recent pre-injection null entry exposed by
  Meteor, but no API can recover multiple earlier null collections already
  overwritten before injection. `document_start` minimizes that window.
- Future multiple-connection support can reuse the actual-name and display-name
  distinction while adding connection identity as a separate dimension.
- Code that replaces `Mongo.Collection` after extension initialization may
  bypass the registry and will require separate interoperability handling.
