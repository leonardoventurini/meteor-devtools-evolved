# Bounded Meteor Discovery Window

## Context

The page-world injector polled for Meteor every 10 milliseconds but stopped
after approximately one second. Current CI traces from the Meteor 2.16 classic
bundle show the extension reaching that cutoff just before Meteor becomes
available, leaving an otherwise healthy page permanently uninstrumented.

Pull request #85 only updates an indirect ESLint filesystem dependency. Its
failed legacy integration check reproduced the same failure already present on
the `development` baseline and exposed this independent production race.

## Decision

Keep discovery lightweight and bounded, but extend its timeout from one second
to ten seconds. Name the interval and timeout as constants, clear the interval
immediately after successful initialization, and cover both late readiness and
the non-Meteor timeout with fake-timer regression tests.

## Rejected Alternatives

- Do not merge with a known failing required check: the check exposed a real
  compatibility defect even though the dependency update did not cause it.
- Do not weaken or skip the Meteor 2.16 browser test: it is the supported legacy
  baseline and correctly exercises production injection timing.
- Do not poll forever: most matched pages do not use Meteor, so an unbounded
  interval would retain needless work for the lifetime of every page.
- Do not add a fixed delay to Playwright: that would conceal rather than repair
  the production race.

## Rationale

A ten-second window tolerates classic-bundle startup and runner scheduling
variation while preserving a finite cost on non-Meteor pages. Immediate timer
cleanup after success avoids running the remaining checks once initialization
has completed.

## Consequences

- Meteor applications that expose globals between one and ten seconds after
  content-script startup are now instrumented.
- Non-Meteor pages perform the same inexpensive check for at most ten seconds.
- Initialization contracts and extension permissions remain unchanged.
