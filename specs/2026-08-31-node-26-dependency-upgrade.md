# Node 26 dependency upgrade

## Problem

Upgrade the actively maintained project to Node.js 26 and current dependency
majors without sacrificing a working Chrome/Firefox extension. The repository
currently pins Node 24.13.0, has a stale dependency graph, and has no root test
script. Its existing Node 26 baseline lints but does not typecheck or build.

## Evidence

- Local runtime: Node.js 26.5.1, npm 11.17.0, Yarn 4.12.0.
- Root `yarn install --immutable` succeeds with peer warnings for TypeScript,
  PostCSS, and Autoprefixer.
- `yarn lint` passes.
- `yarn tsc --noEmit` and `yarn build:chrome` fail on seven existing source
  type errors plus incompatible transitive ESLint declaration types.
- The CI workflow uses Node 24 and only runs install, lint, and audit.
- Node 26 no longer bundles Corepack, so CI must install a pinned Corepack
  before enabling the package-manager version declared by `packageManager`.
- `devapp-2.0.0`, `devapp-2.2.0`, and `devapp-2.2.4` are historical Meteor
  compatibility fixtures. Their pinned React and npm graphs are part of the
  fixture contract, not the actively shipped extension dependency surface.
- `devapp-3.4` is the active development fixture used by root scripts.

## Uncertainty

- Node 26 is the Current release on 2026-08-31 and is not scheduled to become
  LTS until October 2026. The explicit Node 26 request takes precedence over
  the earlier “latest LTS” selection.
- TypeScript 7, Babel 8, MobX 7, and several tooling majors are recent. Peer
  compatibility must be proven before each is retained.
- Browser behavior cannot be fully established by compilation alone. UI-stack
  changes require extension smoke testing in addition to automated gates.
- Historical Meteor 2 fixtures may not execute on Node 26. They remain frozen
  compatibility artifacts unless a separate legacy-runtime migration is
  explicitly commissioned.

## Contracts

- Use Node 26 and the repository-declared Yarn release for root operations.
- Keep Yarn's `node-modules` linker and regenerate `yarn.lock` from the updated
  manifest rather than hand-editing it.
- Upgrade every direct root dependency and every direct dependency in the
  active `devapp-3.4` to its latest compatible major.
- Remove direct packages that have no source, configuration, or runtime use.
- Preserve the three Meteor 2 fixture manifests and locks as versioned test
  fixtures; report their audit state separately.
- Do not suppress type errors with weaker compiler settings, broad `any`
  additions, or `skipLibCheck` merely to make an upgrade pass.
- Each migration unit includes its tests/code adaptations, verification, and a
  semantic commit. Only task-owned paths are staged.
- Final CI runs install, lint, typecheck, both production builds, tests, and a
  high-severity dependency audit on Node 26.

## Test strategy and acceptance criteria

Before dependency migration, restore a green baseline and add explicit root
scripts for `typecheck` and `test`. Root unit tests cover migration-sensitive
pure logic, while the active Meteor fixture retains its separate Mocha suite.

Every root dependency unit must pass:

1. `yarn install --immutable`
2. `yarn lint`
3. `yarn typecheck`
4. `yarn test`
5. `yarn build:chrome`
6. `yarn build:firefox`

Security-focused units and the final verification also run `yarn audit`. The
active fixture separately passes `npm ci` and its Meteor test command. React,
Blueprint, styled-components, virtual-list, and Tailwind changes additionally
receive a manual extension smoke-test checklist covering panel, popup, options,
DDP filtering, Minimongo browsing, drawers, popovers, and persisted settings.

## Upgrade roadmap

1. Restore the Node 26 typecheck/build baseline and encode the validation
   scripts.
2. Pin Node 26 metadata, regenerate the root lock, and resolve peer defects.
3. Remove unused D3 dependencies and other obsolete type-only packages.
4. Upgrade low-risk data/runtime packages: Luxon, Dexie, UUID, and byte-format
   utilities.
5. Upgrade build loaders, Webpack CLI/plugins, Sass, and related configuration.
6. Upgrade ESLint and developer tooling, adapting the flat configuration.
7. Upgrade styled-components and its source-level types.
8. Upgrade React, React DOM, React types, MobX bindings, and the active Meteor
   fixture; migrate legacy root rendering and explicit children contracts.
9. Upgrade Blueprint and consolidate Popover2/Tooltip2 into core APIs.
10. Upgrade react-window and infinite-loader with the required list API rewrite.
11. Upgrade Tailwind, DaisyUI, and PostCSS using the CSS-first toolchain.
12. Upgrade TypeScript and Babel last, after their ecosystem peers support the
    requested majors.
13. Upgrade the active Meteor 3.4 Rspack toolchain and regenerate its npm lock.
14. Run the complete validation/audit matrix and perform the UI smoke test.
15. Record migration decisions and expand CI to audit and test on Node 26.

## Risks and recovery

- Large UI-library jumps can compile while changing visual behavior. Keep them
  isolated so a failing unit can be reverted without disturbing prior upgrades.
- Lock regeneration can reveal abandoned transitive packages. Prefer upgrading
  or removing the direct owner; use resolutions only for documented, temporary
  security constraints.
- Tailwind 4 and Sass changes can silently alter CSS output. Compare generated
  extension assets and complete the visual checklist before accepting them.
- If a latest major has no viable peer set on Node 26, record the evidence and
  retain the newest compatible release rather than disabling validation.
- Recovery is `git revert` of the individual semantic migration commit. Do not
  rewrite history or bypass hooks.

## Direct rollout

The extension is built directly from the upgraded branch. No data migration or
feature flag is required. Release artifacts are regenerated only after the full
matrix and smoke checklist pass.

## Executable checklist

- [x] Restore a green Node 26 baseline.
- [x] Add explicit typecheck and test scripts.
- [x] Upgrade Node/package-manager metadata and regenerate the root lock.
- [x] Complete each compatible dependency family in roadmap order.
- [x] Upgrade and test `devapp-3.4`.
- [x] Audit the frozen Meteor 2 fixture graphs and document exceptions.
- [x] Pass lint, typecheck, tests, both builds, and enforced audits.
- [x] Validate the generated Firefox extension with `web-ext lint`.
- [x] Write the dependency-migration decision record.
- [x] Upgrade CI to Node 26 with tests and dependency auditing.

## Verification record

The completed outcomes, verification commands, and accepted ecosystem
constraints are recorded in `decisions/2026-08-31-node-26-dependency-upgrade.md`.
