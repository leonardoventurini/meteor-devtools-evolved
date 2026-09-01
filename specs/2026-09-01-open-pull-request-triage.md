# Open Pull Request Triage

**Date:** 2026-09-01<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`

## Problem

The repository has 21 open pull requests created before the current dependency,
build-system, fixture, security, and feature modernization. Each request needs
an evidence-based disposition so useful work is merged and obsolete, duplicate,
or failing work is closed without regressing the green `development` branch.

## Evidence

- The current `development` branch passes Verify & Audit plus live-browser
  integration against Meteor 3.5.1 and Meteor 2.16.
- Nineteen open requests are stale Dependabot updates. Each conflicts with the
  current branch; several target fixture directories that no longer exist.
- The remaining two requests are an old application/TypeScript fix and an
  automated README/wiki translation. Their diffs must be compared with current
  behavior and documentation before deciding whether to merge or close them.

## Uncertainty

- A stale request may contain a still-useful change that was only partly
  superseded by later modernization.
- GitHub's mergeability result can be temporarily unknown or can change after
  another request is merged.
- Closed Dependabot requests may be recreated if repository configuration still
  asks Dependabot to maintain obsolete paths.

## Contracts

- Review every open pull request's intent, diff, checks, mergeability, target
  path, and overlap with current `development`.
- Merge only work that remains applicable, preserves current architecture, and
  has sufficient verification.
- Close obsolete, duplicate, superseded, or irreparably failing work with a
  concise reason specific to that request or category.
- Do not merge conflict resolutions that restore retired dependencies, deleted
  fixtures, Webpack-era tooling, telemetry, or superseded application logic.
- Preserve the green `development` branch and verify GitHub has no remaining
  open pull requests when triage is complete.

## Risks

- Bulk closure can obscure why an individual contribution was declined.
- Merging an old dependency lockfile can reintroduce vulnerabilities or undo the
  Node 26, Yarn 4, WXT/Vite, and Meteor fixture upgrades.
- An external contributor may expect acknowledgment of useful intent even when
  the implementation is superseded.

## Recovery

- Closed pull requests remain recoverable and can be reopened if new evidence
  shows their work is still needed.
- A merged request can be reverted with a dedicated semantic commit if its
  post-merge checks fail.
- Any still-valid subset of a closed request can be reapplied as a focused new
  pull request against current `development`.

## Direct rollout

After read-only triage, apply dispositions directly on GitHub. Merge requests
one at a time and confirm branch checks after each merge. Close non-mergeable
requests with explanatory comments. No release is created by this work.

## Verification

- Confirm the open pull request count is zero.
- Confirm every reviewed request is either merged or closed with a recorded
  rationale.
- If anything is merged, wait for the resulting `development` CI run to pass.
- Confirm the local worktree is clean and synchronized with
  `origin/development` after the triage record is committed.

## Executable checklist

- [ ] Inventory every open pull request and current check state.
- [ ] Compare every diff with current `development`.
- [ ] Merge each valid, verified request.
- [ ] Close each obsolete, duplicate, superseded, or failing request.
- [ ] Confirm no open pull requests remain.
- [ ] Record the final disposition and consequences in a decision record.
- [ ] Verify and commit the repository-owned triage records.
