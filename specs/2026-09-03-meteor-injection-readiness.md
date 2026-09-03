# Meteor Injection Readiness

## Problem

Pull request #85 updates the indirect `@humanfs/node` development dependency,
but its Meteor 2.16 integration job consistently fails before the page-world
injector initializes. The production injector stops looking for Meteor after
roughly one second, while the classic Meteor client can expose its globals just
after that deadline on current CI runners.

## Evidence

- The PR changes only `yarn.lock`; Verify & Audit and Meteor 3.5 integration
  pass.
- The same Meteor 2.16 failure is present on the current `development` commit,
  so it is not caused by `@humanfs/node`.
- Playwright traces show the extension starting, logging that Meteor was not
  found, and the Meteor UI rendering afterward without an injected script.
- The existing Meteor 2 integration spec explicitly requires repairing the
  production readiness mechanism if the classic-bundler timing race occurs.

## Scope and Contracts

Extend the existing bounded Meteor discovery period without changing message
contracts, public APIs, manifest permissions, or supported runtime versions.
Polling must remain bounded so ordinary non-Meteor pages do not retain an
interval indefinitely. Existing immediate initialization behavior remains
unchanged when Meteor is already available.

## Testing Strategy and Acceptance Criteria

- Add a focused Vitest regression that starts injection before Meteor globals
  exist, exposes them after the former one-second cutoff, and verifies that all
  production injectors initialize exactly once.
- Verify that discovery still times out and clears its timer on a non-Meteor
  page.
- Run lint, strict typechecking, Vitest, both extension builds and validators,
  and both Meteor browser-integration fixtures through CI.
- Merge PR #85 only after every required check is green.

## Uncertainty

The exact classic-bundle initialization time depends on runner load. A
ten-second bounded window provides substantial scheduling margin without
turning discovery into permanent polling.

## Risks

- A longer timer lives briefly on non-Meteor pages. The bounded timeout and
  lightweight global check constrain that cost.
- Repeated callbacks could initialize twice. The existing page flag remains
  the idempotency guard and the regression test verifies single initialization.

## Recovery

Revert the readiness commit to restore the previous one-second window. The
dependency-only PR can then be closed or reconsidered independently.

## Direct Rollout

Land the test and bounded-window change directly on PR #85, then rely on its
complete CI matrix before merge. No staged runtime rollout is required.

## Executable Checklist

- [x] Add late-readiness and bounded-timeout regression coverage.
- [x] Extend the bounded production discovery window.
- [x] Update the changelog and architectural decision record.
- [x] Run local static and unit verification.
- [ ] Push the PR branch and verify the full CI matrix.
- [ ] Merge PR #85.
