# Stack Trace Presentation

## Context

DDP stack capture previously retained only parsed callee and URL values from a
15-frame Chrome-shaped trace. Meteor transport and generated async helpers
usually consumed that budget, while unknown and raw frames were discarded.
The drawer consequently provided little application context and opened source
locations outside DevTools.

The React 19 upgrade also exposed Blueprint's warning that legacy `Popover`
positioning is incompatible with React 19, including in navigation and filter
controls adjacent to the stack-trace workflow.

## Decision

Capture up to 50 frames as structured records that always retain their raw
text and optionally include URL, line, and column. Classify a narrow set of
known extension, Meteor transport, and generated-runtime frames as internal.

Present a cleaned view by default, group repeated frames while retaining their
first-seen order, identify likely application frames, and open source locations
with the browser DevTools resource API. Preserve an unfiltered raw view as the
escape hatch for parser and classifier mistakes.

Use Blueprint `PopoverNext` for every repository-owned popover under React 19.

## Rejected alternatives

- Filtering during capture was rejected because it would make hidden frames
  unrecoverable and prevent classifier improvements from applying in the UI.
- Relying only on source-map parsing was rejected because DevTools already owns
  source resolution and exposes a direct resource-opening API.
- Continuing to use ordinary anchor links was rejected because it leaves the
  inspected debugging context and loses line-focused navigation.
- Suppressing the Blueprint warning was rejected because the warning describes
  incorrect positioning behavior, not harmless diagnostic noise.

## Rationale

Raw capture plus derived presentation separates evidence from display policy.
Users get a useful application-focused default without losing access to the
complete runtime trace. Delegating resource resolution to DevTools supports
the browser's active source maps and workspace mappings.

## Consequences

- Stack-frame type changes remain backward-compatible through optional parsed
  fields, but new captures include raw text and classifications.
- Classification rules must remain conservative and unit tested; unknown
  formats stay visible in Raw mode.
- Duplicate groups trade repeated ordering detail in the cleaned view for
  counts; Raw mode preserves exact order.
- Future Blueprint UI must use `PopoverNext`, enforced by a source contract.
