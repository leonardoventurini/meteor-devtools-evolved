# Playground endpoint suggestions

## Problem and evidence

The name editor is a plain input while the existing observed endpoint catalog
is below the matrix UI. Users must know an endpoint name or find that separate
section. The user selected suggestions that load both the name and arguments.

## Scope and contracts

- Add an editable, keyboard-accessible combobox to the existing request editor.
- Search observed names by case-insensitive substring, current page, confirmed
  connection, and operation kind. Keep manual entry available.
- Explicit selection loads the latest retained argument sample, preserving EJSON.
  Typing alone must not replace arguments or dispatch a request.
- Reuse captured-draft behavior: clear saved-case association and request masks,
  invalidate matrix preview, retain execution mode and session label.
- Resolve selections against current scope; never resurrect a stale endpoint.
- If no sample was retained, load an empty array and visibly ask for argument
  review. A retained sample can predate an omitted oversized observation.
- No protocol, persistence, dependency, or server-discovery changes.

## Uncertainty and risks

The catalog describes observed traffic, not all server registrations. Samples
over 4 KiB are omitted. Replacing arguments is intentional only on selection.
Keyboard focus, dismissal, and long-name overflow require browser verification.

## Executable checklist and verification

- [x] Add and run failing store tests for scope, argument selection, missing
      samples, EJSON, manual typing, and no dispatch.
- [x] Implement store selection and editor combobox with mouse/keyboard support.
- [x] Add packaged-panel browser coverage for search, selection, dismissal,
      manual input, and filtering.
- [x] Run focused unit tests, typecheck, lint, Chrome build and validation,
      and packaged UI tests.
- [x] Update usage documentation and Unreleased changelog; record decision.

## Direct rollout and recovery

Ship with the next normal extension build. No migration or feature flag is
needed. Revert the associated commit to restore the plain input; stored records
and the existing catalog remain compatible.

## Verification and reviewer handoff

- All 393 unit tests passed across 63 files; the added store tests first failed
  for the missing selection API, then passed after implementation.
- Typechecking and lint passed. Chrome production build and validation passed.
- All six packaged-panel UI tests passed, including mouse/keyboard selection,
  scope filtering, manual typing, Escape/Tab dismissal, click reopening, and
  long-name overflow at a narrow viewport. Inspected the dropdown screenshot.
- Chromium required execution outside the filesystem sandbox to launch. The
  initial browser failures were test locator and JSON key-order assumptions;
  corrected assertions use accessible roles and structural JSON comparison.
- Build emitted the bundle-size warning; browser tests emitted the NO_COLOR /
  FORCE_COLOR warning. Live Meteor integration and Firefox runtime tests were
  not run for this editor-only change. Existing integration selectors were
  updated for the input's combobox role.
- No behavior or scope deviations. Review store selection and its tests first,
  then EndpointInput and its scoped styles, RequestEditor wiring, and the
  packaged-panel test. Usage documentation and Unreleased changelog are updated;
  manifest versions and compatibility policy are unchanged.
- Rollback is a revert of the feature commit; no migration is required.
