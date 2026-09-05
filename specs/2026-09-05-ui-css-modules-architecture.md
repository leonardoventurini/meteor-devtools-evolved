# UI architecture and styled-components removal

## Outcome and approved scope

Replace styled-components completely with component-scoped CSS Modules and shared
CSS design tokens. Preserve the current UI appearance, interactions, accessibility,
and supported browser baselines. The user selected UI architecture scope, CSS
Modules while retaining Tailwind and Blueprint, and visual/behavioral preservation.
This authorizes restructuring UI components and removing the styling dependency.
Stores, injection, messaging, persistence formats, public protocols, and product
workflows retain their existing contracts. The package version remains 2.0.0.

## Evidence and uncertainty

Eighteen source files import styled-components. They cover the panel shell,
toolbar/status/shared controls, inspection tables, Settings, Playground, and JSON
trees. Styling currently mixes runtime templates, Sass, Tailwind, and Blueprint.
Dimensions and colors are partly duplicated. Playground contains several distinct
feature sections in one large component file. Some Vitest tests assert template
source strings, which cannot establish rendered layout parity after migration.

Vite supports CSS Modules without a new production dependency:
https://vite.dev/guide/features#css-modules. Shared CSS variables can also coexist
with the retained Tailwind utilities: https://tailwindcss.com/docs/theme.

The main uncertainty is CSS cascade parity: styled-components currently injects
styles at runtime, whereas modules become build-time assets. Nested descendants,
Blueprint portals, utility precedence, and forwarded className/ref/DOM props need
explicit review and rendered checks. Existing headless extension fixtures provide
the browser test infrastructure. SCS is unavailable in this session; exploration
uses repository searches and Git.

## Architecture and contracts

- Put semantic colors, spacing, and shell dimensions in a shared CSS token file
  loaded with application styles. Module styles consume these variables. Keep
  runtime geometry constants only where JavaScript actually needs them.
- Co-locate `.module.css` files with their owning components. Use local classes
  for component roots and owned elements. Scope intentional legacy/Blueprint
  descendant selectors explicitly with `:global`; avoid leaking module selectors
  into unrelated components or portal content.
- Keep shared React controls in `src/Components`, with normal DOM props and refs.
  Dynamic dimensions use typed CSS custom properties or existing native styles;
  visual variants use local classes, not styling-only DOM attributes.
- Keep the shell responsible for navigation/content geometry. Keep feature CSS
  local to the feature, and split Playground into cohesive editor/result/catalog/
  matrix/records/comparison/transfer presentation components as appropriate. State
  ownership remains in existing stores; do not introduce a second state layer.
- Remove unused styled mixins/breakpoints and the styled-components package/lock
  entries. Historical changelog/spec records may still mention the old dependency.
- Retain Blueprint, Tailwind, DaisyUI, and the current Sass base. Do not redesign
  controls or replace the library stack as part of this refactor.
- Preserve hidden-panel lifecycle, keyboard navigation, focus indication, tooltips,
  drawer/portal behavior, scrolling, virtualization, and responsive layout.
- Use proper TypeScript types in new component contracts. Do not weaken existing
  checks; do not turn this UI refactor into a whole-application strictness migration.

## Test strategy and acceptance criteria

Design and run a headless browser baseline before migrating the shell. Add rendered
checks for toolbar/sidebar/status geometry, navigation, Settings visibility and
padding, narrow panel overflow, and representative shared controls. Exercise
Playground and JSON inspection through existing browser workflows. Replace brittle
styling-template assertions with observable browser assertions or focused module/
semantic contract checks; retain existing behavioral tests.

1. No source imports, production dependency, lockfile resolution, or built runtime
   of styled-components remains. Historical documentation is exempt.
2. CSS modules and shared tokens build for Chrome and Firefox; manifest versions
   remain 2.0.0 and existing supported browser baselines remain unchanged.
3. Headless browser geometry/interaction checks pass before and after migration;
   existing Meteor 2.16 and 3.5.1 browser workflows pass after the full refactor.
4. Shared controls retain their external React contracts, usable focus and variant
   styles, and correct className/ref propagation. No styling props leak to the DOM.
5. Playground sections have cohesive component boundaries without changing store,
   execution, authentication, transfer, or persistence contracts.
6. Unit tests, lint, typecheck, builds, and artifact validation pass. Report actual
   checks, warnings, and unavailable browser coverage separately.
7. Contributor documentation, changelog, and an architecture decision reflect the
   final implementation. All task changes are committed with hooks enabled.

## Executable checklist and direct rollout

- [ ] Commit the spec and establish headless browser baseline coverage.
- [ ] Migrate shared controls and panel shell to modules and shared tokens.
- [ ] Migrate inspection features and JSON tree styles.
- [ ] Split Playground presentation components and migrate Playground/Settings.
- [ ] Remove obsolete styling infrastructure and dependency; update affected tests.
- [ ] Run full verification, review cascade and dynamic styles, fix regressions.
- [ ] Update documentation, record the decision and verification, commit handoff.

Independent feature scopes may be implemented concurrently; commits use explicit
paths and are serialized. Integrate in reviewable units and deliver one direct
rollout without feature flags or parallel old/new styling systems in the final tree.

## Risks and recovery

Cascade changes can alter control sizing or portaled dialogs even when CSS text is
equivalent. Rendered tests and built-asset review are necessary. New class names
must not become test-only APIs; retain existing semantic selectors where useful.
CSS variable defaults must exist for both panel and popup entrypoints.

No persisted data migration or permission change is required. Roll back by reverting
the task commits in reverse order and reinstalling the lockfile dependencies, then
rebuild both extension artifacts. Preserve unrelated release ZIPs and user processes.
