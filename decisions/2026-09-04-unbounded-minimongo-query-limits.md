# Unbounded Minimongo Query Limits

## Context

The structured Minimongo query interface rejected requested limits above 500.
Users inspecting larger captured collections need to choose the result count
instead of being constrained by a fixed application maximum.

## Decision

Accept any positive integer query limit without an application-defined upper
bound. Continue rejecting zero, negative numbers, fractions, and non-numeric
values.

## Rejected alternatives

- Increasing the fixed maximum would retain an arbitrary boundary and fail the
  requirement that users may choose any positive limit.
- Treating blank input as unlimited would introduce a second limit mode and
  weaken the form's explicit contract.
- Allowing zero or negative values would make the meaning of the limit
  ambiguous and diverge from its result-count purpose.

## Rationale

The captured snapshot already bounds the available source documents, and the
user explicitly controls when a query is applied. A positive integer contract
is predictable while allowing larger inspection workflows.

## Consequences

Large limits can render every matching captured document and may increase panel
CPU and memory use. The query remains constrained to the captured snapshot and
does not request additional records from the inspected application.
