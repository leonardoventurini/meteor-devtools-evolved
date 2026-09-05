# DDP Playground file format, version 1

The file is UTF-8 JSON with `format: "meteor-devtools-playground"`, `version: 1`,
`exportedAt` (Unix milliseconds), `cases` and `snapshots` arrays. All five fields
are required. The version is independent of the Dexie schema version. Unknown
fields and future versions are rejected atomically. No import selects a live
target, opens an endpoint, authenticates, or executes a request.

The authoritative runtime contracts are
[`Records.ts`](../src/Playground/Records.ts). Generated examples and round-trip
checks live in [`PlaygroundRecords.test.ts`](../tests/PlaygroundRecords.test.ts).

## Cases

| Field                       | Meaning                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `id`, `version`, `revision` | UUID, record version 1, positive integer revision.                                                         |
| `title`, `notes`, `tags`    | User-authored description; title and notes may be absent only with explicit corresponding redaction masks. |
| `createdAt`, `updatedAt`    | Unix milliseconds.                                                                                         |
| `operation`                 | Exact fields `kind` (`method` or `subscription`), `name`, and encoded EJSON `parameters` array.            |
| `context`                   | `{mode:"application",authentication:"current"}` or `{mode:"isolated",authentication:"anonymous"            | "reuse"}`. This is a preference, never authorization to reuse credentials. |
| `endpointHint`              | Optional descriptive hint, never an executable URL.                                                        |
| `expectations`              | Declarative checks described below.                                                                        |
| `matrix`                    | Optional definition with `includeBaseline` and `changes` (`path`, `candidates`).                           |
| `excludedPaths`             | Exact JSON Pointers excluded from evidence comparisons.                                                    |
| `redactedPaths`             | Exact JSON Pointers relative to this record, marking unknown data.                                         |

Cases have no connection ID, page epoch, live handle, or credential field. A new
local case starts at revision 1. Updating requires exactly the previous revision
plus one and the original creation time; conflicting panel edits fail visibly.
Imported records receive fresh UUIDs and retain their source revision.

## Snapshots

A snapshot is immutable saved evidence. Its required fields are `id`, `version`,
`capturedAt`, `request`, `endpointLabel`, `authentication`, `semantics`, `outcome`,
`completion`, `evidence`, `timing`, `incompleteReasons`, and `redactedPaths`.

- `request` contains the effective `operation`, `context`, and user-authored
  `sessionLabel`. Endpoint and session labels may be absent with explicit masks.
- Optional `caseId` and `caseRevision` must occur together. When importing linked
  cases and snapshots, links are remapped to fresh local IDs. Links to cases not
  included in the file are removed; imported evidence never points to an
  unrelated existing local case.
- `authentication` has `state` (`anonymous`, `authenticated`, `unknown`),
  `observedAt`, `provenance`, and optional encoded `userId` for authenticated
  observations. Labels are not verified roles. No credential belongs here.
- `semantics` describes execution and `outcome` records lifecycle state.
  `completion` independently records boolean `result`, `writes`, and `ready`.
- `evidence` has normalized `data` (`result`, `error`, `documents`, each optional),
  `completePaths`, `redactedPaths`, `truncated`, `documentBaseline` (`known` or
  `unknown`), optional `boundary` (`readiness` or `manual`), and `outcome`
  (`pending`, `success`, `error`, `unknown`). Evidence pointers are relative to
  `data`; record masks under `/evidence/data` also become evidence masks.
- `timing` has `startedAt`, optional `responseMs` and `completedMs`. Times and
  elapsed durations are nonnegative finite numbers. Timing does not establish
  causation. `incompleteReasons` preserves observation limitations.

## Values, expectations and matrices

Parameters and equality values are encoded EJSON, retaining dates, binary,
special numbers, escaped objects, and encoded custom types as JSON. Imports do
not decode types or execute application code. Target runtime support is checked
before execution. Encoded values are bounded to depth 50 and 100,000 visited
values; JavaScript functions, accessors, cycles, sparse arrays, and raw nonfinite
numbers are invalid.

