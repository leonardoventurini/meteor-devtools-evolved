# Minimongo Text and Regex Query Support

## Problem

Captured Minimongo snapshots can currently be filtered only with equality,
comparison, membership, existence, and logical operators. Users cannot perform
field-scoped substring or regular-expression searches, and JSON5 does not
natively parse the regex literals commonly entered in MongoDB Compass.

## Evidence

`MinimongoQuery.ts` parses selectors through JSON5 and validates an explicit
operator allowlist. Its evaluator has no string or regex operator, while the
drawer advertises only the existing structural operators.

## Desired outcome

Support field-scoped `$contains`, Mongo-style `$regex`/`$options`, and
Compass-style `/pattern/flags` literals without evaluating arbitrary
JavaScript or changing persisted query input.

## Scope and contracts

- `$contains` accepts a string and performs case-sensitive literal substring
  matching against string field values.
- `$regex` accepts a string pattern or regex literal; `$options` accepts native
  JavaScript regex flags and is valid only beside `$regex`.
- A direct field regex literal behaves like a `$regex` condition.
- Regex literals inside `$in` and `$nin` use regex matching for string fields.
- Escaped slashes and character classes are parsed correctly.
- Invalid patterns, flags, unterminated literals, and invalid operands produce
  `MinimongoQueryError` messages.
- Native JavaScript regex behavior is accepted without structural or length
  restrictions, as explicitly selected by the user.
- Query drafts and applied input remain raw strings under the existing scoped
  local-storage format.
- No `eval`, `Function`, or production dependency is introduced.

## Uncertainty

Native regular expressions can be computationally expensive for adversarial
patterns. This is an accepted tradeoff of unrestricted JavaScript regex
compatibility; queries remain local to user-controlled captured data.

## Risks and recovery

A scanner bug could misclassify division-like slashes, though selector object
syntax has no arithmetic expressions. The scanner recognizes literals only in
value positions and preserves quoted strings and comments. Reverting the query
parser and operator additions restores the previous behavior without persisted
data migration.

## Executable checklist

- [x] Add parser, evaluator, validation, and regression tests first.
- [x] Parse Compass regex literals without code evaluation.
- [x] Add `$contains`, `$regex`, and `$options` validation and matching.
- [x] Support regex literals in membership arrays.
- [x] Update drawer guidance, changelog, and decision record.
- [x] Run full tests, lint, typecheck, Chrome build, and whitespace checks.

## Direct rollout

Ship directly in the next extension package. Existing persisted queries remain
valid and require no migration.

## Verification

Acceptance requires successful matching for every supported form, deterministic
repeated execution, actionable rejection of malformed input, continued
arbitrary-code safeguards, and successful full project verification.
