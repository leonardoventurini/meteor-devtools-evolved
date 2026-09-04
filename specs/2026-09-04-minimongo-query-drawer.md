# Minimongo Query Drawer

## Problem

The structured Minimongo query editor opens as a centered modal and only parses
strict JSON. MongoDB Compass-style filters such as
`{ "name": { $ne: null } }` are rejected, and blank object fields are treated as
parse errors. Adjacent informational and validation callouts also lack explicit
spacing.

## Evidence

- `MinimongoQueryDialog.tsx` renders Blueprint's `Dialog`.
- `MinimongoQuery.ts` parses selector, sort, and projection with `JSON.parse`.
- The current unit suite covers strict JSON and safety validation, but not
  Compass-style object syntax or blank inputs.

## Scope and contracts

- Present the editor in a right-side Blueprint drawer.
- Accept JSON5 object syntax for selector, sort, and projection, including
  unquoted keys/operators and JSON values such as `null`.
- Match MongoDB's null selector behavior: `$eq: null` includes null or missing
  fields, while `$ne: null` requires an existing, non-null field.
- Treat blank or whitespace-only selector, sort, and projection inputs as `{}`.
- Preserve the existing operator allowlist, unsafe-path checks, positive-integer
  limit validation, and prohibition on JavaScript evaluation. Do not impose an
  upper limit on the requested result count.
- Add visible spacing between the informational callout, an optional validation
  callout, and the form fields.

## Uncertainty

"Similar to MongoDB Compass" can encompass operators beyond the currently
documented safe subset. This change applies Compass-style input syntax only;
the existing supported operator contract remains unchanged.

## Risks and recovery

JSON5 accepts comments, single quotes, and trailing commas in addition to
unquoted keys. This is parsing only: values remain inert data and are checked
against the existing allowlists. Reverting the parser import and drawer
component restores the prior behavior without a data migration.

## Executable checklist

- [x] Add parser regression tests for the reported selector and blank objects.
- [x] Add a structural UI regression test for the right-side drawer and spacing.
- [x] Replace the query dialog with a right-side drawer.
- [x] Parse query objects with JSON5 and normalize blank object fields.
- [x] Update the Unreleased changelog entry.
- [x] Run focused tests, full tests, lint, typecheck, and Chrome production build.

## Direct rollout

Ship with the next extension package; there is no feature flag or persisted-data
change.

## Verification

Acceptance requires the reported selector to match existing non-null names,
blank object inputs to parse as empty objects, positive integer limits above 500
to be accepted, invalid/unsafe operators to remain rejected, the UI source to
use a right-side drawer with explicit spacing, and the Chrome extension to
build successfully.
