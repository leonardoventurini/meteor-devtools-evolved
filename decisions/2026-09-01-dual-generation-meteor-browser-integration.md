# Dual-generation Meteor Browser Integration

## Context

The initial Playwright gate exercised only `devapp-3.5`. The retained
`devapp-2.16` fixture represents materially different runtime contracts:
callback methods, synchronous Mongo APIs, React 16, the classic Meteor bundler,
legacy DDP internals, and object-backed Minimongo storage. Static fixture tests
could not prove that the packaged extension still works across those boundaries.

Running both fixtures inside one Playwright process would start competing Meteor
and MongoDB stacks, make failures harder to attribute, and lengthen CI's critical
path. The fixtures also require distinct readiness, method, collection, and
subscription expectations.

## Decision

Maintain one typed fixture catalog and one shared production-extension scenario.
Select exactly one fixture per Playwright process, using fixed local ports and a
mandatory `Meteor.release` assertion. Run both processes sequentially through
`yarn test:e2e:all` for local verification and in parallel through isolated CI
matrix legs.

The shared scenario uses callback-wrapped `Meteor.call`, which is supported by
both generations, while fixture descriptors retain generation-specific method
results, readiness markers, named collections, subscriptions, and local document
labels. Production snapshot requests are retried against semantic predicates so
partial subscription startup never becomes a timing assertion.

Treat `devapp-2.16` as a maintained, blocking compatibility runner, not a shipped
dependency graph. Its legacy dependency audit remains visible and report-only;
root production and active Meteor 3 audits remain blocking. This supersedes the
older frozen-fixture decision only for the retained Meteor 2.16 baseline.

## Rejected Alternatives

- **Copy the Meteor 3 suite.** Duplication would let protocol assertions drift
  and obscure which differences are intentional compatibility contracts.
- **Start both fixtures from one Playwright configuration.** Shared runner
  resources and process cleanup would create unnecessary contention and weaker
  failure isolation.
- **Test only DDP on Meteor 2.** That would miss the legacy Minimongo storage,
  unnamed collections, subscriptions, and packaged-panel boundaries requested
  for parity.
- **Force-upgrade the Meteor 2 dependency graph.** Its historical runtime is the
  compatibility target; incompatible dependency replacement would invalidate
  the fixture without changing shipped extension risk.
- **Retire Meteor 2 coverage.** The project explicitly maintains 2.16 as its
  supported legacy baseline.

## Rationale

Parameterization keeps the production protocol test identical while preserving
the exact differences that matter. Process and CI-runner isolation make failures
actionable, and checking the runtime release prevents a stale local server from
producing a false pass. The matrix adds wall-clock cost only up to the slower
fixture because both legs run concurrently.

## Consequences

- `yarn setup` installs both fixture dependency graphs.
- Contributors can run either generation independently or both sequentially.
- CI performs duplicate root installation, Chrome build, and Chromium setup in
  exchange for independent Meteor/MongoDB state and diagnostics.
- Chrome browser compatibility is blocking for Meteor 3.5.1 and 2.16; Firefox
  remains protected by build, manifest, and package validation.
- The unsupported Chrome-owned custom-panel binding remains a headed manual
  smoke for each generation.
- Meteor 2 dependency findings must remain visible and narrowly classified as
  non-production legacy-fixture risk; this decision does not waive root or
  active-fixture findings.
