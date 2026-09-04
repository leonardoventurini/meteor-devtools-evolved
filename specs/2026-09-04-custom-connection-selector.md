# Custom Toolbar Connection Selector

## Problem

Blueprint's `HTMLSelect` still presents a native select surface that does not
match the toolbar's custom action buttons. Its browser-controlled appearance
also limits reliable alignment, menu styling, active-state presentation, and
label behavior.

## Desired outcome

Provide a dedicated connection selector composed from the project's toolbar
button and Blueprint popover/menu primitives. It should look and behave like a
toolbar action while retaining accessible selection semantics and the existing
connection-scoped refresh behavior.

## Scope and contracts

- Display the active connection name in a toolbar-style button with a trailing
  caret.
- Open a Blueprint menu aligned below the trigger.
- Mark the active connection and close after a selection.
- Expose button popup, expanded, and controlled-menu relationships to assistive
  technology.
- Keep long trigger labels truncated within the existing width bounds while
  menu labels remain readable.
- Preserve `PanelStore.setActiveConnectionId` and `syncConnectionData` as the
  selection effects.
- Add no production dependency.

## Uncertainty

Connection display names are not guaranteed unique, so identity and selection
continue to use connection IDs rather than visible labels.

## Risks and recovery

A custom popup has more state than a native select. Keeping open state local and
selection state controlled by `PanelStore` avoids duplicate authoritative
state. Reverting to `HTMLSelect` restores the previous implementation.

## Executable checklist

- [x] Add structural accessibility and dismissal coverage.
- [x] Create a typed reusable connection-selector component.
- [x] Replace `HTMLSelect` without changing selection effects.
- [x] Style the trigger like existing toolbar actions.
- [x] Update changelog and record the UI decision.
- [x] Run full tests, lint, typecheck, Chrome build, and whitespace checks.

## Direct rollout

Ship directly in the next extension package. No data or permission change is
required.

## Verification

Acceptance requires an accessible controlled popover, active menu item,
selection dismissal, unchanged connection side effects, width-safe labels, and
successful full project verification.
