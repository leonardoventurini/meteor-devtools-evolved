# Playground progressive workspace

## Context and decision

The five Playground tabs made endpoint discovery, matrices, saved data, and
comparison appear as important as the ordinary compose-and-run workflow. JSON
was also the only authoring interface for expectations, matrix definitions, and
transfer redactions.

Replace the five top-level destinations with **Run** and **History**. Keep the
request editor and results primary in Run. Put the detailed observed-endpoint
catalog and execution, expectation, and matrix controls behind descriptive
disclosures. Group saved cases, immutable snapshots, comparison, and reviewed
transfer entry points in History without merging their record types.

Add domain-specific guided builders for expectations, matrix candidates, and
transfer redactions. Each builder serializes to the existing validated JSON
contract and retains raw JSON as an optional expert mode. Link the task-oriented
Playground guide from the workspace header.

## Rationale and rejected alternatives

Progressive disclosure lowers the number of concepts a new user encounters
before the first result while preserving advanced testing in context:

```text
Run -> request -> response
 |       |
 |       +-- advanced execution and checks
 +-- observed endpoint catalog

History -> cases and snapshots -> comparison and transfer
```

Removing advanced capabilities would reduce test coverage and evidence value.
Keeping five peer tabs would retain the navigation burden. A generic schema-form
dependency would obscure Playground terminology and add production weight, so
the builders use explicit typed controls and existing parsers instead.

The prior five-tab decision is superseded for navigation only. Its requirements
to keep components mounted, preserve drafts and selections, avoid background
tab changes, and isolate navigation from execution remain in force.

## Consequences and recovery

Advanced controls require one deliberate disclosure action, and saved records
now share a top-level workspace with comparison. The guide link and descriptive
section names offset the added depth. Raw JSON remains available for exact
copy-and-paste workflows and invalid input recovery.

The command protocol, IndexedDB schema, file format, authentication boundary,
execution semantics, limits, and dependencies do not change. Existing cases,
snapshots, and exports remain compatible. Reverting the navigation and builder
commits restores the prior presentation without migration or record loss.
