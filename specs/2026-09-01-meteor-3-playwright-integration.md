# Meteor 3 Playwright Integration

## Problem

The root Vitest suite validates extension modules in isolation, and the Meteor
3.5.1 fixture's test command validates server behavior. Neither suite launches
the built browser extension against a running Meteor 3 application. Regressions
across WXT output, Manifest V3 loading, page-world injection, DDP capture, and
Meteor runtime compatibility can therefore pass CI.

## Evidence

- `devapp-3.5` runs Meteor 3.5.1 and provides a published collection, two
  unnamed local collections, and an additional DDP connection.
- `src/entrypoints/content.ts` injects the production page-world script and
  forwards its messages to the extension worker.
- `src/Browser/Inject.ts` exposes the same page-world receive function used by
  `browser.devtools.inspectedWindow.eval` in production.
- The current CI builds and validates both extensions but never starts Meteor
  or a browser.
- Playwright officially supports unpacked Chromium extensions through a
  persistent context using its bundled Chromium channel.

## Scope

Add a Chromium Playwright integration suite that loads the production Chrome
build and runs it against the real Meteor 3.5.1 fixture. The suite will verify:

1. The MV3 service worker starts without an extension error.
2. The content script injects the production page-world script.
3. A deterministic Meteor method produces correlated outbound `method` and
   inbound `result` DDP events.
4. Production requests return the default and additional DDP connections.
5. A production Minimongo snapshot contains the published `links` collection
   and both seeded unnamed local collections with non-null documents.
6. A subscription snapshot contains the fixture's `links` subscription.
7. The packaged DevTools panel renders its stable navigation and empty states
   when opened directly as an extension page.
8. CI installs the matched Chromium build, starts the fixture, runs the suite,
   and uploads failure diagnostics.

Firefox extension integration and browser-store installation are outside this
change. Existing Firefox build validation remains mandatory.

## Testing Strategy and Acceptance Criteria

Testing is the first implementation boundary:

- Add a strict Playwright configuration and typed extension fixture before
  adding or changing fixture behavior.
- Capture page-world extension messages with `page.addInitScript` before
  navigation so startup events cannot race the test.
- Use predicates and DDP message IDs instead of message order or sleeps.
- Invoke `__meteor_devtools_evolved_receiveMessage` with the same messages the
  production DevTools bridge emits; do not add a shipped test-only hook.
- Require one worker, a unique temporary profile, CI retries limited to one,
  and traces/screenshots/videos only for failures or retries.
- Run the suite only after a production Chrome build and its manifest validator.
- Preserve the existing Vitest, lint, typecheck, browser builds, validators, and
  dependency audits as release gates.

The unit is accepted when immutable installation, lint, strict typecheck,
Vitest, Chrome build validation, Playwright integration, and relevant audits
all pass locally or in the closest available environment.

## Uncertainty

Chrome does not expose a custom DevTools panel as a supported Playwright `Page`
target. Opening `/devtools-panel.html` directly validates the packaged React UI
but does not grant `browser.devtools.inspectedWindow`. The stable automated
suite will therefore exercise the real extension through the page-world,
content-script, worker, and packaged-panel boundaries while existing unit tests
validate bridge/store consumption. A headed manual smoke will cover the final
Chrome DevTools-hosted panel binding.

Automating `devtools://` through private CDP targets was rejected for the
required CI gate because it is tied to Chromium internals and would turn routine
browser updates into test-infrastructure failures.

## Contracts

- The integration suite uses `.output/chrome-mv3` and fails clearly when it has
  not been built.
- The fixture remains a normal Meteor application; production extension code
  receives production message shapes only.
- Playwright is a root development dependency pinned to the browser revision it
  installs. It is not installed in the Meteor fixture.
- Local unit tests remain fast and browser-free; browser tests use a separate
  `test:e2e` command.
- New TypeScript test infrastructure is included in strict typechecking.
- Test artifacts and browser profiles are not committed.

## Risks and Mitigations

- **Meteor cold starts:** use Playwright's managed web server with a generous
  startup timeout and actionable captured output.
- **MV3 worker races:** wait for the worker event and required globals rather
  than sleeping.
- **Noisy DDP startup traffic:** correlate deterministic requests by protocol
  ID and inspect parsed payloads.
- **Port or profile collisions:** use one worker and a unique temporary profile;
  allow local reuse only when explicitly safe.
- **Browser/runner drift:** pin `@playwright/test` exactly and install its
  bundled Chromium.
- **CI diagnostic loss:** retain Playwright traces, screenshots, and videos on
  failure through a short-lived workflow artifact.

## Recovery

The integration layer is isolated to its dependency, configuration, E2E files,
scripts, workflow steps, and documentation. It can be reverted without changing
the production extension protocol. If the bundled Chromium temporarily breaks
extension loading, the E2E job may be reverted to the last known Playwright pin
while unit/build/audit gates remain active; the browser gate must not be silently
disabled.

## Direct Rollout

Land the test infrastructure and deterministic scenario in verified atomic
commits, then enable the CI gate after it passes locally. Update contributor
documentation, the changelog, and a decision record in the same change series.
No feature flag or staged production rollout is required because this changes
verification infrastructure rather than shipped runtime behavior.

## Executable Checklist

- [x] Add pinned Playwright dependency, strict configuration, ignored artifacts,
      and root scripts.
- [x] Add an initially failing integration scenario for the Meteor 3.5.1
      fixture and unpacked Chrome extension.
- [x] Add only the deterministic fixture behavior required by the scenario.
- [x] Verify worker startup, injection, DDP method/result capture, connections,
      Minimongo documents, subscriptions, and packaged panel rendering.
- [x] Add the browser gate and failure artifacts to CI.
- [x] Document browser installation, local execution, coverage boundaries, and
      the headed manual DevTools-panel smoke.
- [x] Update `CHANGELOG.md` under Unreleased.
- [x] Add the architectural decision record.
- [x] Run the complete verification matrix and dependency audits.
