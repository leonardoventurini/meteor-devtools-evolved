# Owned process-group supervision

## Context

Development commands previously composed Meteor and WXT with `concurrently`, while Playwright started Meteor through a shell command. Failure and interruption could terminate an immediate shell without terminating Meteor's MongoDB, compiler, and application descendants.

## Decision

All repository-owned development and E2E launch paths use a shared Node supervisor. On POSIX platforms each child is spawned as the leader of a new process group. The supervisor records only groups it created, sends them `SIGTERM` during cleanup, and escalates surviving owned groups to `SIGKILL` after a bounded grace period.

Required ports are checked before launch. Occupied ports produce owner diagnostics through `lsof` when available, but discovered owners are never added to the cleanup registry or signalled automatically.

Playwright requests `SIGTERM` and grants its nested fixture launcher an explicit
shutdown window so the inner supervisor can finish cleaning its detached
Meteor group before the outer runner exits.

## Rejected alternatives

- Keeping `concurrently` was rejected because shell-level sibling termination did not reliably cover descendant process groups.
- Killing whatever owns the expected port was rejected because the owner may be unrelated user work.
- Port-only cleanup was rejected because descendants need not retain a listening socket.

## Rationale

Explicit ownership makes the safety boundary auditable: discovery diagnoses conflicts, while only PIDs returned by detached spawns can become cleanup targets. A shared implementation also aligns direct fixture launches, combined browser development, and Playwright E2E execution.

## Consequences

POSIX development receives full descendant cleanup. Windows uses direct-child signalling as a best-effort fallback. `lsof` improves diagnostics but is not required for occupancy detection or cleanup. Interrupted commands preserve conventional signal-derived exit statuses.
