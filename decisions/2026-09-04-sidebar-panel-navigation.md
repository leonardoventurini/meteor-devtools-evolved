# Sidebar Panel Navigation

## Context

Primary panel tabs, the connection selector, and utility actions shared a 29px
horizontal bar. At common DevTools widths, the five labeled tabs competed with
right-side controls and produced compressed, unreliable navigation geometry.
The tab bar also kept a local active key that could diverge from the panel
store's selected page.

## Decision

Move primary panel navigation into a fixed 160px left sidebar beginning beneath
a 36px top toolbar. Keep connection and utility controls right-aligned in the
top toolbar. Derive toolbar, sidebar, content, and status geometry from shared
constants, and make the selected panel store the sole source of active-tab
state. Use compact 32px sidebar rows without an outer vertical inset.

## Rejected alternatives

- Keeping all controls in a taller horizontal row was rejected because width,
  not only height, caused the labels and controls to compete.
- Collapsing tab labels to icons was rejected because it reduces immediate
  discoverability and requires tooltips to identify every section.
- Moving excess tabs into a menu was rejected because primary destinations
  would change location as the panel resized.
- A collapsible sidebar was rejected because the requested fixed 160px layout
  is simpler and provides predictable content geometry.
- Extending the sidebar through the toolbar was rejected because utility
  controls should remain in a continuous top-right region.

## Rationale

A vertical sidebar gives each primary destination a stable full-width target
and eliminates horizontal competition with connection and utility controls.
Shared constants prevent offsets from drifting, while controlled active state
keeps navigation and visible content synchronized.

## Consequences

The main content area is permanently 160px narrower, including at the existing
600px minimum width. Sidebar navigation scrolls vertically if future entries
exceed available height. The top toolbar has additional empty space by design
and retains the existing responsive utility-menu collapse behavior.
