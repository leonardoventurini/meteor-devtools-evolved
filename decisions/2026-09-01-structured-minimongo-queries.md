# Structured Minimongo Queries

**Date:** 2026-09-01<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>
**Issues:** [#27](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/27), [#54](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/54)

## Context

Issue #27 requested a MiniMongo shell, and #54 requested Mongo-style filtering
and projection. Executing arbitrary JavaScript from a DevTools extension would
add CSP, page-world execution, injection, serialization, autocomplete, and
error-boundary risks. Querying live page collections could also bypass the
demand-driven capture and result bounds established for performance issue #34.

The extension already holds transport-safe captured document snapshots in the
panel. A structured query model can satisfy inspection workflows without code
evaluation or new page privileges.

## Decision

- Query the currently captured and selected-connection snapshot in the panel;
  do not execute code in the inspected page.
- Accept JSON objects for selector, sort, and projection plus an integer limit.
- Support dotted field paths, `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`,
  `$in`, `$nin`, `$exists`, `$and`, and `$or`.
- Reject every non-allowlisted operator and unsafe path segments such as
  `__proto__`, `constructor`, and `prototype`.
- Support stable ordered sort fields with directions `1` and `-1`.
- Support Mongo-style inclusion or exclusion projection, with `_id` as the only
  permitted exception to mode mixing.
- Require a positive integer result limit. A later decision removed the original
  500-document upper bound so users can inspect larger captured snapshots.
- Preserve the previous valid query when new input fails validation and display
  a typed validation error.
- Never use `eval`, `Function`, or an equivalent arbitrary execution mechanism.

## Rejected alternatives

### Arbitrary JavaScript shell

This would expand the security boundary from data inspection to code execution,
conflict with extension CSP, and make resource usage difficult to bound.

### Forward selectors to page-world Minimongo

Although this could provide exact Meteor selector semantics, it adds bridge
complexity and lets query work run against live application state. The captured
snapshot is deterministic and honors the extension's explicit refresh model.

### Implement every Mongo operator

Operators involving JavaScript, regex compilation, geospatial state, or server
semantics create disproportionate risk and ambiguity. The allowlist covers the
common inspection cases and can grow through separately tested decisions.

### Unlimited results (superseded)

An unlimited query could recreate the rendering and memory problems addressed
by #34. A fixed maximum originally kept query output within an explicit
interactive budget; `2026-09-04-unbounded-minimongo-query-limits.md` supersedes
that maximum in favor of a user-selected positive limit.

## Rationale

Structured JSON provides predictable parsing and validation, preserves a narrow
extension privilege boundary, and makes every supported behavior independently
testable. Snapshot execution also guarantees that connection selection and
capture freshness remain consistent across Minimongo inspection features.

## Consequences

- Query semantics intentionally cover a documented subset of Mongo selectors.
- Results reflect the last explicit snapshot, not live collection mutations.
- Projected rows are display-only and do not mutate captured source documents.
- Advanced EJSON or additional operators require explicit parsing and tests
  before joining the allowlist.
- The feature is a safe query interface rather than a general-purpose shell.
