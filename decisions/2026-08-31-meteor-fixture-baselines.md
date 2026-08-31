# Meteor Fixture Baselines

## Context

The repository previously retained three frozen Meteor 2 fixtures and used
Meteor 3.4 as its active development fixture. That policy duplicated nearly
identical applications, generated mostly unactionable vulnerability alerts,
and left the active fixture on an incompatible Rspack 2 dependency family.

Stable releases now provide Meteor 2.16 as the final Meteor 2 baseline and
Meteor 3.5.1 as the current Meteor 3 baseline. The published Meteor 3.5 Rspack
adapter still uses Rspack 1 APIs; full Rspack 2 compatibility is targeted
upstream for a later Meteor release.

## Decision

Maintain exactly two fixtures:

- `devapp-3.5` pins Meteor 3.5.1 and is the active development fixture.
- `devapp-2.16` pins Meteor 2.16 and is the legacy compatibility fixture.

Pin the active fixture's compatibility island exactly to
`@meteorjs/rspack@2.1.0`, Rspack core/CLI 1.7.5, dev server 1.1.5, and React
Refresh plugin 1.6.0. Reconsider Rspack 2 only after Meteor publishes and this
project verifies a compatible adapter.

This decision supersedes the frozen-three-fixture policy recorded in
`2026-08-31-frozen-meteor-fixture-alerts.md` for future maintenance.

## Rejected alternatives

- Keeping all historical Meteor 2 fixtures was rejected because their code and
  dependency ranges were duplicates and did not justify ongoing alert noise.
- Using Rspack 2 with local adapter workarounds was rejected because it would
  fork several upstream integration behaviors and still leave HMR risk.
- Tracking the Meteor 3.5.2 release candidate was rejected in favor of stable
  release baselines.

## Rationale

One fixture per maintained Meteor generation preserves meaningful compatibility
coverage with a smaller, explicit support surface. Exact Rspack pins prevent a
semver-compatible install from silently crossing the integration boundary that
caused the development startup failure.

## Consequences

- Historical fixtures remain recoverable from Git but are no longer installed,
  audited, or referenced by current development commands.
- GitHub alerts attached to deleted lockfile paths should disappear; any alert
  on either maintained fixture must be triaged as current work.
- Each fixture must use `meteor npm` because its Meteor release selects the
  runtime that owns its dependency tree.
- A future Meteor/Rspack upgrade must prove development server startup, HMR,
  tests, and production compilation before changing the exact pins.
