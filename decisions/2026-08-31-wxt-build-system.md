# WXT Extension Build System

## Context

The extension maintained custom Webpack entrypoints, loaders, browser-specific
configurations, manifest copies, version transforms, development orchestration,
and release ZIP logic. Chrome and Firefox require different manifest and
background formats, while the inspected-page instrumentation also requires a
portable main-world injection strategy.

## Decision

Use WXT 0.21 with Vite 8 as the sole active extension build system. Model the
background, isolated content script, injected unlisted script, devtools page,
and panel as typed WXT entrypoints. Generate Chrome Manifest V3 and Firefox
Manifest V2 packages from a shared tested manifest policy, use WXT's browser API
and injection helper, and validate every generated artifact in CI.

WXT owns development browser startup and store ZIP creation. Firefox source ZIPs
use an explicit allowlist so obsolete generated artifacts, fixtures, and release
archives cannot be submitted accidentally.

## Rejected alternatives

- CRXJS was rejected because its Vite plugin is centered on Manifest V3 and
  would leave more custom Firefox Manifest V2 and release orchestration.
- A custom Vite multi-entry build was rejected because it would reproduce the
  manifest generation, browser reload, and packaging code being removed.
- Keeping Webpack as a fallback was rejected because dual build systems would
  permit behavioral drift and retain the dependency surface.
- Activating the dormant popup and options pages was rejected because neither
  existing browser manifest exposed them.

## Rationale

WXT directly represents browser-extension entrypoints and the project's current
Chrome MV3/Firefox MV2 split. Its main-world injection works across both formats,
while generated manifests and typed public paths reduce hand-maintained build
contracts. Artifact validation guards the output rather than assuming the
framework generated the expected files and permissions.

## Consequences

Contributors use WXT commands and `.output` artifacts. Webpack, Babel, their
loaders/plugins, copied manifests, and fixed `/dist` paths are gone. Generated
WXT types are prepared after installation and extended by the root TypeScript
configuration. Future entrypoints follow WXT naming and must remain free of
browser runtime side effects during build-time discovery.

The automated suite verifies package structure and store metadata. A manual
Chrome and Firefox smoke test against the Meteor fixture remains required before
the next store submission because build validation cannot exercise live DevTools
inspection behavior.
