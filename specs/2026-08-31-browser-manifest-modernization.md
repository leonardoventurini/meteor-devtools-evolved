# Browser Manifest Modernization

## Problem

The Chrome and Firefox manifests still grant access to Google Analytics after
telemetry was retired. The Firefox manifest also lacks current AMO identity and
data-collection declarations, requests an unnecessary `tabs` permission, and
does not declare a supported-browser floor. Manifest versions are copied from
hand-maintained source files and can drift from `package.json`.

## Evidence

- Both manifests allow `https://www.google-analytics.com/*`.
- `src/Analytics.ts` and `src/Utils/Hooks/useAnalytics.ts` still send legacy
  Universal Analytics events.
- Firefox lint reports missing data-collection permissions and add-on ID.
- The published Firefox add-on ID is
  `{bcb0685a-df42-43b8-969f-7aae4b2b262b}`.
- The extension only needs normal HTTP(S) Meteor pages and uses no privileged
  `tabs` metadata APIs.

## Uncertainty

Firefox Manifest V2 remains the appropriate format for this extension today;
this work does not attempt a Firefox Manifest V3 migration. The browser-store
lint tools may continue to report bundle-level warnings unrelated to manifest
metadata.

## Contracts

- Chrome targets the current stable store with Manifest V3.
- Firefox targets desktop version 140 or newer and Android version 142 or
  newer with Manifest V2.
- The extension declares that it collects no data and contains no analytics
  sender or analytics host permission.
- Content injection is limited to HTTP and HTTPS pages in both browsers.
- Generated manifest versions always equal `package.json`'s version.
- Existing GitHub API access and user-facing navigation continue to work.

## Test strategy and acceptance criteria

A Vitest manifest contract test will parse both source manifests and verify:

- browser manifest versions and Firefox 140/Android 142 metadata;
- the published Firefox add-on ID and `required: ["none"]` data declaration;
- absence of Google Analytics origins and the Firefox `tabs` permission;
- identical HTTP(S) content-script scope, Chrome web-accessible-resource scope,
  and 16/32/48/128 icon coverage; and
- build-time manifest transformation to the package version.

After implementation, lint, typechecking, all tests, both production builds,
generated-manifest checks, and Firefox `web-ext lint` must pass without manifest
errors.

## Risks

- Raising Firefox's minimum version drops legacy Firefox installations.
- Narrowing `<all_urls>` removes injection on local `file:` pages and other
  non-web schemes.
- Removing analytics must not accidentally remove the navigation actions that
  previously emitted events.

## Recovery

Revert the task commit to restore the prior manifests and analytics code. Store
releases remain independently reversible through their existing release
processes.

## Direct rollout

Ship the updated Chrome and Firefox packages in the next normal store release.
No migration or staged server rollout is required.

## Executable checklist

- [x] Add and run failing manifest contract tests.
- [x] Remove the analytics implementation, hook, calls, and permissions.
- [x] Modernize Chrome and Firefox manifest metadata and URL scope.
- [x] Synchronize generated manifest versions from `package.json`.
- [x] Update README, changelog, and architectural decision record.
- [x] Run the complete verification suite and browser manifest lint.
- [ ] Commit the verified unit with a semantic message.
