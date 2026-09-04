# Compass-style Minimongo Query Input

## Context

The captured-snapshot query interface accepted only strict JSON even though
users commonly bring filters from MongoDB Compass, where object keys and
operators may be unquoted. The interface also appeared as a centered modal,
which obscured more of the inspected document context.

## Decision

Parse selector, sort, and projection objects with the existing JSON5 runtime
dependency, treating whitespace-only values as empty objects. Continue to pass
the resulting inert data through the existing field-path and operator
allowlists. Align null equality with MongoDB, where `$eq: null` includes missing
fields and `$ne: null` excludes them. Present the editor as a right-side
Blueprint drawer.

## Rejected alternatives

- Rewriting unquoted keys with regular expressions was rejected because nested
  syntax, strings, comments, and escaping make textual rewriting fragile.
- Evaluating JavaScript object expressions was rejected because queries must
  never execute user-provided code.
- Expanding the supported MongoDB operator set was rejected because the request
  concerns input syntax and each new operator requires separately defined local
  snapshot semantics.

## Rationale

JSON5 provides familiar Compass-style authoring without code execution and is
already a production dependency. Keeping validation separate preserves the
query engine's explicit safety and behavior contract.

## Consequences

The fields now also accept JSON5 conveniences such as comments, single-quoted
strings, and trailing commas. Persisted query values remain strings, and there
is no migration. Unsupported operators and unsafe paths continue to fail with
validation errors.
