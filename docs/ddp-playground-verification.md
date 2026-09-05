# DDP Playground verification and handoff

Verified on 2026-09-05 for `meteor-devtools-evolved`. The complete feature set is
implemented in one rollout. Automated browser tests run **headlessly**.

## Executed checks

| Check                                                           | Result                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `yarn test`                                                     | 389 tests passed across 62 files                                                     |
| `yarn typecheck`                                                | Passed, including strict Playground and E2E projects                                 |
| `yarn lint`                                                     | Passed                                                                               |
| Focused Prettier check of Playground code, tests, and documents | Passed                                                                               |
| `yarn build:chrome`                                             | Passed                                                                               |
| `yarn build:firefox`                                            | Passed                                                                               |
| `yarn validate:builds`                                          | Both manifests/artifacts passed validation                                           |
| `yarn test:e2e:all`                                             | 52 headless tests passed: 26 on Meteor 3.5.1, 26 on Meteor 2.16; exit 0              |
| `yarn audit`                                                    | Exit 0; no suggestions at the configured production high-severity threshold          |
| `yarn audit:devapp`                                             | Exit 0 at the configured high-severity threshold; eight moderate advisories reported |

The browser total includes six existing inspection regressions, eight native
compatibility/authentication checks, and twelve packaged Playground workflows on
each Meteor release. The final aggregate run took about 1.1 minutes for Meteor 3
and 55.8 seconds for Meteor 2. The packaged panel uses a test-only
`inspectedWindow` host shim; its commands execute in the real inspected fixture
through the production extension bridge, runner, and IndexedDB implementation.
The separate-profile test launches two distinct headless persistent contexts.

## Acceptance evidence

These rows describe the evidence actually executed. Unit-level permutations and
browser workflows complement each other; a browser workflow does not substitute
for testing every lifecycle ordering or resource boundary.

| ID  | Evidence                                                                                                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Captured and bookmarked Edit actions opened populated drafts without producing a run; manual composition dispatched only after Run.                                                                                                                                                                                           |
| A2  | Both fixture servers passed default/secondary connection routing with distinct observed identities. Command, store, provider, and runner tests rejected stale/unknown targets. Navigation did not rerun a draft.                                                                                                              |
| A3  | Generated native EJSON tests and the packaged composer round-tripped dates, binary data, and non-finite values on both releases. Validation tests covered malformed data, unsupported shapes, bounds, and custom decoding failures. Mutating decoders could not alter retained requests.                                      |
| A4  | Native and adapter tests correlated distinct identical-method invocations by callback/wire identity. Reducer tests covered result/updated order independently. Packaged results included writes completion.                                                                                                                   |
| A5  | Packaged duplicate-command and Stop tests checked server invocation counts. Native interruption tests demonstrated no retry; ledger, method, scheduler, and runner tests covered duplicate, timeout, interruption, and late evidence semantics.                                                                               |
| A6  | Both packaged runtimes stopped a shared probe while preserving an identical application subscription. Adapter tests protected pre-existing/unverified handles and handled Meteor 3's queued subscription dispatch.                                                                                                            |
| A7  | Packaged isolated publications retained readiness documents and the ambient-publication caveat. Reducer/adapter tests covered baselines, changes/cleared/removed fields, unknown evidence, synchronous readiness order, and frame/byte/document limits.                                                                       |
| A8  | Anonymous and explicitly reused sessions returned the expected identities on both runtimes. Native tests exercised both fixture accounts; capability tests covered unavailable, changing, interrupted, and rejected reuse without downgrade.                                                                                  |
| A9  | Browser message inspection after a deterministic ordinary-login fence found no reused credential in subsequent internal-run traffic. Owned-stream instrumentation tests verified exclusion before ordinary capture. Authentication disposal and mandatory saved-record masks were tested separately.                          |
| A10 | Catalog/store tests covered page/connection scope, bounded names/examples, provenance, and eviction. Native adapter tests marked tool dispatch before ordinary capture.                                                                                                                                                       |
| A11 | Cases and snapshots were written/read through real IndexedDB; imported records received fresh IDs and existing immutable snapshots stayed equal. Revision metadata and explicit-target rules passed store/record-contract tests. Existing settings and bookmark workflows passed alongside the additive storage architecture. |
| A12 | Both runtimes completed explicit case/snapshot review, export download, reviewed import, and comparison without executing imported content. A real quota-exceeding import rolled back both IndexedDB tables. Generated validators covered versions, bounds, redaction, positional masks, and malformed records.               |
| A13 | Two separate browser profiles authenticated as different fixture accounts, transferred the same case and labeled snapshots through reviewed files, and compared the resulting evidence in the destination profile.                                                                                                            |
| A14 | Pure evidence tests covered type/missing distinctions, exclusions, masks, truncation, unknown baselines, and inconclusive assertions. Packaged comparisons covered equal imported copies and different account evidence.                                                                                                      |
| A15 | Both runtimes previewed and executed sequential matrices and rejected excess variants. Scheduler tests covered deadlines, delay bounds, stop/context interruption, error continuation, and individual outcomes; publication advancement waited for cleanup.                                                                   |
| A16 | Packaged timeout/navigation and native disposal/authentication tests preserved application state. Lease, source-change, abort, late setup, observer cleanup, and owned-resource release were exercised in lifecycle tests. Cleanup never used logout.                                                                         |
| A17 | Earlier real native Chrome DevTools checks passed on both runtimes: visible keyboard focus, matching connection identity, result/writes completion, and a 700px panel with scrollWidth 700px. Final automated tests remained headless as directed.                                                                            |
| A18 | Existing inspection/performance regressions passed on both fixtures; strict types, lint, unit tests, Chrome/Firefox builds, and manifest validation passed. Firefox runtime execution was unavailable.                                                                                                                        |

