# Playground progressive workspace

## Problem and evidence

The Playground preserves important DDP safety and evidence semantics, but it
presents five peer-level sections and several JSON authoring formats before a
user can understand the primary request-and-response workflow.

The current panel exposes Run, Compare, Matrix, Catalog, and Saved tabs. The Run
editor also mixes invocation controls with execution context, case metadata,
expectations, and comparison exclusions. Matrix definitions, expectations, and
transfer masks require users to author JSON without guided controls.

The desired outcome is to retain every existing capability and persisted
contract while making the ordinary workflow obvious:

```text
Run --------------------------------> result
 |                                      |
 +-- observed endpoint suggestions      +-- save result
 +-- advanced execution/testing

History
 +-- cases and snapshots
 +-- compare selected evidence
 +-- reviewed import/export
```

## Agreed scope

- Replace the five Playground tabs with two keyboard-accessible surfaces: Run
  and History.
- Keep the request editor and result summary primary in Run.
- Keep observed endpoint suggestions inline and move the detailed catalog into
  a secondary disclosure instead of a top-level destination.
- Place execution settings, case metadata, expectations, and matrices in a
  clearly labeled advanced-testing area.
- Provide guided builders for expectations, matrix changes/candidates, and
  transfer masks. Preserve optional raw JSON editing as an expert escape hatch.
- Combine saved cases, immutable snapshots, comparison, and transfer entry
  points under History without changing their domain contracts.
- Restructure documentation around a quick start, task recipes, safety, and an
  advanced reference.
- Manually inspect the packaged Chrome extension against the Meteor 3 fixture.
  Run automated compatibility checks for Meteor 2.

## Contracts and constraints

- Do not change the Playground command protocol, execution semantics,
  authentication boundary, no-retry behavior, operation ownership, or quotas.
- Do not change IndexedDB schema version 1 or Playground file format version 1.
- Existing cases, snapshots, imports, bookmarks, captured drafts, and active
  panel workflows must remain usable.
- Opening a captured draft or saved case returns to Run. Choosing comparison
  evidence or completing save/export work routes to the appropriate surface.
- Navigation and disclosures must never dispatch, stop, retry, or retarget an
  operation.
- Guided controls must serialize to the existing validated JSON formats. Raw
  mode must round-trip the same model and expose existing validation errors.
- Retain keyboard tab behavior, visible focus, semantic labels, responsive
  editor/result layout, warnings, and error/status announcements.
- No production dependency changes are authorized or expected.

## Uncertainty and decisions within scope

The advanced features contain heterogeneous union types. The first guided
builders will favor explicit, compact rows over a generic schema-form system.
This avoids a new architectural dependency and keeps each domain's terminology
visible. Raw editing remains available for uncommon combinations and exact
copy/paste workflows.

History contains distinct mutable cases and immutable snapshots. They remain
separate sections and record types even though the navigation groups them.

## Test strategy and acceptance criteria

Tests are designed before implementation and extend the existing Vitest and
packaged-panel Playwright architecture.

- [x] Add failing navigation tests proving that only Run and History are
      top-level tabs and that advanced/catalog disclosures preserve state.
- [x] Add failing routing tests for catalog examples, saved cases, snapshots,
      comparisons, and transfer review.
- [x] Add failing builder tests proving expectation, matrix, and mask controls
      produce the existing JSON contracts and raw JSON remains available.
- [x] Verify guided edits invalidate matrix previews exactly as equivalent raw
      edits do, without dispatching commands.
- [x] Verify keyboard navigation, narrow/wide layout, empty states, visible
      response summaries, and focus behavior in the packaged panel.
- [x] Run focused tests during implementation, then the full unit suite,
      typecheck, lint, Chrome build/validation, packaged UI tests, Meteor 3 live
      Playground integration, and automated Meteor 2 compatibility coverage.
- [ ] Manually inspect Run, Advanced testing, endpoint browsing, History,
      comparison, and transfer review in packaged Chrome against Meteor 3;
      capture screenshots and console errors.
- [x] Update the usage guide, focused recipes, README, changelog, decision, and
      verification record to match behavior actually checked.

The headed Chrome session reached the Meteor 3 fixture with the unpacked
extension and opened DevTools, but Chrome did not expose its custom panel as an
automation target. macOS denied assistive-access automation and display capture,
so the native panel click-through remains explicitly unverified. The packaged
panel and live Meteor 3 workflows passed automated coverage.

Acceptance is observable when a first-time user can compose and run a request
without encountering advanced concepts, while every previous workflow remains
reachable and its stored/protocol representation is unchanged.

## Risks and mitigations

- Hidden controls may become undiscoverable. Use descriptive advanced and
  history entry points, useful empty states, and contextual documentation links.
- Guided builders may emit invalid intermediate values. Use valid defaults,
  immutable row updates, and existing parsers as the final validation boundary.
- Moving actions may break cross-workflow routing. Cover each destination in
  store and packaged-panel tests before changing the layout.
- Grouping records may imply cases and snapshots share mutability. Preserve
  explicit section labels and explanatory copy.
- Manual browser testing may require a headed Chromium launch outside the
  filesystem sandbox. Request only the scoped launch approval if needed.

## Recovery and direct rollout

Ship through the normal extension build without a feature flag or data
migration. A revert of the associated implementation commits restores the
previous layout. Because protocols and persisted formats remain unchanged,
rollback neither deletes records nor invalidates exported files.

## Reviewer order

1. Navigation and routing tests, then Playground composition and styles.
2. Guided builder utilities/components and their focused tests.
3. History, comparison, catalog, and transfer integration.
4. Documentation, changelog, decision, and verification evidence.
5. Packaged extension screenshots and Meteor compatibility results.
