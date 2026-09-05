# Component-scoped UI styling and presentation boundaries

## Context

The panel combined styled-components runtime templates with Sass, Tailwind,
DaisyUI, and Blueprint. Eighteen files imported the runtime styling engine,
including reusable controls and all major inspection surfaces. Styling constants
and mixins duplicated CSS concerns; Playground combined its complete workflow
presentation in one 1,074-line file. The user approved a UI architecture refactor
using CSS Modules and shared tokens while preserving appearance and behavior.

## Decision

Use Vite's built-in CSS Modules for custom component styles and load shared CSS
tokens through `src/Styles/App.scss`. `src/Styles/Tokens.css` is the source for
shell dimensions, common spacing, and shared palette values. Preserve existing
Tailwind utilities and Blueprint/DaisyUI integrations.

Shared controls remain in `src/Components`; normal DOM props and refs retain their
existing contracts. Button now constructs its content once for both direct and
popover-wrapped rendering. The PopoverButton height is a typed CSS custom property;
Separator orientation becomes a local class instead of a styling-only DOM prop.
The shell's presentation lives in `PanelLayout` and its module stylesheet.

Playground composes separate request editor, result, endpoint catalog, matrix,
saved-record, comparison, transfer-review, and JSON evidence components. Existing
stores continue to own state and execution. Inspection views and Settings own
co-located module styles. Portaled Settings dialogs receive their own module class.

Use local classes for owned elements and scoped `:global` selectors for explicit
cross-component or Blueprint hooks. Retain the shared Button's `active` and
`content` hooks because navigation and collection controls intentionally consume
them. CSS nesting is handled by the existing build toolchain and browser targets.

Remove styled-components and polished, which became unused after replacing its
static palette calculations with their existing computed values. Remove obsolete
runtime mixins, breakpoint helpers, and JavaScript-only style constants. Historical
release notes and specs retain their original references.

## Alternatives and rationale

- A styling-only mechanical replacement would leave the large Playground file
  and duplicate Button rendering untouched; the approved UI scope includes these
  presentation boundaries.
- A Tailwind-only migration or removal of Blueprint/DaisyUI would expand visual
  and interaction risk beyond the selected approach.
- A replacement CSS-in-JS library would retain runtime styling and add another
  dependency. Vite already supplies module isolation and static asset extraction.
- Whole-application store/protocol restructuring and global TypeScript strictness
  migration are separate work. This change preserves those contracts and existing
  strict checks without weakening type safety.

## Consequences, verification, and recovery

The extension no longer ships the styled-components runtime. Styling can be
reviewed separately from behavior, shared layout values have a single CSS source,
and Playground presentation can be maintained section by section. Scoped legacy
hooks remain intentional coupling and must be reviewed when their consumers change.

Headless packaged-panel tests establish rendered geometry, actual colors,
responsive Settings padding, keyboard and dialog behavior, subscription truncation,
and JSON-tree interaction. They replace brittle template-string layout assertions.
`yarn test:ui` runs these checks without Meteor; the full integration suites also
include them. See the verification table in the associated spec for executed checks.

No public protocol, storage format, permission, or supported browser baseline
changed. Version remains 2.0.0; the new changelog entries are under Unreleased.
Rollback requires reverting the refactor commit, restoring lockfile dependencies,
and rebuilding both artifacts; no data migration is necessary.

Review shared tokens and shell geometry first, then shared controls, inspection
modules, Playground composition, and finally the headless tests and dependency diff.
