# Custom Toolbar Connection Selector

## Context

The connection control used Blueprint's `HTMLSelect`, which retains a
browser-native select surface. Its appearance and popup could not consistently
match the extension's custom toolbar action buttons or show active connection
state in the dropdown.

## Decision

Build a typed `ConnectionSelector` from the existing toolbar `Button` and
Blueprint's controlled `PopoverNext`, `Menu`, and `MenuItem` primitives. Keep
the active connection controlled by `PanelStore`, use local state only for the
popover, identify choices by connection ID, and close after selection.

## Rejected alternatives

- Further CSS overrides on `HTMLSelect` were rejected because the browser still
  owns the popup and much of the control rendering.
- Adding `@blueprintjs/select` was rejected because the current connection list
  is small and core popover/menu primitives provide the required behavior
  without another production dependency.
- Reusing visible connection names as values was rejected because names are not
  guaranteed unique.

## Rationale

Using the project's button provides exact toolbar visual behavior, while
Blueprint retains robust popup positioning, keyboard dismissal, menu roles, and
active-item styling. Controlled selected state avoids divergence from scoped
panel data.

## Consequences

The trigger exposes `aria-haspopup`, `aria-expanded`, and `aria-controls`, and
truncates only unusually long active labels within its bounded toolbar width.
The menu shows full connection labels and marks the active item. The component
adds local open-state logic but no dependency or persisted state.
