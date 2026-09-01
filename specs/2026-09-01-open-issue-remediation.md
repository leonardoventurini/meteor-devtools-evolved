# Open Issue Remediation

**Date:** 2026-09-01<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>
**Source analysis:** [`reports/2026-09-01-open-github-issues.md`](../reports/2026-09-01-open-github-issues.md)

## Problem

Eight GitHub issues remain open. One is answered, while the other seven cover
performance, correctness, inspection usability, collection discovery, multiple
DDP connections, and querying. The work must reduce capture overhead before
adding features that could increase it, preserve Meteor 2.16 and 3.5.1 support,
and keep the extension functional after every issue-sized change.

## Evidence

- Every intercepted DDP message currently captures a stack and schedules a
  complete Minimongo snapshot.
- Minimongo snapshots clone every document and the panel serializes every
  document again.
- Performance instrumentation targets legacy synchronous collection methods
  and omits Meteor 3 asynchronous methods.
- Subscription columns use fixed viewport-relative widths.
- Unnamed collections and non-default DDP connections have no identity model.
- Minimongo offers string filtering but no structured query/projection model.
- Meteor 3.5.1 is represented by a maintained fixture, resolving the
  compatibility question in issue #53.

## Scope and rollout order

Work proceeds as independently verified, semantic commits in this order:

1. Triage: close #53 and normalize labels/priorities on the remaining issues.
2. #34: establish deterministic workload measurements and reduce capture cost.
3. #33: support explicit Meteor 2 synchronous and Meteor 3 asynchronous
   Performance instrumentation without regressing #34 budgets.
4. #54: deliver JSON expansion controls, `_id` visibility, and tree filtering
   in separable increments.
5. #16: make subscription columns responsive at narrow, medium, and wide sizes.
6. #5: discover and identify multiple unnamed collections without collisions.
7. #10: model, capture, and select additional DDP connections without merging
   their data.
8. #27: add a constrained structured selector, sort, limit, and projection UI
   shared with the advanced portion of #54.
9. Update durable documentation and record architectural/product decisions.

Issue #16 may move immediately before #54 if it is useful as an isolated quick
win, but performance and correctness work remains the foundation for all
capture-heavy features.

## Contracts

### Runtime performance

- DDP interception must preserve event ordering and payload fidelity.
- Expensive stack capture must be explicitly bounded, sampled, disabled, or
  demand-driven; ping/pong traffic must not trigger document work.
- Minimongo synchronization must avoid a full collection snapshot for every
  DDP event. Refresh triggers and stale-data behavior must be visible and
  deterministic.
- In-memory DDP history must have an explicit bound and predictable eviction.
- Hot paths must not write per-event or per-document diagnostics to the page
  console.

### Performance events

- Meteor 2 synchronous operations and Meteor 3 asynchronous operations must
  emit typed events with operation, collection, start, and duration metadata.
- Synchronous invocation time and asynchronous settlement time must not be
  conflated.
- Wrappers must preserve `this`, arguments, return values, rejected promises,
  and thrown errors.
- Repeated installation must not double-wrap methods.

### Inspection UX

- JSON expansion state must have an explicit default and user controls.
- Tree filtering must preserve ancestors of matching keys or values and clearly
  identify matches.
- Document `_id` values must be visible and copyable without expanding a row.
- Subscription layouts must allocate remaining width to useful content and
  remain operable at supported panel widths.

### Collection and connection identity

- Named collection behavior must remain backward compatible.
- Each unnamed collection must receive a stable, collision-free, session-local
  identity while retaining `null` as its actual collection name.
- Each DDP connection must have a stable identity. DDP logs, subscriptions, and
  Minimongo data must remain scoped to that identity and never be silently
  merged.

### Structured query interface

- Queries use a documented allowlist of selectors, sort values, limits,
  projections, and EJSON-compatible values; arbitrary JavaScript evaluation is
  out of scope.
- Invalid or unsupported input produces a typed validation error and performs
  no page-world operation.
- Result bounds must prevent the query interface from bypassing the performance
  protections introduced for #34.

## Test strategy and acceptance criteria

Tests are written before or alongside each implementation unit.

### #34

- Add deterministic tests that count stack captures, snapshot requests,
  serializations, and retained DDP events for configurable workloads.
