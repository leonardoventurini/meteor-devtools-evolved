# Equivalent Meteor Fixture Catalogs

**Date:** 2026-09-03<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>

## Context

The Meteor 2.16 and 3.5.1 fixtures previously evolved as unrelated demo
applications. Their data volume differed substantially, their secondary DDP
connections received no remote data, and browser integration exercised only a
small compatibility baseline. This made regressions in lifecycle capture,
connection scoping, rich Minimongo documents, and version-specific Performance
instrumentation difficult to detect.

## Decision

- Maintain an equivalent, versioned semantic validation catalog in both fixture
  roots.
- Generate 20 projects, 220 tasks, and 510 events procedurally for the primary
  connection, plus 12 records subscribed through the secondary connection.
- Derive stable IDs, timestamps, nested values, arrays, null/missing fields,
  Unicode, multiline content, and long values from fixed indexes.
- Expose the same publication and method names across generations while keeping
  Meteor 2 callback/synchronous implementations and Meteor 3 Promise/async
  implementations.
- Put disruptive behavior behind bounded, explicit scenarios instead of
  running traffic, failures, mutations, or timers continuously at startup.
- Share each scenario between visible fixture controls and a versioned
  `globalThis.__meteorDevtoolsFixture` automation hook.
- Correlate browser assertions by stable method, publication, subscription, and
  record identities rather than depending on global DDP ordering.
- Retain the former links, random ranges, and unnamed local collections as
  regression baselines alongside the expanded catalog.
- Defer secondary connections and local collection construction until after
  extension injection where required by the Meteor 2 loading model.

## Rejected alternatives

### One shared fixture runtime

The fixtures cannot safely import code outside their Meteor roots, and one
implementation would obscure the synchronous-versus-asynchronous compatibility
boundary that the extension must validate.

### Large static fixture files

Checked-in document snapshots would be difficult to review and update. Pure
generators make cardinality, edge cases, and stable IDs independently testable.

### Automatically exercise every scenario on startup

Continuous traffic and automatic failures make DDP assertions noisy, slow
manual inspection, and introduce timer and ordering flakiness. Explicit controls
keep each scenario attributable and bounded.

### Use the secondary connection only for discovery

Discovery without an actual subscription cannot prove that Minimongo snapshots,
subscription state, or DDP traffic remain isolated by connection.

### Make fixture data identical byte-for-byte

Semantic equivalence is sufficient and lets each generation retain idiomatic
implementation and representative legacy data. Root tests enforce catalogs,
counts, and value categories rather than brittle full snapshots.

### Include every EJSON type immediately

ObjectID, binary, and custom EJSON values cross additional serialization
boundaries and deserve focused compatibility decisions. The current catalog
uses the agreed safe complex-value subset and leaves exotic types for a
separate follow-up.

## Rationale

Equivalent scenario names let one Playwright suite validate both generations,
while version-specific implementations ensure the compatibility matrix covers
the APIs users actually run. Deterministic moderate-volume data exercises the
500-result boundary without turning every CI run into a stress test.

## Consequences

- Each fixture owns a small amount of intentionally parallel contract and
  generator code; root parity tests detect semantic drift.
- Startup reconciles disposable fixture collections to deterministic contents.
- The fixture pages are now validation tools rather than minimal framework
  examples.
- Extension injection order is part of fixture readiness for secondary and
  local collection discovery.
- The browser suite performs more work but remains fast locally and within the
  existing 30-minute CI limit.
- Exotic EJSON coverage and environment-controlled stress scaling remain
  independent future work.