## Limits and environmental observations

- Firefox was absent from the standard system/user application locations and
  executable path. Its build and manifest were verified; Firefox execution was
  not inferred from Chrome results.
- Builds retain the existing warning about minified chunks above 500 kB.
- The fixture audit reported eight moderate advisories involving `qs`, `uuid`,
  and dependent development packages. No automatic dependency upgrade was made.
- Browser output included the existing `NO_COLOR`/`FORCE_COLOR` warning.
- Earlier native Chrome checks reported the fixture's missing favicon (404) and
  a Chrome deprecation issue, without an extension exception. Their temporary
  reports/screenshots are under `/private/tmp/playground-native-meteor2/` and
  `/private/tmp/playground-native-meteor3/`. All of those browser profiles are
  closed; no headed option is shipped in the tests.
- Task-owned Meteor fixture processes and their child listeners were stopped
  after verification. The unrelated user beta server and release ZIPs were left
  untouched.

## Review order and important decisions

1. Read the [specification](../specs/2026-09-05-ddp-playground.md) and
   [decision](../decisions/2026-09-05-ddp-playground.md), then the
   [usage guide](ddp-playground.md) and [format reference](ddp-playground-format.md).
2. Review contracts and pure logic in `src/Playground/`: encoded values, commands,
   lifecycle, evidence, matrices, records, catalog, and limits.
3. Review `src/Injectors/Playground/` for native preflight, ownership, queued
   dispatch, in-memory authentication, leases, and cleanup. Internal reuse
   connections bypass ordinary capture entirely. Native source APIs remain in
   control of execution; Stop cannot undo already handed-off work.
4. Review `src/Database/PlaygroundDatabase.ts`, then the panel store and UI for
   reviewed persistence, unresolved-mask gates, snapshots, and target selection.
   The additive database is `MeteorToolsPlaygroundDatabase`; file/command
   contracts are explicitly versioned. Bookmarks use their existing storage.
5. Review `tests/e2e/playground.spec.ts` with the focused `Playground*.test.ts`
   suites. The E2E helper export supports separate headless profiles and does not
   introduce a production test bypass.

The implementation follows the approved scope and introduces no production
dependency or browser-permission expansion. Native async-queue, no-retry,
HTTP-context, and disposal discoveries refined the implementation within those
contracts. The later user instruction changed browser verification to headless
execution; earlier completed native evidence is historical verification only.

Manual authentication values can remain in ephemeral inspection history, as
specified. Standard credential masks apply before persistence/export; arbitrary
application secrets require the user's review. Shared publication baselines may
be unknown, and isolated connection data may include ambient publications.

## Rollback

Revert the Playground commits as a coordinated feature rollback and rebuild the
extension. The separate database can remain inert; do not delete it or migrate
bookmarks as part of rollback. Saved files remain user-owned artifacts. Neither
rollback, timeout, nor local Stop can reverse server mutations already performed.
Nothing was published, deployed, or uploaded to an extension store.
