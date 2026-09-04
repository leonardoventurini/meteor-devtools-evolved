# Safe Compass Regex Literals

## Context

The query form accepts Compass-style object syntax through JSON5, but JSON5
does not support JavaScript regular-expression literals. Using JavaScript
evaluation would violate the query engine's security contract.

## Decision

Introduce a narrow lexical preprocessing step that recognizes regex literals
only where object/array values may begin, preserves strings and comments, and
replaces each literal with a collision-free temporary token before JSON5
parsing. Hydrate only tokens created during that parse into `RegExp` instances.

Keep raw query strings as the persisted contract. Extend the field operator
allowlist with `$contains`, `$regex`, and `$options`, and evaluate native
`RegExp` instances with `lastIndex` reset before every match.

## Rejected alternatives

- `eval` and `Function` were rejected because selectors must never execute
  arbitrary JavaScript.
- A production parser dependency was rejected because the required grammar is
  limited to regex literals in value positions.
- Storing serialized regex objects was rejected because raw query input already
  preserves syntax and avoids a persisted-format migration.
- Server-style `$text` was rejected because captured snapshots have no MongoDB
  text index and could not reproduce its semantics faithfully.

## Rationale

The scanner provides familiar Compass input while retaining a strict data-only
parser. Temporary per-parse tokens avoid reserving a magic string in the user
document domain.

## Consequences

The local evaluator supports unrestricted native JavaScript regex patterns as
requested. Pathological patterns may block the panel thread; this accepted risk
is documented in the drawer guidance and can later be replaced with a bounded
regex engine if requirements change.
