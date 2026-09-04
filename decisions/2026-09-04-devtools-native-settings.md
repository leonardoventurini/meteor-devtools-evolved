# DevTools-Native Settings

## Context

The DDP startup-history setting was packaged as a standalone browser Options
page even though it controls how the DevTools panel initializes. This separated
the preference from its working context and produced inconsistent presentation.

## Decision

Move extension settings into a dedicated `PanelPage.SETTINGS` route, reached
through a gear tab anchored to the bottom of the existing sidebar. Reuse the
same extension-local storage contract and background-worker consumer.

Persist changes immediately but never discard an active inspection session as
a side effect of selecting a radio option. After a successful change that
differs from the policy loaded for the current session, immediately show an
accessible confirmation dialog with `Reload now` and `Later` actions. Remove
the standalone WXT Options entrypoint and its `options_ui` manifest surface.

## Rejected alternatives

- Keeping both settings surfaces was rejected because duplicated UI can drift
  and undermines the requested move.
- Clearing displayed and cached DDP history immediately was rejected because a
  preference change should not unexpectedly destroy the active investigation.
- Automatically reloading on selection was rejected because it interrupts the
  user without an explicit action.
- Keeping a large warning callout inside the settings card was rejected because
  it distorted the page hierarchy and made a transient decision look like
  persistent settings content.
- Placing Settings among the primary data pages was rejected in favor of a
  stable bottom anchor convention for utility navigation.

## Rationale

The setting is easier to discover and understand beside the DDP tools it
controls. Explicit reload guidance preserves user control while aligning the
saved policy with the background cache's existing initialization boundary.

## Consequences

The browser extension no longer exposes `options.html` or `options_ui`.
Existing saved policy values remain valid with no migration. Future settings
should be added to the panel page rather than introducing another extension
surface.

This decision supersedes the standalone Options-page placement in
`2026-09-03-ddp-history-start-boundary.md`.
