# Playground workspace tabs

## Problem, evidence, and agreed outcome

The Playground stacks seven sections in one scroll area. Its full editor and
metadata push response data out of view. The user approved Run, Compare, Matrix,
Catalog, and Saved subtabs, with a responsive side-by-side editor/results layout
and response/error, status, duration, and relevant warnings visible first.

## Contracts and scope

- Default to Run. Use keyboard-accessible tabs; preserve drafts, selections,
  expanded details, active runs, and matrices when switching tabs.
- Give results the larger column on wide panels; stack on narrow panels.
- Collapse execution settings and secondary run metadata. Show execution context
  near Run; keep errors, incomplete evidence, authentication context, and relevant
  publication/late-result warnings available without opening details.
- Keep the full evidence, submitted request, snapshots, baseline, and expectations
  available under Run details. Preserve all existing runner semantics.
- Opening captured drafts or saved cases returns to Run. Inspecting a matrix run
  returns to Run; saved comparison actions open Compare. Background run updates
  must not steal the selected tab.
- Saving and transfer review remain reachable from their initiating workflow.
  Pending review is contextual and visible outside the tab panels.
- No protocol, persistence, authentication, dependency, or execution changes.

## Risks and recovery

Hiding content can break existing action sequences and accessibility. Mounted,
hidden panels preserve local state; explicit navigation routes cross-panel
actions. Do not hide evidence qualifications with secondary metadata. Tab state
is in memory only. Revert the associated change to recover the former layout;
no stored-data migration is needed.

## Test strategy and executable checklist

- [x] Add failing navigation tests before implementation: tab switching does not
      dispatch or cancel work, draft/preview state survives, action destinations.
- [x] Implement navigation, compact editor, responsive Run layout, result summary.
- [x] Update existing integration workflows for tab navigation and details.
- [x] Add packaged browser tests for keyboard tabs, state retention, action
      routing, response visibility, and wide/narrow geometry.
- [x] Run unit tests, typecheck, lint, Chrome build/validation, packaged UI tests,
      and focused Meteor Playground integration when the fixture is available.
- [x] Update usage/demo documentation, changelog, decision, and verification.

## Direct rollout

Ship with the normal extension build. Existing cases, snapshots, and bookmarks
remain readable. No feature flag or release version change is required.

## Verification and reviewer handoff

- All 395 unit tests passed across 63 files. New navigation tests first failed
  on the missing tab API, then passed. They cover preserved draft/preview state,
  no navigation commands, and explicit action destinations.
- All 11 packaged UI tests passed. New tests cover keyboard tabs, mounted state,
  catalog-to-editor routing, wide/narrow geometry, visible response/error and
  warnings, collapsed details, and background updates preserving the active tab.
  Wide, narrow, and populated-results screenshots were visually inspected.
- All 12 Meteor 3 Playground integration tests passed: replay, shared and isolated
  publications, authentication, snapshots, imports, matrices, timeouts, late work,
  cross-profile comparisons, and captured/bookmarked drafts.
- Typechecking, lint, formatting, and diff whitespace checks passed. Chrome
  production build and package validation passed. Firefox build and validation
  were also run; Firefox runtime and Meteor 2 integration were not exercised.
- Builds emitted the bundle-size warning; browser tests emitted the NO_COLOR /
  FORCE_COLOR warning. Browser launches required sandbox escalation. These did
  not prevent the executed checks from passing.
- No scope deviations or format/interface migrations. The minor execution-setting
  disclosure and context summary implement the agreed compact editor. Pending
  transfer review remains contextual above panels rather than becoming a tab.
- Review navigation state and tests first, then Playground layout, RequestEditor,
  RunResults and styles, integration navigation updates, and usage/demo docs.
  Unreleased changelog agrees with unchanged manifest versions and compatibility.
- Rollback: revert the task commit. Existing stored records remain compatible;
  reverting presentation does not undo already-dispatched server operations.
