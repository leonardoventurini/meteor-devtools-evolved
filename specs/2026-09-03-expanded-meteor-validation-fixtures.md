# Expanded Meteor Validation Fixtures

**Date:** 2026-09-03<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>

## Problem

The maintained Meteor 2.16 and 3.5.1 browser fixtures prove basic extension
compatibility but do not exercise enough real behavior to validate the DDP,
subscriptions, Minimongo, connection-scoping, and performance panels
thoroughly.

Meteor 2 currently creates 1,000 shallow random documents and ten repetitive
range publications, but the integration harness asserts only one method, two
publication names, and nonempty data. Meteor 3 exposes six shallow links, one
publication, and one method. Both fixtures create a secondary DDP connection
without subscribing it to data. Neither fixture provides controlled mutation,
errors, stopped subscriptions, delayed readiness, structured values, or a
repeatable manual scenario surface.

## Evidence

- `tests/e2e/meteor-extension.spec.ts` exercises one successful method/result
  pair, connection discovery, one named collection, two local collections, and
  basic subscription presence.
- The secondary `DDP.connect` connection creates a collection but never
  subscribes or receives documents.
- No browser test observes `unsub`, `nosub`, `changed`, `removed`, method error,
  or method `updated` messages.
- The Performance panel's Meteor 2 synchronous and Meteor 3 asynchronous paths
  are unit-tested but not driven by both live fixtures.
- Existing fixture data does not cover nested selectors, sorting boundaries,
  null versus missing fields, arrays, Unicode, multiline text, or long values.

## Desired outcome

Both fixtures expose the same semantic validation catalog and deterministic
domain data while using the APIs appropriate to their Meteor generation.
Developers can trigger each scenario from a compact visible control panel, and
Playwright can use a stable page-world fixture contract without relying on UI
copy or arbitrary timing.

## Agreed scope

- Seed roughly 750 server-backed documents in routine CI.
- Provide a visible fixture control panel and stable automation hooks.
- Cover the safe EJSON-shaped subset now: nested objects, arrays, dates,
  booleans, null and missing fields, zero/negative/boundary numbers, Unicode,
  multiline content, and bounded long strings.
- Defer ObjectID, binary, custom EJSON, and other serialization-sensitive types
  to a separate follow-up.
- Keep all high-frequency and mutation scenarios explicitly triggered and
  bounded.

## Data contract

Each fixture defines the same named collections and deterministic records:

- `fixtureProjects`: 20 projects.
- `fixtureTasks`: 220 tasks distributed across projects.
- `fixtureEvents`: 510 audit events.
- `fixtureRemote`: 12 records intended only for the additional DDP connection.

The primary server-backed corpus contains 750 records; secondary-connection
records are counted separately. IDs, timestamps, categorical values, nested
fields, and array contents derive from integer indexes and fixed constants.
Server startup reconciles the fixture-owned collections to this exact dataset
without random IDs or wall-clock timestamps.

The two existing unnamed local collections remain. A named client-only
collection provides safe, deterministic performance operations without
modifying server seed state.

## Publication contract

Both generations expose equivalent publication names and outcomes:

- baseline projects;
- parameterized tasks with validated project ID and bounded limit;
- multi-collection dashboard data;
- overlapping task views;
- ready-with-no-data;
- delayed readiness with timer cleanup;
- a controlled `Meteor.Error` rejection;
- secondary-connection-only records.

Long-lived baseline subscriptions initialize automatically. Delayed, rejected,
overlapping, and transient subscriptions run only through explicit controls or
the automation hook. Every timer has an `onStop` cleanup path.

## Method contract

Both fixtures expose semantic equivalents for:

- structured echo preserving nested parameters;
- safe complex value results;
- delayed success;
- controlled `Meteor.Error` failure;
- deterministic insert, update, and remove transitions on a fixture-owned
  mutation record;
- bounded traffic burst.

Meteor 2 uses callback-facing calls and synchronous Mongo collection APIs.
Meteor 3 deliberately uses `Meteor.callAsync` and async Mongo APIs where
supported. Stable errors are asserted by code, reason, and details rather than
runtime-formatted stack text.

## Client scenario contract

Each fixture renders a compact Fixture controls/status section with stable
`data-testid` hooks. Controls trigger structured method success, delayed
success, method failure, mutation lifecycle, transient publication lifecycle,
bounded traffic, and local performance operations.

Each page exposes `globalThis.__meteorDevtoolsFixture` with a versioned,
documented contract containing scenario metadata, status snapshots, and typed
by-convention functions for Playwright. The hook is fixture-only and is not an
extension public API.

Scenario functions settle only after their observable client outcome, and
return structured results suitable for polling. They must clean up transient
subscriptions and timers.

## Test strategy

### Tests designed before implementation

1. Root contract tests compare both fixture source modules for equivalent
   collection counts, publication names, method names, and stable hook version.
2. Fixture-native tests validate procedural generator cardinality, fixed IDs,
   representative rich shapes, and uniqueness without storing large snapshots.
3. Shared Playwright scenarios invoke the page hook and correlate DDP data by
   publication/method/record identifiers rather than global event ordering.
4. Existing browser integration remains the baseline regression test.

### Browser assertions

- The primary snapshot contains exactly the deterministic corpus and
  representative nested/date/null/missing/Unicode/long-string records.
- The secondary snapshot contains only secondary records and remains isolated
  from primary collections.
- Captured DDP traffic includes `sub`, `ready`, `unsub`, `nosub`, `method`,
  `result`, `updated`, `added`, `changed`, and `removed` across controlled
  scenarios.
