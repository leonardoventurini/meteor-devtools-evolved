# DDP Playground

The Playground runs methods and observes publications on an inspected Meteor
application. It helps reproduce requests, compare evidence, and build reusable
checks. A successful response is not by itself a security finding: interpret it
against the application's intended access rules.

## Quick start

1. Open **Playground**, use **Edit in DDP Playground** on a captured method, or
   use **Probe in Playground** on a subscription.
2. In **Run**, confirm the target connection, operation, endpoint name, and
   encoded EJSON parameter array. Opening or editing a draft never sends it.
3. Leave the default application connection selected for your first request.
   It uses the inspected application's current session.
4. Select **Run method** or **Start publication probe**.
5. Read the response, status, timing, and warnings beside the editor. Expand
   **Run details** when you need the submitted request, authentication
   provenance, readiness evidence, baseline, or expectation results.

Each Run is a fresh invocation and may change application or server data.
Stopping or timing out ends local waiting only; it cannot undo work already
sent to the server.

## Common recipes

### Replay a captured method

1. Open **DDP** before the application sends the method.
2. Find the outbound method and select **Edit in DDP Playground**.
3. Review the target, method name, and captured parameters in **Run**.
4. Select **Run method** and inspect the result.

The captured request opens as a passive draft. Selecting an observed endpoint
can replace the parameters with its latest retained example, so review them
before running. For a fixture-based walkthrough, see the
[five-minute replay and access-control demo](ddp-playground-demo.md).

### Call a method manually

1. Open **Playground → Run** and select a live target connection.
2. Choose **Method** and enter its name. Suggestions include endpoints observed
   on the selected connection; you can still enter an unobserved name.
3. Enter parameters as an encoded EJSON array, such as
   `["project-id", {"$date": 0}]`.
4. Select **Run method**.

The endpoint catalog is observational, not a list of every server method. Open
**Browse observed endpoints** to inspect provenance, older retained examples,
or endpoints that are not shown in the initial suggestions.

### Inspect a publication

1. Use **Probe in Playground** on a listed subscription, or choose
   **Publication subscription** in **Run** and enter its name and parameters.
2. Choose the execution context under **Advanced testing**. Start with the
   application connection when you want to observe the current session.
3. Select **Start publication probe**.
4. Inspect readiness, captured documents, completeness warnings, and the
   before-subscription baseline under **Run details**.
5. Use **Capture current documents** at the boundary you want to retain, then
   stop the live observation when you have enough evidence.

A shared probe stops only the handle opened by the Playground. Existing
application subscriptions remain active. Ambient publications and merged
Minimongo data mean captured documents cannot always be attributed to one
publication.

### Compare authenticated and anonymous behavior

1. Run the request with **Current app connection**.
2. Review and save its result as a labeled snapshot.
3. Under **Advanced testing**, choose **Clean isolated connection** and
   **Anonymous**. Run the same request again and save a second snapshot.
4. Open **History** and choose the two snapshots in **Compare snapshots**.

An isolated connection is separate from the application connection, but it is
not a separate browser profile. To compare two signed-in users, capture labeled
snapshots in their actual sessions or profiles, then use reviewed export and
import.

### Save and compare results

Use **Review case to save** to retain the current request, context,
expectations, matrix, notes, and comparison exclusions. Editing a saved case
creates a new revision.

Use **Review snapshot to save** on a result to retain immutable evidence. Open
**History** to load cases, inspect saved snapshots, and compare two snapshots.
Exclude volatile fields with comparison JSON Pointers when timestamps, IDs, or
other expected differences would obscure the useful change.

### Test several parameter values

1. Compose and check the baseline request in **Run**.
2. Open **Advanced testing**, then add matrix changes with the guided builder.
3. For each change, choose a parameter JSON Pointer and add candidate values or
   boundary cases. Use raw JSON mode only when you need exact copy-and-paste
   control.
4. Preview the generated variants, then start the matrix.
5. Inspect an individual matrix run in **Run** or review its outcomes in the
   advanced section.

Each change is applied independently to the baseline; changes are not combined
into a Cartesian product. Execution is sequential and never retries. Stopping
a matrix cancels queued variants but cannot undo dispatched server work.

