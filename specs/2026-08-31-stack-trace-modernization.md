# Modernize Stack Trace Inspection

## Problem

Captured DDP stack traces are dominated by Meteor transport and generated async
frames, display only callee names, and open source URLs as ordinary browser
tabs. This makes it difficult to find the application call site that triggered
a message.

## Evidence

- Capture is limited to 15 frames, most of which can be consumed by Meteor DDP
  transport and Babel-generated async helpers before reaching application code.
- The parser accepts only `callee (URL)` stack syntax and does not retain the
  original line or extract source line and column fields.
- The drawer has no cleaned/raw view and does not collapse duplicate frames.
- Frame links use normal anchors rather than the DevTools source-panel API.
- Blueprint's legacy popover implementation reports incorrect positioning
  under React 19 and must be migrated rather than suppressed.

## Uncertainty

Stack formats vary across Chrome, Firefox, source maps, eval frames, and Meteor
versions. Parsing must degrade to a readable raw frame instead of discarding an
unknown format. Browser source maps ultimately determine whether DevTools can
resolve a bundled URL to original application source.

## Contracts

- Preserve every captured raw frame and parse callee, URL, line, and column when
  available.
- Default to a cleaned view that removes known extension, Meteor transport,
  runtime, and generated async helper frames.
- Collapse adjacent duplicate frames while retaining their occurrence count.
- Highlight likely application frames and show source locations.
- Allow switching between cleaned and full raw views.
- Open parseable sources through `devtools.panels.openResource`; unknown frames
  remain visible but non-clickable.
- Keep capture and formatting strongly typed and independently unit tested.
- Use only Blueprint's React 19-safe popover implementation.

## Risks

- An over-broad internal-frame rule could hide user functions with generic
  names such as `next` or `Promise`.
- Firefox may not expose the same source-opening behavior as Chromium.
- Increasing the capture limit adds a small amount of work to each non-heartbeat
  DDP event.

## Recovery

The raw view always exposes the unfiltered captured frames. Reverting the
implementation commit restores the current 15-frame name-only drawer.

## Direct rollout

Ship the cleaned view as the default after parser, formatter, typecheck, browser
build, and manifest validation pass. No data migration is required because
stack traces are ephemeral.

## Verification

- Unit-test Chrome/Firefox stack syntax, unknown frames, internal classification,
  application highlighting, filtering, and duplicate collapsing.
- Verify lint, typecheck, all root tests, both browser builds, and generated
  manifest contracts.
- Manually trigger a Meteor method from application code and verify clean/raw
  switching plus source navigation in DevTools.

## Executable checklist

- [x] Add and observe failing stack parsing and formatting tests.
- [x] Capture a larger raw trace and parse structured source locations.
- [x] Add internal filtering, application classification, and duplicate groups.
- [x] Add cleaned/raw drawer modes and DevTools source navigation.
- [x] Update the changelog and architecture decision record.
- [x] Run the complete verification suite.
- [x] Commit the verified unit semantically without bypassing hooks.
