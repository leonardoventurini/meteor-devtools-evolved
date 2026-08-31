# Node 26 dependency upgrade

## Context

The extension and its active Meteor fixture needed a complete dependency-major
refresh while preserving working Chrome and Firefox builds. The repository had
no root tests, CI used Node 24, and its historical Meteor 2 fixtures intentionally
preserve old dependency graphs for compatibility coverage.

## Decision

- Standardize root development and CI on Node.js 26.5.1, Yarn 4.12.0, and
  Corepack 0.36.0.
- Upgrade every direct root and active `devapp-3.4` dependency to the newest
  mutually compatible release. Keep TypeScript 5.9, ESLint 9, and Unicorn 65
  until their peer ecosystems support the next majors together.
- Preserve `devapp-2.0.0`, `devapp-2.2.0`, and `devapp-2.2.4` unchanged as
  historical compatibility fixtures.
- Enforce production high-severity auditing and the active fixture's complete
  npm audit in CI. Report the complete root graph without failing CI while the
  development-only `web-ext` chain has an unpatched `image-size` advisory.
- Add deterministic root utility tests and require lint, typecheck, tests, and
  both production extension builds in CI.

## Rationale

TypeScript 7 is outside typescript-eslint 8's supported peer range. ESLint 10
breaks the current React lint plugin API, and current Unicorn releases require
ESLint 10.4 or newer, so those majors cannot form a valid toolchain today.
Blueprint 6 itself supports React 19; its optional legacy `react-popper` child
still declares React 18, producing a peer warning even though the migrated code
uses Blueprint's Floating UI-backed APIs and all verification gates pass.

The frozen Meteor 2 fixture audits each report the same seven findings (two
moderate, one high, four critical) inside their legacy Babel runtime and
`meteor-node-stubs` graphs. Updating those locks would erase the compatibility
state they exist to represent. The active Meteor 3.4 fixture audits cleanly.

## Rejected alternatives

- Forcing TypeScript 7 or ESLint 10 with ignored peer contracts was rejected
  because it would make validation unreliable.
- Suppressing all Yarn peer warnings with broad package extensions was rejected
  because that would conceal upstream compatibility state.
- Mutating the Meteor 2 fixtures was rejected because they are historical test
  artifacts rather than maintained production applications.
- Failing CI on an advisory with no patched package release was rejected; the
  full report remains visible while production and active-fixture audits block.

## Consequences

The project now has isolated, revertible upgrade commits, clean production and
active-fixture audits, and repeatable Node 26 CI. Maintainers must revisit the
three blocked tooling majors, Blueprint's `react-popper` metadata, the
development-only `image-size` advisory, and frozen fixture audit exceptions as
upstream releases become available.

## Verification

- `yarn install --immutable`
- `yarn lint`
- `yarn typecheck`
- `yarn test` (3 files, 6 tests)
- `yarn build:chrome`
- `yarn build:firefox`
- `yarn audit` (no production suggestions)
- `yarn audit:devapp` (0 vulnerabilities)
- `npm test` in `devapp-3.4` (2 server tests passing)
- `web-ext lint` on the Firefox artifact (0 errors)