### Share reviewed cases and snapshots

1. Open **History** and select the cases and snapshots to export.
2. Review the generated payload. Use the guided redaction controls to mask
   sensitive paths; raw JSON Pointer editing remains available.
3. Confirm the download only after checking request data, results, errors,
   notes, endpoint labels, and identity evidence.
4. In the destination profile, review the imported file before confirming it.

Importing never selects a target, restores a live session, or runs a request.
Imported records receive fresh IDs and cannot overwrite existing records. See
the [file format reference](ddp-playground-format.md) for the stable version 1
contract.

## Safety and evidence

### Execution context

**Current app connection** uses the selected application's
connection. Methods may execute client stubs and affect application state.
Shared publication data may already exist in Minimongo, so an unknown baseline
limits claims about absence.

**Clean isolated connection** opens an owned native connection to the selected
endpoint. Anonymous is the default. Explicit session reuse requires a
compatible Accounts-bound source with an available standard resume credential.
Unsupported custom authentication, required custom transports, and
HttpOnly-only credentials fail visibly instead of falling back to anonymous.
Cleanup disconnects only owned transports and never logs the application out.

Session labels are notes, not verified identities. The Playground records the
observed identity and its provenance separately.

### Interpret results conservatively

- Method server result and writes-reflected completion are separate signals.
- Publication readiness is an immutable observation boundary. Live evidence
  can change afterward; save a manual snapshot when needed.
- Timeout, Stop, navigation, and disconnect end local waiting. Already
  dispatched server work can continue.
- Late evidence may enrich a run, but does not restart it or resume a matrix.
- The Playground never automatically retries a run.
- Missing, redacted, truncated, or unknown evidence produces an inconclusive or
  unevaluated check when a definite result is not supported.

## Advanced reference

### EJSON parameters and endpoint suggestions

Parameters are data, not JavaScript. Standard EJSON values keep their encoded
form in the panel and Meteor decodes them for dispatch. Unsupported custom types
report an error. A request can contain at most 256 KiB, with nesting depth 50
and 100,000 values.

Suggestions are scoped to the selected operation and confirmed connection.
Choosing one fills its name and latest retained captured arguments. If no sample
was retained, parameters become `[]`; samples over 4 KiB are omitted. Typing a
name manually preserves the current parameters. The catalog retains at most 500
names and three examples per name.

### Expectations

The guided expectation builder supports outcome, error code, field equality,
field presence or absence, numeric bounds, and document counts. Switch to raw
JSON mode for exact authoring or copy and paste. Both modes produce the same
validated version 1 case data described in the
[format reference](ddp-playground-format.md#values-expectations-and-matrices).

Equality and field checks use JSON Pointers. Missing and null are distinct.
Bounds are inclusive. Redacted or incomplete evidence cannot silently pass a
dependent expectation.

### Matrices

The guided matrix builder and raw JSON mode edit the same matrix definition.
Preview is required before execution. Baseline inclusion is explicit,
duplicates are removed, and at most 20 variants run sequentially. Publication
variants finish cleanup before the next one starts. Context or request changes
invalidate the preview.

### Comparison exclusions and redaction

Comparisons retain EJSON types and distinguish missing fields from null. Use
exact JSON Pointer paths to exclude volatile evidence. Transfer masks use paths
relative to the reviewed record; object properties are removed and array
positions are preserved with null placeholders.

Standard authentication credential fields receive mandatory masks, but custom
application secrets require manual review. A redacted request must be completed
and explicitly reviewed before it can run.

### Storage, limits, and recovery

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

Closing the panel eventually expires its lease even when unload cannot reach
the page. Navigation creates a new page identity; an old connection ID alone
cannot authorize execution. Limits stop local collection and qualify the
evidence; they do not reverse server effects.

Reload the inspected page to establish a fresh execution context after a
runtime failure. Re-select a live target before reusing stale drafts. Export
useful saved records before deleting them to free quota. A feature rollback
leaves its separate database inert and keeps bookmarks intact; it cannot undo
server mutations.
