# Repair CI and triage dependency alerts

## Problem

The first Node 26 workflow run fails during `actions/setup-node`, and GitHub
reports dependency vulnerabilities after pushes to the default branch.

## Evidence

- Run `33424623987` fails in setup-node before Corepack installation because
  Yarn caching invokes the runner's Yarn 1.22.22 against a Yarn 4.12 project.
- GitHub reports 47 open Dependabot alerts: 45 belong to the intentionally
  frozen Meteor 2 fixture lockfiles and two medium alerts belong to `yarn.lock`.
- The root alerts require AJV 8.18.0 or newer and Babel runtime 7.26.10 or newer.
- The three frozen fixtures each reproduce Meteor 2-era dependency graphs and
  are excluded from active audit enforcement by the recorded compatibility
  policy.

## Uncertainty

- GitHub's push banner reports vulnerable dependency instances, which may not
  equal the number of distinct Dependabot alerts.
- A successful local workflow-equivalent run cannot prove hosted-runner setup;
  the pushed workflow must complete successfully on GitHub.

## Contracts

- Bootstrap Node before Corepack without invoking Yarn 1.
- Preserve immutable Yarn 4 installation and all existing CI gates.
- Upgrade all vulnerable AJV 8 and Babel runtime 7 lockfile entries to patched,
  compatible releases; do not dismiss active-root alerts.
- Preserve the historical Meteor 2 fixture manifests and lockfiles.
- Dismiss only open alerts whose manifest path is one of the three frozen
  Meteor 2 fixture locks, using `tolerable_risk` and a compatibility rationale.
- Record the alert exception policy in the dependency-upgrade decision record.

## Risks and recovery

- Removing setup-node's built-in Yarn cache makes CI slightly slower. Restore a
  separate cache step only after Yarn 4 is bootstrapped.
- Transitive resolutions can expose incompatibilities. Run the complete root
  verification and audit matrix before committing.
- Dependabot dismissals affect GitHub state. Reopen an alert if a fixture
  becomes active or its lockfile compatibility policy changes.
- Revert the remediation commit to restore repository state; alert state must
  be reopened separately through GitHub.

## Executable checklist

- [x] Remove pre-Corepack Yarn cache initialization from setup-node.
- [x] Resolve vulnerable AJV 8 and Babel runtime 7 descriptors to patched
      releases.
- [x] Pass immutable install, lint, typecheck, tests, and both builds.
- [x] Pass production and active-fixture audits.
- [x] Confirm no open Dependabot alert remains for `yarn.lock` or
      `devapp-3.4/package-lock.json`.
- [x] Commit and push the verified repository changes.
- [x] Confirm the new hosted GitHub Actions run succeeds.
- [x] Dismiss only the 45 frozen-fixture alerts with the approved rationale.
- [x] Confirm the final open alert count is zero.

## Direct rollout

Push the remediation to `development`, observe its CI run, then apply the
approved historical-fixture dismissals through the Dependabot API.

## Verification

- `yarn install --immutable`
- `yarn lint`
- `yarn typecheck`
- `yarn test`
- `yarn build:chrome`
- `yarn build:firefox`
- `yarn audit`
- `yarn audit:devapp`
- GitHub Actions run conclusion: success
- Dependabot open alerts grouped by manifest
