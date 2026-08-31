# Migrate Extension Builds to WXT

## Problem

The extension uses a custom Webpack configuration to bundle five entrypoints,
copy browser assets, select separate Chrome and Firefox manifests, synchronize
versions, watch files, and coordinate `web-ext`. This duplicates extension-aware
functionality supplied by WXT and makes the cross-browser build harder to evolve.

## Evidence

- Four browser-specific Webpack configuration files wrap one custom base.
- Manifest selection and version transformation are repository-owned build code.
- HTML pages reference fixed `/dist/*.js` paths generated only by Webpack.
- Development scripts separately coordinate Webpack, `wait-on`, `web-ext`, and
  the Meteor fixture.
- WXT 0.21.4 supports Vite 8, Chrome MV3, Firefox MV2, file-based devtools and
  unlisted entrypoints, browser startup, and store packaging.

## Uncertainty

WXT owns output filenames and manifest generation, so exact packaged artifacts
will differ while preserving their behavioral contracts. Browser automation
cannot fully prove the inspected-page bridge without an interactive smoke test;
build contracts and store lint provide the automated boundary.

## Contracts

- Chrome continues to build as Manifest V3 and Firefox as Manifest V2.
- Firefox identity, compatibility, no-data declaration, minimal permissions,
  and Chrome/Firefox HTTP(S) injection scope remain unchanged.
- The devtools page creates the existing Meteor panel and loads the React UI.
- The content script injects the page-world Meteor instrumentation exactly once
  through a web-accessible bundled script.
- `package.json` remains the canonical extension version.
- `yarn dev`, browser-specific development commands, production build commands,
  Just recipes, CI, and release packaging remain documented and functional.
- No active extension build depends on Webpack, Babel, or their loaders/plugins.

## Test strategy and acceptance criteria

Before implementation, update Vitest build-contract tests to require WXT scripts,
configuration, entrypoints, and removal of the Webpack build surface. During the
migration, retain source-manifest privacy assertions until equivalent generated
manifest assertions pass. After both builds, validate generated manifests for
browser version, package version, permissions, compatibility metadata, content
scripts, devtools page, background configuration, and web-accessible injection.

Acceptance requires immutable installation, lint, typechecking, all tests,
Chrome and Firefox production builds, generated-artifact contract tests,
Firefox `web-ext lint` with no errors or manifest warnings, dependency audits,
and a clean repository search for active Webpack build references.

## Risks

- Incorrect WXT entrypoint classification could omit the devtools panel or
  injected page-world script.
- WXT's generated manifest could add permissions or change MV2/MV3 background
  behavior.
- Vite handles static assets, JSX, Sass, and environment values differently.
- Development browser startup may conflict with the separately started Meteor
  fixture if command sequencing is wrong.

## Recovery

Revert the migration commit to restore the Webpack configuration, dependencies,
scripts, and extension directory layout. Store packages remain independently
recoverable through the prior release archives.

## Direct rollout

Use WXT for all local and CI builds immediately after automated verification.
Before publishing the next store release, manually load both generated packages
against `devapp-3.4` and verify panel discovery, DDP/Minimongo traffic, toolbar
navigation, and outbound links.

## Executable checklist

- [x] Add and run failing WXT build-contract tests.
- [x] Install WXT, Vite, and React integration at current compatible versions.
- [x] Create WXT configuration and migrate all extension entrypoints/assets.
- [x] Preserve and verify generated Chrome MV3 and Firefox MV2 manifests.
- [x] Replace development, build, CI, Just, and release commands.
- [x] Remove Webpack, Babel, loaders, plugins, and obsolete source manifests.
- [x] Update README, contributing guide, changelog, and decision record.
- [x] Run the complete verification and audit suite.
- [ ] Commit each verified migration unit semantically without bypassing hooks.
