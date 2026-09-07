# Playground workspace tabs

## Context and decision

The single scrolling Playground made results compete with the full request
editor, catalog, matrix, saved records, and comparisons. The user approved
responsive editor/results columns and a summary showing response/error, status,
duration, and relevant warnings first.

Create Run, Compare, Matrix, Catalog, and Saved tabs. Run gives results the larger
column when the available panel width permits; narrow panels stack the editor
above results. Execution settings and secondary run evidence are disclosures.
Keep evidence qualifications and current execution context visible.

## Rationale and alternatives

Mounted hidden tab panels preserve component state, expanded controls, and saved
record selections. Navigation uses separate in-memory state and does not call
request-edit logic, cancel operations, or invalidate matrix previews. Explicit
cross-panel actions select their destination; background run events do not.

Separate Request/Results tabs would require more switching while editing and
re-running, so retain both in Run. Conditional unmounting would lose local UI
state. Persisting the active tab adds a storage contract with little benefit;
start in Run for each panel session. Pending transfer review remains contextual
above tab content so existing save/import/export review cannot become hidden.

## Consequences and recovery

Existing automation and demo instructions must navigate tabs and expand details.
All evidence remains accessible, with no changes to runner, protocol, storage,
authentication, dependencies, or compatibility policy. A coordinated revert
restores the former presentation without migration or loss of saved records.
