# DevTools Settings Page

## Problem

The DDP startup-history preference lives in a standalone browser Options page,
separate from the DevTools workflow it controls. The page also inherits browser
extension-page presentation that does not match the compact panel interface.

## Evidence

`src/entrypoints/options` packages a dedicated `options.html`, while panel
navigation is enum-driven through `PanelPage` and `TabBar`. The setting already
uses extension-local storage and can be consumed unchanged inside the panel.

## Desired outcome

Move settings fully into a bottom-anchored sidebar tab in the DevTools panel,
remove the standalone Options entrypoint, and make the reload boundary explicit
after policy changes.

## Scope and contracts

- Add a gear-icon Settings tab anchored at the bottom of the 160px sidebar.
- Render a panel-native, vertically scrollable Settings page.
- Reuse `DDPHistoryPolicy`, its storage key, validation, and persistence helpers.
- Persist radio changes immediately without clearing the active panel session.
- After successfully saving a choice that differs from the session's initially
  loaded policy, immediately open an accessible reload dialog.
- Offer `Reload now`, which calls `location.reload()`, and `Later`, which
  dismisses the dialog while retaining the saved choice.
- Do not prompt after a failed save or when the user restores the session's
  initial choice.
- Preserve loading, saving, and storage-error feedback.
- Remove the standalone Options component, WXT entrypoint, stylesheet,
  `options_ui` build expectation, and obsolete E2E route.
- Keep the extension `storage` permission because the panel and background
  worker still share the preference.

## Uncertainty

Reloading a directly opened packaged panel in E2E is not identical to a docked
Chrome DevTools instance, but exercises the same extension page, storage, and
React navigation code.

## Risks and recovery

Removing `options.html` changes a browser-visible extension surface. This is
explicitly approved. Git can restore the entrypoint; the persisted key remains
unchanged, so rollback requires no data migration.

## Executable checklist

- [x] Add failing panel routing, bottom-anchor, settings UI, and build tests.
- [x] Add the Settings page and sidebar route.
- [x] Add an immediate reload dialog with reload-now and later actions.
- [x] Remove the standalone Options surface and update build validation.
- [x] Migrate packaged E2E coverage and user documentation.
- [x] Record the architectural decision and changelog outcome.
- [x] Run tests, lint, typecheck, Chrome build, build validation, and checks.

## Direct rollout

Ship directly in the next extension package. Existing saved preferences are
read under the same key when users open Settings in DevTools.

## Verification

Acceptance requires bottom-anchored navigation, persisted policy selection,
non-destructive current-session behavior, visible reload guidance, removal of
the standalone Options artifact, and successful project verification.
