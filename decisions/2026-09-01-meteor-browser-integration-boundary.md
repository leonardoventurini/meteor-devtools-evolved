# Meteor Browser Integration Boundary

## Context

The extension previously relied on unit tests, static build validation, and
server-side Meteor fixture tests. None launched the packaged extension against
actual Meteor 3 client code. The extension's most important compatibility path
crosses a Manifest V3 worker, an isolated content script, a page-world injector,
the Meteor DDP runtime, and a Chrome-hosted custom DevTools panel.

Playwright supports loading unpacked extensions in a persistent context using
its bundled Chromium channel. It does not expose Chrome's custom DevTools panel
as a supported `Page` target, and directly opening the packaged panel does not
grant `browser.devtools.inspectedWindow`.

## Decision

Use a pinned Playwright Chromium runner as the blocking browser-integration
gate for the stable, public automation boundary. The suite loads the production
Manifest V3 output against `devapp-3.5` and verifies:

- service-worker startup and production page-world injection;
- correlated Meteor method/result DDP traffic;
- default and additional DDP connection discovery;
- subscription snapshots;
- named and unnamed Minimongo documents; and
- packaged DevTools panel rendering.

Exercise panel-to-page requests through the production page-world receive
function, using the same message contracts emitted by
`browser.devtools.inspectedWindow.eval`. Keep bridge/store consumption covered
by Vitest. Treat the final Chrome-owned custom-panel binding as a documented
headed release smoke rather than a private-CDP CI dependency.

Run the integration job in parallel with the existing verification job. Pin
`@playwright/test` exactly, install its matched Chromium separately, and retain
failure diagnostics for seven days.

## Rejected Alternatives

- **Automate `devtools://` with private CDP targets.** This could reach the
  custom panel but couples a blocking gate to Chromium frontend internals and
  unstable selectors.
- **Open only the panel as an extension tab.** This validates static rendering
  but cannot prove Meteor injection or runtime capture.
- **Use a mocked Meteor browser page.** This misses the Meteor 3 compatibility
  contract that motivated the suite.
- **Add shipped test-only extension hooks.** Existing production requests are
  sufficient and avoid increasing runtime surface area.
- **Install branded Google Chrome.** Current extension sideloading support is
  defined for Playwright's bundled Chromium channel.

## Rationale

The selected boundary catches real packaging, injection, protocol, and Meteor
runtime regressions while remaining deterministic and supported in headless CI.
It also protects the unnamed-collection and multi-connection behaviors that
have recently regressed. The documented manual smoke makes the one unsupported
browser-owned boundary explicit instead of overstating automated coverage.

## Consequences

- Contributors install a Playwright-managed Chromium revision and run
  `yarn test:e2e` after building Chrome.
- CI spends additional time installing Meteor, Chromium, and fixture packages,
  but this work runs in parallel with existing verification.
- Chrome integration is automated; Firefox retains build, manifest, and
  `web-ext` validation.
- Browser traces, screenshots, and videos are available only for failed runs.
- If Chrome later exposes custom panels through a stable automation API, the
  manual boundary can move into the blocking suite without changing the
  production message protocol.