- Successful, delayed, structured, and failed method contracts are observable.
- Active, parameterized, delayed, stopped, rejected, overlapping, and
  connection-scoped subscriptions are distinguishable.
- Representative local collection operations emit Performance data using sync
  APIs on Meteor 2 and async APIs on Meteor 3.
- Existing structured Minimongo query unit coverage remains the authority for
  operator semantics; the richer browser snapshot supplies realistic data and
  validates the 500-result source boundary without duplicating query-engine
  unit tests through a disconnected panel page.

## Constraints

- CI jobs retain their existing 30-minute timeout.
- Default startup must not generate continuous DDP traffic or unbounded timers.
- Tests poll for correlated state and never rely on cross-message timing order.
- Fixture seed setup must finish before readiness is exposed to Playwright.
- Meteor 2 retains its synchronous/callback compatibility boundary.
- Meteor 3 exercises Promise settlement and async collection operations.
- Existing Rspack and Meteor dependency pins remain unchanged unless an
  implementation blocker is discovered and explicitly approved.
- The extension's public APIs, production dependencies, and security boundary
  do not change.

## Uncertainty

- Exact client availability of individual synchronous and asynchronous Mongo
  APIs differs between the pinned generations. Controls will feature-detect
  optional operations, while required assertions use APIs verified by fixture
  tests.
- DDP merge-box behavior means stopping one overlapping subscription may not
  remove a document still owned by another. Tests will assert lifecycle
  messages and final ownership-aware state rather than assuming removal.
- Dates cross the bridge through EJSON/JSON representations. Tests will assert
  semantic timestamps rather than object identity.
- Publication errors may emit browser console diagnostics. They remain
  user-triggered so fixture startup and unrelated tests stay quiet.

## Risks and mitigations

- **Slow seeding:** Generate moderate fixed arrays and use generation-appropriate
  bulk/chunked writes; measure both CI jobs.
- **Persistent local database drift:** Reconcile fixture-owned deterministic IDs
  and remove stale fixture records on startup.
- **Flaky lifecycle tests:** Use stable scenario IDs, explicit cleanup, bounded
  delays, and polling instead of sleeps.
- **Cross-test mutations:** Provide a reset operation and restore the mutation
  sentinel in test cleanup.
- **HMR connection leaks:** Retain the secondary connection and avoid recreating
  it when the fixture module is reevaluated.
- **Duplicated fixture semantics:** Root contract tests compare exported
  catalogs and cardinalities across both roots.
- **Large failure output:** Assert representative records and aggregate counts,
  not full data snapshots.

## Recovery and rollback

Each fixture and the shared harness are committed as separate reviewable units.
The expansion can be reverted without migrating extension or user data. Fixture
collections use dedicated names, so rollback leaves only disposable local
development database records removable with `meteor reset`.

## Direct rollout

Land the expanded fixtures directly on `development`. CI runs both generations
independently against the packaged Chrome extension. No production extension
behavior changes, so no staged user rollout is required.

## Executable checklist

- [x] Add failing root tests for the shared semantic contract.
- [x] Implement deterministic generators and expanded Meteor 2 fixture.
- [x] Implement deterministic generators and expanded Meteor 3 fixture.
- [x] Add native generator/contract tests to both fixtures.
- [x] Add visible scenario controls and stable page-world hooks.
- [x] Populate and subscribe the additional DDP connection.
- [x] Expand shared Playwright assertions for data, methods, publications,
      mutations, lifecycle events, isolation, and performance.
- [x] Preserve and run existing integration assertions.
- [x] Update README and `CHANGELOG.md`.
- [x] Record the fixture architecture decision.
- [x] Run lint, typecheck, root tests, both production builds and validators,
      both fixture-native test suites, and both Playwright fixture suites.
- [x] Commit every independently verified unit with semantic messages.

## Verification record

- `yarn lint`: passed.
- `yarn typecheck`: passed.
- `yarn test`: passed, 114 tests across 32 files.
- `yarn build:chrome && yarn validate:chrome`: passed.
- `yarn build:firefox && yarn validate:firefox`: passed.
- Meteor 2 native server suite: 6 passed on isolated port 3202.
- Meteor 3 native server suite: 6 passed on isolated port 3203.
- `yarn test:e2e:meteor2`: 6 passed, including the existing baseline, three
  expanded catalog scenarios, panel navigation, and Options persistence.
- `yarn test:e2e`: 6 passed with the equivalent Meteor 3 coverage.

All ten acceptance criteria are verified. The browser suites complete in under
15 seconds locally after fixture startup. CI duration remains to be confirmed
on the pushed commit, where each generation runs on an independent matrix job.

## Acceptance criteria

1. Both fixtures expose equivalent stable collection, publication, method, and
   automation-hook contracts.
2. Routine CI seeds exactly 750 primary server records plus 12 isolated
   secondary-connection records per fixture.
3. Representative documents cover all agreed safe complex-value categories.
4. Every requested DDP message family is observed through controlled scenarios.
5. Both success and controlled failure method/publication paths are verified.
6. Secondary connection data and subscriptions are demonstrably isolated.
7. Performance capture exercises Meteor 2 sync and Meteor 3 async collection
   APIs through deterministic local operations.
8. All scenarios terminate cleanly and restore mutable fixture state.
9. Both CI matrix jobs remain within 30 minutes and pass without retries caused
   by nondeterministic fixture behavior.
10. Documentation describes how contributors manually trigger and automate the
    richer validation surface.
