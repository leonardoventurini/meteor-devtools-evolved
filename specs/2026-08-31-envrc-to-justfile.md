# Replace `.envrc` commands with Just

## Problem

The repository uses `.envrc` as an ad hoc command library rather than for
environment loading. Contributors must source it into their shell, its
functions rely on mutable working directories, and its setup path now
duplicates documented package scripts.

## Evidence

- `.envrc` defines `mpm`, `start`, `develop`, `watch`, `setup`,
  `update-meteor`, `package-version`, `build-for-browser`, and `build`.
- `CONTRIBUTING.md` tells Linux users to source `.envrc` and invoke `setup`.
- No Justfile currently exists.
- Just 1.57.0 is available in the development environment.
- The exported `DEVTOOLS_HOME` and `MAC_CHROME` variables are not referenced by
  repository code or by the command functions.

## Uncertainty

- `meteor update`, dependency installation, browser development sessions, and
  release packaging mutate state or start long-running processes, so automated
  verification must inspect their dry-run commands rather than execute them.

## Contracts

- Replace `.envrc` with a root `justfile`; do not retain a compatibility shim.
- Preserve every public command name and its default behavior.
- Keep `develop` and `watch` defaulting to Chrome while accepting Firefox or
  another explicit browser configuration name.
- Run commands from the repository root without manual `cd` recovery steps.
- Derive the package version from `package.json` without a text-processing
  pipeline.
- Create the release directory idempotently before packaging both browsers.
- Update contributor documentation and the Unreleased changelog.

## Risks and recovery

- Incorrect argument interpolation could break Meteor npm forwarding or select
  the wrong Webpack configuration. Verify representative arguments by dry run.
- Just dependency ordering could package browsers in an unexpected order. Use
  an explicit sequential recipe body for the combined build.
- Recovery is a revert of the conversion commit, restoring `.envrc` and its
  documentation references.

## Executable checklist

- [x] Add parseable and formatted recipes matching every `.envrc` function.
- [x] Delete `.envrc`.
- [x] Update contributor setup and command documentation.
- [x] Add an Unreleased changelog entry.
- [x] Verify `just --list` exposes the intended public recipes.
- [x] Dry-run parameterized, mutating, and long-running recipes.
- [x] Execute the read-only `package-version` recipe and compare it with the
      manifest.
- [x] Run documentation formatting and diff checks.

## Direct rollout

Contributors install Just and invoke the same command names through `just`.
There is no application runtime migration or release-data conversion.

## Verification

- `just --fmt --check`
- `just --list`
- `just --dry-run mpm install example-package`
- `just --dry-run develop firefox`
- `just --dry-run watch`
- `just --dry-run setup`
- `just --dry-run update-meteor`
- `just --dry-run build-for-browser chrome`
- `just --dry-run build`
- `just package-version`
- `yarn prettier --check README.md CONTRIBUTING.md CHANGELOG.md AGENTS.md`
- `git diff --check`
