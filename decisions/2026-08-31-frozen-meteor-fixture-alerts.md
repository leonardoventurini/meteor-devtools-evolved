# Frozen Meteor fixture dependency alerts

## Context

GitHub Dependabot reports vulnerabilities from every supported manifest on the
default branch. Forty-seven of the repository's 49 open alerts originate from
the lockfiles for `devapp-2.0.0`, `devapp-2.2.0`, and `devapp-2.2.4`. These
applications are frozen compatibility fixtures that reproduce historical
Meteor environments; they are not shipped with the extension or used as the
active development application.

The remaining two alerts belonged to the active root Yarn graph and were
remediated with patched AJV 8 and Babel runtime 7 resolutions. The active
`devapp-3.4` npm audit reports zero vulnerabilities.

## Decision

Dismiss open Dependabot alerts only when their manifest path is one of the
three frozen Meteor 2 fixture lockfiles. Use the `tolerable_risk` reason and a
comment explaining that changing the dependency graph would invalidate the
historical compatibility fixture.

Do not dismiss alerts for `yarn.lock`, `devapp-3.4/package-lock.json`, or any
future active manifest. Those alerts must be upgraded, removed, or otherwise
remediated before CI and release acceptance.

## Rejected alternatives

- Upgrading the frozen locks was rejected because it would stop them from
  representing their target Meteor versions and could make compatibility
  failures invisible.
- Removing the frozen lockfiles was rejected because reproducibility is part of
  the fixture contract.
- Leaving accepted alerts open was rejected because it obscures actionable
  alerts in maintained dependency graphs and produces misleading push totals.
- Disabling Dependabot or vulnerability alerts repository-wide was rejected
  because active dependency monitoring remains required.

## Rationale

The risk is isolated to non-production, non-active historical fixtures, while
the compatibility value depends on retaining their original dependency trees.
Manifest-scoped dismissal keeps the exception narrow and auditable without
weakening monitoring for maintained code.

## Consequences

- GitHub's open alert view remains actionable for active manifests.
- Dismissed fixture alerts remain visible in alert history and can be reopened.
- If any frozen fixture becomes active, shipped, or part of enforced CI, all of
  its dismissed alerts must be reopened and remediated first.
- Newly reported alerts for the same frozen manifests require explicit triage;
  this decision does not authorize an automatic blanket dismissal mechanism.
