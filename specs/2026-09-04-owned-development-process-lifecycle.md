# Owned development process lifecycle

## Problem

`just develop` can leave Meteor, MongoDB, and build-tool descendants running after a sibling command fails. A subsequent launch then fails on port 2100 and can leave the DevTools panel using an older extension build.

## Evidence

The failed launch left an orphaned process group rooted at `yarn devapp`, including Meteor, Rspack, MongoDB, and the application server. The existing `concurrently --kill-others-on-fail` command owns only its immediate shell children. Playwright also starts fixtures through a shell command.

## Agreed contract

- Cover every Meteor-launching development and E2E command: `start`, `develop`, `dev:*`, `devapp*`, and E2E runners.
- Refuse to start when a required port is occupied. Report the owner when the platform can identify it and provide a cleanup command; never kill an unowned process automatically.
- Put every launched command in an owned process group on POSIX systems.
- On exit or interruption, send `SIGTERM`, wait briefly, then send `SIGKILL` only to owned groups that remain alive.
- Preserve child exit status and clean siblings when any managed child fails.

## Uncertainty and constraints

- PID/command discovery uses `lsof` where available; port occupancy detection itself must not depend on it.
- POSIX process groups provide descendant cleanup. Windows receives a direct-child fallback because negative-PID signaling is unavailable.
- Release archives already present in `releases/` are unrelated and must remain untouched.

## Risks and recovery

An incorrect process-group target could terminate unrelated work. The launcher records only PIDs returned by its own detached spawns and never derives cleanup targets from port ownership. Reverting the launcher and package-script changes restores the previous lifecycle.

## Executable checklist

- [x] Add tests for script routing, occupied-port diagnostics, cleanup escalation, and idempotency.
- [x] Add one shared process supervisor and development entry point.
- [x] Route development and E2E commands through the supervisor.
- [x] Update documentation and changelog.
- [x] Run focused tests, lint, typecheck, full tests, builds, validation, and an interrupted development smoke test.

## Direct rollout

Land the launcher and script routing together. No persisted data, public extension API, or production dependency changes are required.

## Verification

Verify that an occupied port prevents launch without signaling its owner, Ctrl-C releases fixture ports, a failed sibling releases all owned descendants, and the existing extension checks remain green.