- Add a stress-fixture path with configurable message count, document count,
  and payload size.
- Assert ping/pong causes no snapshot, disabled/sampled stack capture respects
  its policy, snapshots coalesce or follow visibility policy, and retention
  never exceeds its configured bound.
- Run focused tests, typecheck, lint, full Vitest, and both extension builds.

### #33

- Add adapter unit tests for sync return, sync throw, async resolve, async
  reject, method absence, and idempotent installation.
- Exercise representative operations in both maintained Meteor fixtures where
  automation permits; otherwise provide a documented fixture smoke procedure.
- Assert instrumentation overhead stays within the deterministic #34 budgets.

### #54 and #16

- Add component/store tests for expansion actions, persisted depth, `_id`
  rendering/copy behavior, ancestor-preserving filtering, and responsive class
  or layout contracts.
- Verify keyboard operation and accessible names for new controls.
- Visually smoke-test narrow, medium, and wide DevTools panels.

### #5 and #10

- Add injector tests with two unnamed collections and at least two connections.
- Assert stable identities, no key collisions, isolated logs/subscriptions/data,
  and preservation of the default connection behavior.
- Exercise both Meteor fixtures or document any Meteor-internal divergence.

### #27

- Test accepted and rejected selectors, sort, limit, projection, EJSON values,
  result bounds, and serialization failures.
- Test the UI success, empty, validation-error, and execution-error states.
- Assert no use of `eval`, `Function`, or equivalent arbitrary execution.

### Every implementation unit

- `yarn test` passes.
- `yarn typecheck` passes.
- `yarn lint` passes.
- Chrome and Firefox builds and manifest validators pass when runtime or build
  behavior changes.
- Relevant fixture smoke checks pass.
- Documentation and changelog references remain current.

## Uncertainty

- Browser and Meteor internals may prevent reliable discovery of collections
  or connections created before injection; instrumentation timing must be
  tested in both fixtures.
- A panel-visibility signal may not be available in the page world without a
  new bridge message.
- GitHub may not currently contain the proposed label taxonomy or milestone.
  Missing labels should be created consistently; an owner or milestone should
  not be guessed.
- Stable automated browser performance timing is environment-sensitive, so CI
  gates should focus on deterministic operation counts and bounded data sizes.

## Risks

- Sampling stacks can reduce diagnostic completeness.
- Incremental Minimongo updates can drift if an event is missed.
- Prototype wrapping can change application semantics or conflict with other
  instrumentation.
- Private Meteor registries may change between versions.
- Multiple connections expand every message and store contract.
- Rich filtering/querying can increase CPU and memory usage or expose unsafe
  execution paths.

## Recovery

- Keep each issue and each independently useful increment in a separate commit.
- Preserve a full-refresh reconciliation path for Minimongo if incremental
  state becomes inconsistent.
- Guard new capture policies and identity formats behind typed defaults that can
  be reverted without data migration.
- Revert only the failing issue-sized commit; do not combine unrelated backlog
  work in a rollback.
- Reopen a GitHub issue with reproduction evidence if post-close verification
  contradicts its acceptance criteria.

## Direct rollout

This is an unreleased browser-extension development branch, so verified changes
roll directly into `development` without a compatibility migration. GitHub
issues are updated only after their corresponding acceptance criteria pass.
Issue #53 is the exception because the maintained fixture already supplies the
evidence needed to close it.

## Executable checklist

- [ ] Close #53 with Meteor 3.5.1 fixture evidence and a #34 reference.
- [ ] Apply a consistent, minimal label taxonomy to the open backlog.
- [x] Implement and verify #34 performance foundations.
- [x] Implement and verify #33 modern Performance instrumentation.
- [ ] Implement and verify #54 JSON inspection increments.
- [ ] Implement and verify #16 responsive subscriptions.
- [ ] Implement and verify #5 unnamed collections.
- [ ] Implement and verify #10 multiple DDP connections.
- [ ] Implement and verify #27 structured query/projection.
- [ ] Update the changelog and durable documentation.
- [ ] Record architecture and product decisions.
- [ ] Run the complete validation matrix.
- [ ] Reconcile issue comments/state with verified results.
