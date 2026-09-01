# Close Superseded Pull Requests

**Date:** 2026-09-01<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`

## Context

Twenty-one pull requests remained open after the Node 26, Yarn 4, WXT/Vite,
dependency, privacy, feature, and Meteor fixture modernization. Nineteen were
stale Dependabot requests with failed historical CI and conflicts against
current `development`. Six of those targeted retired fixture directories. The
other two were an old multi-bug fix and an automated translation-link proposal.

Current `development` passes the full Verify & Audit job and live-browser
integration against Meteor 3.5.1 and Meteor 2.16.

## Decision

Close all 21 requests and merge none:

- Close #84 as superseded. Its applicable string, navigation, Minimongo, and
  typing fixes are present in the newer architecture with current automated
  coverage.
- Close #81 because repository documentation will remain directly maintained;
  third-party hosted automatic translations are not adopted.
- Close #82, #79, #78, and #71 because they target the retired `devapp-3.4`.
- Close #67 and #60 because they target the retired `devapp-2.0.0`.
- Close #83 because UUID and its retired telemetry use were removed.
- Close #80, #77, #76, #75, #74, #72, #70, #69, #65, #64, #63, and #61
  because the regenerated current dependency graph already meets, exceeds, or
  removes their requested versions.

Each request receives a concise explanation of its category-specific reason.

## Rejected alternatives

- Do not merge PR #84 and resolve its conflicts: that would reapply changes to
  superseded components and duplicate already-tested fixes.
- Do not merge PR #81 merely because GitHub reports it mergeable: it delegates
  documentation trust and availability to an external translation service and
  is substantially behind the current README.
- Do not rebase the Dependabot requests: their lockfile baselines predate the
  replacement dependency graph, and several point at deleted paths.
- Do not leave the requests open for historical reference: closed requests
  preserve their diffs and discussion while accurately signaling disposition.

## Rationale

Closing the stale queue preserves the verified current architecture and avoids
reintroducing retired fixtures, telemetry, and old dependency graphs. No open
request contains unique applicable work that is absent from current
`development`, so merging any request would add risk without retained value.

## Consequences

- The repository has zero open pull requests after triage.
- All 21 diffs and closure comments remain available in GitHub history and can
  be reopened if contrary evidence appears.
- Future dependency updates should be generated against the current paths and
  lockfiles rather than reviving these branches.
- No application code or runtime behavior changed as part of this decision.
