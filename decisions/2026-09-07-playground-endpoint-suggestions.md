# Playground endpoint suggestions

## Context and decision

The request editor required manual endpoint names despite an existing observed
catalog. Add an editable combobox backed by that catalog. Explicit selection
loads the latest retained argument sample, as requested by the user. Search is
scoped to page, confirmed connection, and operation kind; it supports mouse and
keyboard use. Manual typing leaves parameters intact.

## Rationale and alternatives

Reuse the existing captured-draft path so selection clears stale case/mask state
and matrix previews without dispatching a request. Re-resolve names in the current
scope rather than trusting a previously rendered entry. A native datalist cannot
reliably distinguish manual exact-name typing from explicit selection; use a
small feature-local combobox instead. No additional UI dependency is needed.

Do not enumerate client method registrations or guess server endpoints: this
feature represents observed traffic only. Keep the full catalog for selecting
older examples. Missing samples produce an empty argument array and a review
notice rather than retaining unrelated arguments.

## Consequences and recovery

Selecting a suggestion intentionally replaces parameters but preserves execution
mode and session labels. Oversized omitted samples mean the latest retained
sample may be older than the latest call; the UI and guide explain this limit.
No persisted formats, protocol contracts, or production dependencies change.
Reverting the feature commit restores the plain input without data migration.
