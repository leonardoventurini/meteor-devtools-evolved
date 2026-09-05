# DDP Playground

The Playground is an interactive testing workspace for methods and publications
on an inspected Meteor application. It reports observed behavior and preserves
evidence for comparison. A successful response is not by itself a security
finding: interpret it against the application's intended access rules.

## Start with a draft

Open Playground from navigation, edit a captured outbound call, or probe a listed
subscription. Choose the target connection, operation kind, name, encoded EJSON
parameter array, session label, and wait budget. Opening, editing, loading, and
importing never execute a request. The catalog contains names observed on the
selected connection, with application and Playground provenance; it cannot list
every server endpoint or prove that an unobserved name does not exist.

Parameters are data, not JavaScript. Standard EJSON values retain their encoded
representation in the panel. Native Meteor decodes them for dispatch; unsupported
custom types report an error. A request can contain at most 256 KiB, with nesting
depth 50 and 100,000 values. Redacted request fields must be supplied before a
saved or imported case becomes runnable.

## Choose an execution context

Application mode uses the selected application's connection and its current
session. Method calls may execute client stubs and affect application state.
A shared publication probe stops only the handle returned for that probe; an
identical subscription already used by the app must remain active. Shared data
can already exist in Minimongo, so an unknown baseline limits absence claims.

Isolated mode opens an owned native connection to the selected endpoint.
Anonymous is the default. Explicit session reuse requires a compatible,
Accounts-bound source with an available standard resume credential; unsupported
custom authentication, transport requirements, and HttpOnly-only credentials do
not silently fall back to anonymous. The UI records observed identity and its
provenance separately from the user-written session label.

An isolated connection is a separate connection, not a browser profile. Compare
different users by saving labeled snapshots in their actual sessions/profiles and
reviewing exports/imports. Cleanup disconnects only owned transports and never
logs the application out.

## Read evidence conservatively

Method server result and writes-reflected completion are separate signals.
Timeout, Stop, navigation, and disconnect end local waiting; already dispatched
server work can continue. Late evidence may enrich the same run, but does not
restart it or resume a matrix. The Playground never automatically retries a run.

Publication readiness provides an immutable observation boundary. Live evidence
can change afterward; capture a manual snapshot when needed. Dedicated probes
show a pre-subscription baseline and connection-level document changes. Ambient
publications and merged data prevent exact per-publication ownership claims.

Comparison distinguishes missing fields from null, retains EJSON types, and lets
you exclude volatile JSON Pointer paths. Expectations support outcome, error
code, field equality/presence/absence, numeric bounds, and document counts.
Redaction, truncation, and unknown baselines produce inconclusive or unevaluated
results where evidence cannot support a definite claim.

## Cases, snapshots, and transfers

Cases hold the operation, context, label-independent configuration, expectations,
matrix definition, notes, and comparison exclusions. Editing a saved case creates
a new revision. Snapshots capture an immutable observation with request metadata,
identity provenance, timing, completion, and completeness information. Saving a
later observation creates another snapshot.

Review the payload and redaction masks before persistence or download. Standard
authentication credential fields receive mandatory masks; arbitrary custom
application secrets require manual review. Array masks preserve positions.
Imports are versioned, validated, size bounded, and committed atomically with
fresh IDs. They do not overwrite existing records, restore a live session, or run
anything. Invalid stored rows remain available for explicit deletion instead of
being silently overwritten. See the [format reference](ddp-playground-format.md).

## Matrices and limits

Preview variants before starting a matrix. Each changes one declared JSON Pointer
at a time; candidates are not combined into a Cartesian product. Baseline inclusion
is explicit, duplicates are removed, and each variant uses the ordinary runner.
Execution is sequential, with no retry, and publication variants finish cleanup
before advancing. Stop cancels queued variants. Context changes interrupt the
matrix; continuing after an error is an explicit choice.

| Resource                              | Limit                                             |
| ------------------------------------- | ------------------------------------------------- |
| Active operations / owned connections | 3 / 3                                             |
| Wait budget                           | 10 seconds by default; 1–60 seconds               |
| Live publication observation          | 60 seconds                                        |
| Capture per run                       | 1,000 frames, 2 MiB, 1,000 documents              |
| In-memory history                     | 100 runs / 20 MiB                                 |
| Catalog per page and connection       | 500 names / 3 examples per name                   |
| Matrix                                | 20 variants / 120 seconds                         |
| Matrix delay                          | 250 ms default; 100–5,000 ms                      |
| Saved cases / snapshots               | 200 / 100, sharing 20 MiB                         |
| Import                                | 10 MiB / 300 records                              |
| Panel lease                           | Renewed every 5 seconds; expires after 30 seconds |

Closing the panel eventually expires its lease even if its unload callback cannot
reach the page. Navigation creates a new page identity; old connection IDs alone
cannot authorize execution. Limits stop local collection and clearly qualify the
evidence; they do not reverse server effects.

## Recovery

Reload the inspected page to establish a fresh execution context after a runtime
failure. Re-select a live target before reusing stale drafts. Export useful saved
records before deleting them to free quota. A feature rollback leaves its separate
database inert and keeps bookmarks intact; it cannot undo server mutations.
