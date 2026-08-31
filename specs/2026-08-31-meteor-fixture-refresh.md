# Refresh Meteor Compatibility Fixtures

## Problem

The active Meteor 3.4 fixture no longer starts because its Rspack 2 dependencies
are incompatible with Meteor's Rspack integration and the required development
server package is absent. Three near-identical Meteor 2 fixtures also impose
duplicate maintenance and vulnerability-alert overhead.

## Evidence

- `meteor run` reports a missing `@rspack/dev-server` and then fails while
  constructing the React Refresh plugin.
- The active fixture pins Rspack 2, while Meteor 3.5's Rspack package is built
  around the compatible Rspack 1 toolchain.
- Every Meteor 3.5 seed document contains a date, exposing a capture cleanup
  bug that returned early and transported the complete document as `null`.
- Stable Meteor releases currently top out at 3.5.1 and 2.16; Meteor 3.5.2 is
  prerelease-only.
- The existing Meteor 2 fixtures have equivalent application structure and npm
  dependency ranges, differing mainly in release pins.

## Uncertainty

Meteor owns its `.meteor/versions` resolution, so exact transitive Atmosphere
package changes must be accepted from `meteor update`, not hand-authored.
Extension-panel integration still requires a manual browser smoke test after
the automated fixture and extension checks.

## Contracts

- Maintain exactly two compatibility fixtures: `devapp-3.5` on Meteor 3.5.1
  and `devapp-2.16` on Meteor 2.16.
- The active Meteor 3 fixture starts in development with working Rspack HMR.
- Minimongo capture preserves dates, arrays, nested objects, and falsy values.
- Both fixtures retain immutable npm locks and one-shot Meteor tests.
- Root scripts, Just recipes, CI/auditing, and current documentation reference
  only maintained fixture paths.
- Generated `.meteor/local`, build output, and user-created release archives
  remain untracked.

## Risks

- Meteor release upgrades can change embedded Node versions and Atmosphere
  package selection.
- Rspack version drift can reintroduce development-server or React Refresh
  incompatibility.
- Deleting redundant fixtures reduces historical coverage in exchange for a
  clear supported compatibility floor.

## Recovery

Revert the fixture-refresh commit to restore the four prior fixture trees and
their release pins. The deleted files remain recoverable from Git history.

## Direct rollout

Make Meteor 3.5.1 the active development fixture immediately after startup,
test, build, and audit verification. Keep Meteor 2.16 as the single legacy
compatibility fixture and remove the older Meteor 2 trees in the same change.

## Verification

- Run structural fixture contract tests before and after implementation.
- Run a unit regression test for complete Minimongo document normalization.
- Run each fixture's Meteor test suite through its own Meteor toolchain.
- Start the Meteor 3.5 fixture and confirm compilation plus an HTTP response.
- Run root lint, typecheck, unit tests, browser builds, manifest validation,
  and dependency audits.
- Manually load each browser extension against both fixtures before release.

## Executable checklist

- [x] Add and observe failing fixture contract tests.
- [x] Retain and upgrade one Meteor 2 fixture to 2.16; remove older v2 fixtures.
- [x] Upgrade and rename the active fixture to Meteor 3.5.1.
- [x] Pin the Meteor-compatible Rspack 1 stack and add its development server.
- [x] Update scripts, current documentation, changelog, CI, and decision record.
- [x] Verify both fixtures and the complete root project.
- [x] Commit the verified unit semantically without bypassing hooks.
