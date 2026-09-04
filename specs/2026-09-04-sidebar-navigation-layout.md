# Sidebar Navigation Layout

## Problem

The five primary panel tabs, connection selector, and utility actions compete
inside a 29px horizontal toolbar. Labels and controls compress unpredictably as
DevTools width changes, making the toolbar appear squashed and fragile.

## Evidence

- `TabBar` renders primary tabs and right-side actions in one fixed-height row.
- `NAVBAR_HEIGHT` is 29px even though interactive controls fill that entire
  height.
- The tab strip has no independent width or overflow boundary.
- `TabBar` duplicates the selected tab in component-local state rather than
  deriving it from `PanelStore`.

## Desired outcome

Move primary navigation into a fixed 160px left sidebar beginning below a 40px
top toolbar. Keep the connection selector and utility actions at the top right,
and make panel geometry derive from shared constants.

## Scope and contracts

- Sidebar contains DDP, Bookmarks, Minimongo, Subscriptions, and Performance.
- Top toolbar spans the viewport and contains only connection and utility
  controls.
- Sidebar begins below the toolbar and occupies the remaining panel height.
- Main panel content is offset by the exact sidebar width and toolbar height.
- Sidebar items have stable 32px full-width hit targets, no outer vertical
  inset, and vertical scrolling.
- Active navigation derives from the authoritative panel store.
- Preserve existing handlers, icons, accessible labels, menu collapse, and
  connection behavior.
- Keep the 29px panel status-bar height independent from the top toolbar.

## Uncertainty

No collapsible sidebar was requested. The 160px width is fixed at all supported
panel widths; the existing 600px minimum layout width remains unchanged.

## Risks and recovery

Incorrect shared offsets could hide content behind navigation or reduce usable
panel height. Structural tests will bind layout offsets to the shared constants.
The change is recoverable by restoring the former single-row `TabBar` and
removing the sidebar offset.

## Executable checklist

- [x] Add structural tests for toolbar/sidebar separation and geometry.
- [x] Add controlled active-tab coverage.
- [x] Introduce shared 160px sidebar and 40px toolbar constants.
- [x] Split `TabBar` into top-toolbar and sidebar regions.
- [x] Offset the panel layout using shared constants.
- [x] Keep status-bar sizing independent.
- [x] Update changelog and record the layout decision.
- [x] Run all tests, lint, typecheck, Chrome build, and whitespace checks.

## Direct rollout

Ship directly in the next extension build. No data migration or feature flag is
required.

## Verification

Acceptance requires source-level geometry tests, authoritative active-tab state,
unchanged accessible connection controls, and successful full project checks.
