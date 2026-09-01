# Meteor 2 Playwright Integration

## Problem

The Playwright browser-integration gate exercises only the active Meteor 3.5.1
fixture. The project intentionally retains Meteor 2.16 as its supported legacy
baseline, but that fixture is currently protected only by server tests and
static source assertions. A regression in legacy client globals, synchronous
Mongo internals, DDP interception, or collection storage can therefore pass CI.

## Evidence

- `devapp-2.16` uses Meteor 2.16, React 16, the classic Meteor bundler, callback
  methods, synchronous Mongo operations, and the legacy Minimongo document map.
- It creates the same additional DDP connection and two unnamed local
  collections as the Meteor 3 fixture.
- It exposes a deterministic `echo` method, ten `random*` subscriptions, and a
  populated `random` collection with 1,000 documents.
- The existing Playwright suite hard-codes the Meteor 3 URL, `about` method,
  `links` subscription and collection, fixture label, and `callAsync` API.

## Scope

Parameterize the production-extension Playwright suite over typed Meteor fixture
descriptors and run the complete scenario against both Meteor 3.5.1 and Meteor
2.16. For Meteor 2.16, verify:

1. The packaged MV3 extension worker and page-world injector start.
2. The page is the pinned `METEOR@2.16` runtime rather than a stale server.
3. A callback-style `echo` call produces correlated outbound `method` and
   inbound `result` DDP frames with the expected payload.
4. The default and additional connections are discovered.
5. The `random` Minimongo collection contains legacy documents and both unnamed
   local collections contain non-null seeded documents.
6. Subscription capture includes the first and last `random*` publications.
7. The packaged panel navigation renders under the same browser invocation.
8. CI runs each Meteor generation in an isolated matrix leg and names failure
   diagnostics by fixture.

No production extension API or test-only runtime hook will be added.

## Testing Strategy and Acceptance Criteria

- Define the fixture contract before changing the shared scenario.
- Select exactly one validated fixture per Playwright invocation. Reject unknown
  fixture values before starting a server.
- Give fixtures distinct fixed local ports and assert `Meteor.release` so local
  server reuse cannot silently test the wrong generation.
- Use callback-wrapped `Meteor.call` for the shared method path because it works
  across both supported generations.
- Correlate DDP method and result frames by protocol ID and fixture-specific
  method payload rather than event order.
- Poll production snapshots until connection, subscription, and seeded document
  predicates hold; never use fixed sleeps.
- Run both fixtures sequentially through a portable local command and in
  parallel through isolated CI matrix runners.
- Preserve one worker and a temporary Chromium profile per invocation.

Acceptance requires four passing Playwright tests across the two invocations,
plus immutable install, strict typecheck, lint, Vitest, both extension builds and
validators, retained Meteor server tests, and dependency audits.

## Uncertainty

Meteor 2's classic client may expose globals later than the current injector's
one-second polling window. The new browser gate is intended to reveal whether
that is a real compatibility defect. If it fails, fix the production readiness
mechanism rather than weakening or delaying the test.

The `random` collection fills through ten subscriptions and can be partially
populated when the first snapshot is requested. Assertions must retry production
requests until stable boundary documents and subscriptions appear.

## Contracts

- `devapp-3.5` remains the default local fixture on port 2100.
- `devapp-2.16` runs on port 2200 for local isolation.
- The descriptor catalog is the only source of fixture-specific release,
  readiness, method, collection, subscription, and document expectations.
- Root Playwright dependencies and the production extension build are shared;
  fixture npm graphs remain isolated and are installed through `meteor npm`.
- Meteor 3's dependency audit remains blocking. Meteor 2's frozen compatibility
  graph is reported visibly under the existing documented exception policy.
- Test output and temporary Meteor package selections are not committed.

## Risks and Mitigations

- **Classic-bundler injection race:** assert injection, additional connection,
  and unnamed collections against the real page and repair runtime readiness if
  any are absent.
- **Partial legacy subscription data:** repeatedly request snapshots and test
  semantic predicates instead of relying on startup timing.
- **Cross-fixture contamination:** use separate processes, ports, fixture-local
  Meteor state, and temporary Chromium profiles.
- **CI resource contention:** use one fixture per matrix runner rather than
  starting two Meteor/Mongo stacks in one job.
- **Opaque failures:** include the fixture identifier in project output and
  uploaded Playwright artifact names.
- **Legacy dependency findings:** keep them report-only and explicit; do not
  force incompatible upgrades into the frozen Meteor 2 fixture.

## Recovery

The change is isolated to fixture descriptors, test orchestration, assertions,
CI matrix configuration, and documentation. It can be reverted without
changing production runtime code. If Meteor 2 cannot start on a current runner,
retain its existing server/static gates while documenting the concrete external
blocker; do not silently claim browser coverage.

## Direct Rollout

Land the fixture contract and failing legacy scenario first, then make the
smallest compatibility or orchestration changes needed for both generations to
pass. Enable the CI matrix only after both invocations pass locally. Finish with
documentation, a decision update, and the full verification matrix.

## Executable Checklist

- [x] Add typed, validated Meteor fixture descriptors and portable commands.
- [x] Parameterize the existing production-extension scenario.
- [x] Run and stabilize the full scenario against Meteor 2.16 and 3.5.1.
- [x] Add isolated fixture matrix legs and fixture-specific diagnostics to CI.
- [x] Update contributor documentation and the changelog.
- [x] Record the dual-generation browser-testing decision.
- [ ] Run the complete verification and audit matrix.