Expectation variants use exact fields:

- `{kind:"outcome",outcome:"success"|"error"}`
- `{kind:"error-code",code:string|number}`
- `{kind:"equals",path:string,value:encodedEJSON}`
- `{kind:"exists"|"absent",path:string}`
- `{kind:"number-bounds",path:string,min?:number,max?:number}`
- `{kind:"document-count",collection:string,boundary:"readiness"|"manual",min?:number,max?:number}`

Bounds are inclusive, finite, ordered, and require at least one bound. Document
counts additionally require nonnegative integers. Pointers use standard `~0` and
`~1` escaping, without wildcard syntax; unsafe prototype segments are rejected.
Unknown or redacted evidence cannot silently pass dependent checks.

Matrix candidate variants are `{kind:"value"|"alternate-id",value:encodedEJSON}`,
`{kind:"null"|"missing"|"wrong-type"}`, `{kind:"numeric-boundary",boundary:number}`,
and `{kind:"string-boundary",length:integer}`. Each change applies independently
to baseline parameters. The preview deduplicates effective arguments and permits
at most 20 variants, including an optional baseline. Missing arguments may only
remove trailing positional slots. Redacted cases require resolved inputs and a
fresh validated preview before execution.

## Review, redaction and storage

Save and export are explicit reviewed actions. Export accepts selected records
and produces a detached preview; it does not change the in-memory source.
Redaction removes object properties and replaces array entries with null,
preserving positions. A null with a mask means unknown, not an actual null input.
Structural identity/version fields cannot be removed. Known standard credential
fields in manually composed authentication operations and their responses are
always masked. Authentication matrices targeting credential fields are omitted
with an explicit `/matrix` mask; nested credential fields in other candidate
objects are removed individually. Internal session-reuse traffic is excluded before capture, so it
never becomes a record. Automatic recognition cannot discover every application
secret; review requests, results, errors, notes, endpoint labels, and identity.

Import checks the 10 MiB UTF-8 limit before JSON parsing and rejects more than
300 records or duplicate IDs. Per-record bounds include metadata. Records are
validated before any writes, remapped, then inserted together in one transaction.
Both tables participate in quota checks across panels: 200 cases, 100 snapshots,
and 20 MiB aggregate serialized UTF-8 bytes. A failure rolls back all writes; no
saved evidence is automatically evicted. Corrupt existing records are reported
individually without deleting the database.

Storage is separate: `MeteorToolsPlaygroundDatabase`, Dexie schema version 1,
`cases` and `snapshots`. Existing `MeteorToolsDatabase` bookmarks and settings
are untouched. A save is successful only after transaction completion. Removing
a case does not delete immutable snapshots. Rollback can leave this additive
database inert; older extension versions continue to use their existing storage.

## Generated example

This minimal case-only file illustrates the exact envelope and a date argument.
The documentation example is validated by the record tests.

```json
{
  "format": "meteor-devtools-playground",
  "version": 1,
  "exportedAt": 1788600000000,
  "cases": [
    {
      "id": "f9814193-2601-58a6-bd74-2620fbdd678f",
      "version": 1,
      "revision": 1,
      "title": "Typed echo",
      "createdAt": 1788600000000,
      "updatedAt": 1788600000000,
      "operation": {
        "kind": "method",
        "name": "example.echo",
        "parameters": [
          {
            "$date": 1788600000000
          }
        ]
      },
      "context": {
        "mode": "application",
        "authentication": "current"
      },
      "notes": "Select a live connection before running.",
      "tags": ["example"],
      "expectations": [
        {
          "kind": "outcome",
          "outcome": "success"
        }
      ],
      "excludedPaths": [],
      "redactedPaths": []
    }
  ],
  "snapshots": []
}
```
