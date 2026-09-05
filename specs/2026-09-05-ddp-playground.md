# DDP Playground: complete rollout

**Date:** 2026-09-05<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>
**Status:** Ready for implementation; the user approved the recommended scope and
architectural options on 2026-09-05. Implementation and runtime verification are
not yet complete.<br>
**Related decision:** [DDP Playground rollout](../decisions/2026-09-05-ddp-playground.md)

## Outcome

Give Meteor developers a practical workspace for invoking methods, inspecting
publications, varying inputs, and comparing behavior across accounts. A developer
should be able to turn observed DDP traffic into a repeatable test without writing
a throwaway script or losing track of which server and session executed it.

Ship the entire feature set together: editable method replay, publication probes,
an observed endpoint catalog, correlated results, comparisons, saved cases,
reviewed import/export, bounded parameter matrices, comparisons across browser
sessions, and dedicated connections for isolated inspection. Implementation can
use several tested commits, but these are work units within one release, not
separate product releases or follow-up promises.

The tool presents observations and evaluates user-authored expectations. It does
not determine an application's authorization policy or certify that an endpoint
is secure.

## Approved scope and constraints

The user requested all features in one rollout, a readable and thorough spec, and
a goal after the spec. After review of the existing implementation, the user
selected all recommended options with “use recommended options”:

| Choice                   | Approved behavior                                                                                                                                                        | Alternatives not selected                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Isolated authentication  | Start anonymous; explicitly opt into reusing the selected session in memory when supported. Never store credentials.                                                     | Anonymous isolated probes only; or a dedicated login interface with custom authentication flows.           |
| Cross-session comparison | Save labeled snapshots; review export/import to move them between profiles. No live coordination.                                                                        | Coordinate same-profile tabs; or introduce a companion service for live cross-profile coordination.        |
| Goal and authorization   | Implement and verify this complete spec, including additive saved-case storage and owned connection architecture; no new production dependencies or browser permissions. | Finalize the spec only and await implementation approval; or permit justified new production dependencies. |

This authorizes implementation and verification of the complete rollout,
including additive saved-case storage, a versioned import/export format, and the
owned connection architecture with explicit in-memory session reuse. New
production dependencies, browser permissions, arbitrary-target connections, and
live cross-profile coordination are outside the approved boundary. Material
deviations require an explanation and approval under the repository instructions.
No release publication or deployment is authorized here.

## Problem and evidence

The original suggestion asks for pentesting through DDP replay and probing
methods/publications. The existing implementation supports a useful starting
point, but not a reproducible testing workflow:

- `src/Pages/Panel/DDP/DDPLogMenu.tsx` offers immediate method replay and sends
  captured content as `ddp-run-method`.
- `src/Injectors/MeteorAdapter.ts` handles that message with global
  `Meteor.call(method, ...params)`. It does not preserve the captured connection,
  collect a result callback, or expose a run lifecycle.
- `src/Injectors/ConnectionRegistry.ts` assigns identities to connection objects.
  IDs are local to the current page; the registry has no ownership/disposal
  contract or endpoint metadata. URL equality does not imply session equality.
- `src/Injectors/DDPInjector.ts` instruments every registered connection and
  forwards all frames into ordinary capture. Authentication traffic on a new
  testing connection would follow that path unless handled before forwarding.
- `src/Browser/Inject.ts`, `src/entrypoints/content.ts`, and
  `src/Browser/Background.ts` bridge and cache page messages. The injected receiver
  is page-accessible; the source string is a routing marker, not authentication.
- `src/Database/PanelDatabase.ts` uses Dexie for bookmarks and settings. There is
  no saved-case or run-snapshot format. Existing bookmarks must remain readable.
- `src/Stores/PanelStore.tsx` owns the global connection selector. Existing DDP,
  subscription, and Minimongo views already scope data by connection.
- Vitest covers registry identity, connection scoping, capture, stores, and
  injection behavior. `tests/MeteorAdapter.test.ts` currently covers collection
  performance instrumentation, not the replay command.
- Playwright in `tests/e2e/meteor-extension.spec.ts` exercises packaged Chrome
  against maintained Meteor 2.16 and 3.5.1 fixtures, including real secondary
  connections and method/publication lifecycles. Authentication comparisons need
  additional deterministic fixture scenarios.

SCS was unavailable in this session's tools; the evidence above was gathered by
reading repository files. This spec does not claim that a runtime test was run.

## User workflow and scope

### Enter the playground

Add a **Playground** tab using the existing navigation and global connection
selector. **Edit and run** on a captured method, subscription, or bookmark opens
that request in the playground without sending anything. Replace the existing
immediate method replay action with this entry point.

The main workspace has a request editor, run results, and accessible entries for
the endpoint catalog and saved cases. Comparisons open from selected runs. A
matrix is a request execution option, not a separate application mode.

Keep the target server, application connection, execution mode, session label,
and authentication status visible near Run. Changing the global selector changes
the next draft's target only after the draft reflects the new target. An existing
run retains its original immutable context. A dirty draft must not be discarded
by navigation; preserve it in memory until reset or page-session end.

### Edit and invoke methods

Allow a method name and an EJSON parameter array, either populated from capture
or entered directly. Validate before dispatch and show errors at the relevant
field. Distinguish absent trailing arguments, explicit nulls, and other supported
EJSON types; never evaluate JavaScript pasted into the editor.

Each Run is a fresh invocation, with a fresh protocol ID. Do not reuse captured
method IDs or `randomSeed`. The UI describes this as a fresh call, not exact
byte-for-byte wire replay. The selected connection's normal Meteor invocation
semantics apply, including client stubs on an application connection. An isolated
connection has no application-installed stubs unless the app modifies that
connection; the tool must not install or copy them.

Show dispatch state, server result or error, server-response elapsed time, and
whether relevant writes have been reflected. Link captured messages when they
remain available; retained run results must survive ordinary DDP-log eviction.
Never match a response solely by method name or argument equality.

### Probe publications

Allow a publication name and EJSON parameters. Starting a probe returns an owned
handle, readiness/error information, elapsed time, observed document data, and a
Stop control. Running an unknown name is allowed and displays the server's
response. The catalog does not limit which names may be entered.

Two execution modes are included:

| Mode                   | Purpose                                                                    | Data interpretation                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Application connection | Reproduce behavior in the selected application's current session.          | Connection-level changes while the probe is active; app subscriptions may overlap.                                                 |
| Isolated connection    | Remove the application's named subscriptions from the observation context. | Baseline plus changes on a fresh owned connection containing one explicit probe. Ambient server publications may still contribute. |

Create shared-connection subscriptions outside application reactive ownership.
Stopping a probe must stop only its owned handle, including when the application
already has an identical subscription. If the API reuses handles in a supported
runtime, use a tested ownership mechanism that cannot stop the app's handle;
otherwise explicitly reject that shared probe and direct the user to isolated
mode. Never silently broaden cleanup to all subscriptions of a given name.

For shared mode, capture the selected connection's available document snapshot
before subscribing when the runtime exposes a reliable baseline. Otherwise show
observed deltas with unknown initial state. A `changed` frame without a known
document baseline cannot establish the full document; no traffic does not mean
an empty publication. Mark completeness per document/field for assertions.

For isolated mode, capture a baseline before subscribing and a snapshot at
readiness. Show subsequent live changes separately. A baseline is a timestamped
observation, not a proof that background publications have become quiet. Store
documents by collection and wire document ID, preserving ID representation;
apply `added`, `changed`, cleared fields, and `removed` deterministically.

Readiness timeout immediately stops the owned subscription, disposes an isolated
connection, and releases its operation slot. A late `ready` never restarts it.
The manual observation budget starts at subscription dispatch and includes the
readiness wait, so a never-ready subscription cannot outlive its budget.

Readiness does not freeze a reactive publication. Manual snapshots record their
capture time; automatic matrix snapshots capture at readiness and then stop.
Partial, truncated, interrupted, and not-ready captures are visibly labeled.

### Discover observed endpoints

Maintain an in-memory catalog scoped to the page epoch and application
connection. Entries include kind, name, observation count, last-seen time, and up
to three recent distinct argument examples. Separate application-observed traffic
from playground-generated traffic so running guesses cannot imply discovery.

Exclude tool-internal authentication and heartbeat operations. Cap at 500 names
per connection, evict least recently observed entries, and show that the catalog
is bounded. Clearing DDP traffic does not erase the catalog; provide an explicit
Clear catalog action. Nothing here claims complete endpoint enumeration.

### Save reusable cases

A saved case contains a title, optional notes and tags, operation kind/name,
EJSON arguments, execution-mode preference, endpoint hint, optional matrix,
expectations, and comparison exclusions. It contains no live connection handle
or authentication material. A server hint helps choose a target but never grants
permission to run against one; the user selects a live connection before running
an imported or restored case.

Support create, edit, duplicate, delete, and run. A run records the case revision
and the exact effective inputs, so editing a case does not rewrite history.
Saving a case does not automatically save every future response.

Provide declarative expectations for result success/error, exact error code,
EJSON equality at a JSON Pointer, path presence/absence, and numeric or
document-count bounds. The UI distinguishes **Passed**, **Failed**, **Not
evaluated**, and **Inconclusive**. A response can succeed while an expectation
fails. No assertions are treated as a security verdict. No scripts or regular
expression evaluator are part of the assertion language.

Assertion JSON Pointers address a normalized evidence root with `result`,
`error`, and `documents` fields. `documents` maps collection names to maps of
wire IDs to documents; standard JSON Pointer escaping handles special characters
in names and IDs. Numeric bounds are inclusive. Document counts require an
explicit collection and snapshot boundary (readiness or manual snapshot), and
count unique wire IDs in that collection's observed state. Unknown baseline or
truncation makes whole-collection counts inconclusive. An absence assertion
requires complete evidence for the containing object; an uncaptured path cannot
prove absence. Redacted paths are always unknown to dependent assertions.

### Compare runs and browser sessions

Compare two immutable snapshots side by side: input changes, endpoint and session
context, result/error, readiness/completion state, timings, and document/field
differences. Equality must preserve EJSON types, null versus missing fields, and
array ordering. Sort object keys for presentation only. Join publication
documents by collection and wire ID. Never claim causation from a time delta.

Comparison exclusions are explicit JSON Pointers with no wildcard syntax in
format version 1. Display excluded paths and counts, retain original data, and
allow a raw comparison. Incomplete captures cannot pass whole-result equality
or absence/count assertions; assertions limited to complete known fields may
still evaluate, with the scope shown.

Use user-authored labels such as `Account A` and `Account B`. Labels are not
verified roles. Record connection-specific authentication state as known
anonymous, known authenticated with user ID, or unknown, plus observation time
and provenance. Do not use global `Meteor.userId()` as evidence about a secondary
connection. Unknown authentication does not block ordinary existing-connection
calls, but must remain visibly unknown.

Within an extension profile, explicitly saved snapshots are available to other
panels through local storage. They are immutable evidence, not live access to
another tab. Across profiles or browsers, use reviewed file export/import. No
cross-tab command router, credential sharing service, or browser companion is
introduced in the recommended design. Run a case independently in each session
and compare the saved results. Explain that server data may change between runs.

### Generate bounded parameter matrices

Support user-entered values and deterministic generation for null, wrong-type,
missing property, numeric/string boundaries, and alternate IDs supplied by the
user. The developer chooses the field and candidate values; the tool does not
guess account IDs or endpoint names.

Use JSON Pointers into the argument array. Removing a trailing argument or object
property is supported; removing a non-trailing positional argument is rejected
because it would silently shift later arguments. Show the actual EJSON for every
variant before starting. Generate one selected change per variant relative to
the baseline; do not create an implicit Cartesian product. Deduplicate identical
effective arguments. An optional baseline run counts toward the limit.

Run sequentially with explicit progress, per-variant outcomes, expectations, and
comparison to a chosen baseline. Default to stopping the matrix on server error,
failed expectation, disconnect, authentication-context change, timeout, or limit
exceeded. The user can choose to continue after a server error or failed
expectation in the preview; disconnects, context changes, and limits always stop.

Stop prevents dispatch of queued variants immediately. It cannot undo a sent
method. A subscription variant must release its handle before the next begins;
isolated variants use fresh connections to avoid leftover data or server session
state. A truncated variant is inconclusive, never a silent pass.

## Execution and lifecycle contracts

### Typed command boundary

Introduce a dedicated playground command/event contract with discriminated
unions, runtime validation, and constants for names and limits. Parse inbound
payloads from `unknown`; do not extend the existing `Message<any>` pattern for
new behavior. Narrow changes to the existing bridge are allowed, but a wholesale
messaging rewrite is outside this feature.

Every execution command carries protocol version, panel-session ID, page epoch,
request ID, application connection ID, execution mode, operation, EJSON payload,
and explicit limits. Every event carries matching identity plus a monotonically
increasing sequence within that request. Validate operation-specific fields,
payload size, ownership, and active page epoch before execution.

Only an explicitly opened active panel session may dispatch commands. Opening a
new session retires the previous session's execution identity; reset, expiry, or
reopen cannot revive it. Reject commands with retired or unknown session IDs
instead of implicitly creating a new ledger from incoming execution traffic.
The handshake enforces lifecycle consistency, not secrecy from the inspected page.

A duplicate request ID in the same panel session must return its existing state
or a duplicate error, never execute again. Use a bounded ledger; when its limit
is reached, reject new requests until the playground session is explicitly
reset. Never evict an ID in a way that lets a delayed duplicate execute again.

Page-local connection IDs cannot be persisted as executable targets. Captured
bookmarks from another page epoch open as drafts requiring a fresh target.
Missing/stale targets produce a local error and no network traffic. Never fall
back to `Meteor.connection`. Changing the selector does not reroute queued work;
stop a pending matrix and require a new preview if its target changes.

The inspected page already owns its DDP session and can call the injected
receiver. Runtime validation does not turn that page into a trusted principal.
Keep all new network actions within connections derived from the inspected
page's selected endpoint; do not accept arbitrary remote URLs from imports or
page messages, and do not add privileged background fetches.

### Method state and correlation

Use a compatibility adapter for Meteor 2 callbacks and Meteor 3 async stubs.
Expose the generated method ID through tested adapter instrumentation; do not
infer it by searching later traffic for matching arguments. Install run tracking
before invoking the API so synchronous dispatch cannot race registration.

Track dispatch, local invocation failure, server result, and writes-reflected
independently. DDP `result` and `updated` may arrive in either order. Display
server outcome as soon as known and settle a successful method's data-completion
state only when both signals are known. A server error remains a known server
error even if no writes marker arrives; its writes status may remain unknown.
Timeouts preserve whatever evidence already arrived and stop waiting without
claiming that execution was cancelled. Late results may enrich the same run,
with a late-result label, but cannot restart a stopped matrix.

Use `noRetry` where supported and prove the behavior in both fixtures. Disable
execution in a runtime that cannot enforce the required no-automatic-retry
contract rather than silently accept duplicate mutations. A disconnect after
dispatch is an interrupted/possibly-executed outcome, not a failed-to-execute
claim. No automatic method retries or matrix resumption on reconnect.

### Owned connections and authentication

Resolve isolated endpoints from the selected live connection through a narrow,
capability-tested adapter. If endpoint or required transport options cannot be
resolved reliably, show an unavailable reason; do not guess from the page URL.
Support the maintained fixtures and document limitations for custom transports.

Register ownership before generic stream instrumentation can expose frames.
An owned connection records its parent application connection, panel session,
page epoch, request, endpoint identity, and disposal state. It is visible as a
tool-owned child in playground context, not an ordinary application target in
the global selector. Registry disposal removes strong references and listeners
without disturbing instrumentation of application connections.

Start isolated connections without an Accounts client that auto-loads or writes
credentials. Anonymous means the tool performs no authentication; when actual
server identity cannot be verified, display that limitation rather than promise
the server is treating it as anonymous.

For the **Reuse current session** option, require an explicit choice
for this execution context. Resolve a credential only when its provenance is
unambiguously tied to the selected application connection and endpoint. Keep it
in page memory for the minimum lifetime and authenticate only that owned
connection. Never substitute a default-connection token for a secondary server.

Show capability failure for unavailable tokens, HttpOnly/custom login setups,
ambiguous Accounts association, or rejected authentication. Do not bypass cookie
protections, ask for passwords, or silently downgrade to anonymous. Existing
application-connection testing remains available. An authentication success
records the returned user identity when available; the requested label alone
does not prove successful reuse. Standard resume support must be demonstrated
in both fixtures before release; custom schemes remain explicitly unsupported.

Observe source identity changes when supported. Pause queued work and dispose
isolated connections if the source session changes. Where change observation is
unavailable, display identity as a snapshot and never claim continuously verified
session parity. Every matrix revalidates its available identity before each run.

Dispose by stopping owned subscriptions and disconnecting the owned transport.
Never call logout during cleanup: that may revoke a credential shared with the
application. Drop credential references; JavaScript garbage collection does not
provide a guarantee of cryptographic memory erasure.

### Capture and credential handling

Intercept internal authentication requests and corresponding responses before
`sendLogMessage`, `window.postMessage`, background caching, console output, or
run persistence. Ordinary DDP capture must never receive their raw credentials.
Apply this by connection/request ownership, not only a heuristic field-name
filter. Retain only sanitized success/error metadata needed by the UI.

Never make internal login operations catalog entries, replay drafts, saved cases,
or exportable raw frames. The general editor must identify standard credential
fields in manually entered authentication requests and exclude them from saving
and export; arbitrary application-defined secrets cannot be detected perfectly,
so reviewed redaction remains required for saved payloads.

This does not conceal data from the inspected page, which owns the runtime, or
retroactively sanitize historical bookmarks. Scope the guarantee to credentials
handled by the new session-reuse flow and its capture paths. Clearly document
that ordinary application payloads can contain sensitive data.

### Cleanup and finite resource use

Provide explicit Stop and Stop all. On panel close, page navigation, extension
context invalidation, source disconnect, or lease expiry, stop scheduling and
release owned resources. Application connections remain connected. Closed or
expired owned connections cannot be selected or resurrected by late events.

Use a panel lease renewed every 5 seconds and expiring after 30 seconds without
renewal, plus best-effort immediate disposal on known close/navigation. Evaluate
expiry before every dispatch and when the page next receives execution time;
browser suspension can delay cleanup, so do not promise real-time termination in
a frozen page. Do not restore active probes when a panel reopens.

These initial values are product limits implemented as named constants. Request
previews show relevant limits; tests cover each boundary.

| Resource                                         | Default / maximum                                           |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Single method wait or publication readiness wait | 10 seconds / user-selectable 1–60 seconds                   |
| Manual live publication observation              | Stop automatically after 60 seconds; start again explicitly |
| Matrix variants including optional baseline      | 20 maximum                                                  |
| Matrix dispatch concurrency                      | 1                                                           |
| Delay between matrix variants                    | 250 ms default; 100–5,000 ms selectable                     |
| Matrix total elapsed budget                      | 120 seconds maximum                                         |
| Active playground operations per panel           | 3; matrix owns one operation slot                           |
| Owned isolated connections per panel             | 3 maximum                                                   |
| Serialized request payload                       | 256 KiB maximum                                             |
| Per-run observed frames / captured payload       | 1,000 frames / 2 MiB, whichever occurs first                |
| Per-run materialized publication documents       | 1,000 maximum                                               |
| Aggregate ephemeral run history                  | 100 runs / 20 MiB; evict oldest inactive runs               |
| Saved cases / saved snapshots                    | 200 cases / 100 snapshots; aggregate 20 MiB                 |
| Import file / records                            | 10 MiB / 300 records, still subject to storage limits       |
| EJSON nesting depth / visited values             | 50 / 100,000 per payload                                    |
| Request ID ledger                                | 10,000 IDs per panel session                                |

Limits include metadata overhead where stored or bridged. Byte limits use UTF-8
serialized bytes. Limit violations before dispatch send nothing. During capture,
preserve bounded evidence, mark truncation, stop the owned probe, and stop queued
variants. Known non-data messages such as connection negotiation and heartbeat
frames do not invalidate document snapshots. Unknown or unsupported messages
that may affect document state mark capture incomplete with a visible reason;
never fabricate complete state. A method's server work may continue
after local capture stops. Rendering and diffs must respect these same budgets.

## Data contracts and compatibility

### EJSON and declarative operations

Use a typed EJSON representation over the bridge; decode in the page using the
target Meteor EJSON capability. Support standard JSON values and Meteor built-in
EJSON values, preserving dates, binary, special numeric values, and escaped
objects. Do not silently coerce custom EJSON types. Preserve their encoded form
for viewing; if the target lacks the registered decoder, reject execution with
an actionable error. No new production serialization dependency is planned.

All structural walkers use own properties, reject unsafe mutation paths such as
`__proto__`, and enforce depth/value limits. Import and assertions never call
`eval`, `Function`, or user-supplied callbacks. Versioned enum-like values and
operation names live in shared constants/types, not scattered magic strings.

### Storage

Use a separate Dexie database named `MeteorToolsPlaygroundDatabase`, schema
version 1, with `cases` and `snapshots` tables. This is additive and leaves the
existing `MeteorToolsDatabase` versions, bookmarks, and settings untouched.
Both record types have a record-format version independent of Dexie version.

| Record            | Required contents                                                                                                                                                                                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Saved case v1     | ID, format version, revision, title, created/updated times, operation kind/name, encoded parameter array, execution-mode preference, optional endpoint hint, notes/tags, expectations, matrix definition, excluded comparison paths, redaction metadata                                                                                       |
| Saved snapshot v1 | ID, format version, capture time, case ID/revision if applicable, immutable effective request, endpoint/context labels, authentication observation without credentials, execution semantics, outcome and independent completion flags, bounded result/error or document evidence, timing, truncation/incompleteness flags, redaction metadata |

Persist only on an explicit Save action with a payload preview. Automatic run
history and the observed catalog stay in memory. Snapshot saving is separate
from case saving. Storage errors preserve the unsaved in-memory draft and show
failure; never display Saved before the transaction commits. Enforce aggregate
quotas transactionally across panels. Do not automatically delete saved evidence
to make room; prompt through the UI to delete or export existing records.

Record IDs are UUIDs and imported records receive fresh local IDs. Remap links
between imported cases and snapshots in one transaction. Preserve source IDs as
non-executable provenance when useful. Do not overwrite matching local IDs or
case titles implicitly. Unknown future format versions are rejected without
partial writes; corrupt individual records are surfaced without erasing the
database. Test upgrades from an absent playground database and existing bookmark
database, and preservation when an older extension build is reopened.

### Import, export, and redaction

The public file envelope is JSON with `format: "meteor-devtools-playground"`,
`version: 1`, export time, and typed arrays of cases and snapshots. Document it in
a repository format reference with generated representative examples and field
semantics before shipping. Stable format changes require a version/migration
decision rather than opportunistic reinterpretation.

Export only selected records. Preview the complete export, preselect redaction
for known credential paths, and let users redact additional paths and endpoint
or identity labels. Never export the internal reuse credential or raw internal
login response under any option. Explain that automatic suggestions cannot find
all application secrets. Redaction applies to requests, results, errors, notes,
and comparison evidence, not just top-level arguments.

Represent redaction through an explicit list of JSON Pointers: remove object
properties and use null placeholders for array slots to preserve their positions.
The redaction metadata marks those slots as unknown, not actual null values.
Never use an ambiguous replacement string. Redacted cases
cannot run until missing required inputs are supplied. Comparisons show redacted
fields as unknown, and dependent expectations are inconclusive. Saving a redacted
snapshot never changes its unredacted in-memory source.

Import validates file size before parsing, envelope/record versions, field
allowlists, EJSON limits, pointers, matrices, and resource budgets. Show a preview
of accepted records and any error; the user chooses Import to persist. Import
never runs anything, selects a target, opens a URL, or requests authentication.
Reject an invalid file atomically with precise errors; preserve current data.

## Architecture and interfaces

Keep the existing React, MobX, Blueprint, WXT, and Dexie stack. Introduce focused
modules rather than putting lifecycle, transport, persistence, and rendering in
one store. The following paths are intended module boundaries; individual files
may be split for readability without changing the contracts:

| Area                                                         | Intended change                                                                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/Playground/`                                            | Shared contracts, validation, EJSON boundaries, run state, matrix generation, comparisons, expectations, redaction, named limits |
| `src/Injectors/Playground/`                                  | Version-compatible invocation adapter, owned probe manager, endpoint/auth capabilities, cleanup and sanitized event emission     |
| `src/Injectors/ConnectionRegistry.ts` and `DDPInjector.ts`   | Ownership/disposal support and pre-capture treatment of internal authentication                                                  |
| `src/Browser/Inject.ts`, `src/Bridge.ts`, bridge entrypoints | Register validated commands, correlate responses, carry page/panel identity, handle cleanup; no general bridge rewrite           |
| `src/Stores/Panel/PlaygroundStore.ts`                        | Drafts, run history, catalog, matrix progress, saved records, UI state                                                           |
| `src/Database/PlaygroundDatabase.ts`                         | New versioned tables and transactional quotas/import                                                                             |
| `src/Pages/Panel/Playground/`                                | Editor, results, catalog, cases, comparisons, matrix/export previews                                                             |
| Existing navigation, DDP menus, subscription views           | Add entry points and explicit source context                                                                                     |
| Both maintained `devapp-*` fixtures and tests                | Procedurally generated account/data scenarios and compatibility checks                                                           |
| `README.md`, `CHANGELOG.md`, format reference                | User workflows, privacy/storage behavior, limits, and versioned file contract                                                    |

Do not expose a new global application-facing API or require server packages for
normal usage. Fixture hooks remain fixture-only; update their existing versioned
contract if extended incompatibly. Existing performance instrumentation and
inspection must retain application return values and errors.

Add multiline TSDoc for the public file contract, transport invariants, ownership,
and non-obvious lifecycle behavior. Strict types and runtime validation serve
different purposes and both are required. No production dependency additions,
browser permission expansion, remote service, or arbitrary scripting is part of
the recommended design.

## Test strategy established before implementation

The current unit suite is useful for regression protection but insufficient for
playground execution. Design and run failing tests for each new contract before
or alongside its implementation. Generate EJSON trees, document streams, matrix
variants, account fixtures, and volume cases procedurally with deterministic
seeds; avoid large checked-in payload fixtures.

### Unit and component-level coverage

- Add pure tests for validation, EJSON round trips, missing/null distinctions,
  unsafe paths, quotas, matrix generation and deduplication, comparison,
  redaction, and assertion tri-state behavior.
- Use instrumented connection doubles to test connection routing, synchronous
  dispatch, concurrent identical calls, reordered/duplicate/late frames,
  no-retry behavior, stale epochs, duplicate commands, and cleanup. Replay retired
  session commands after reset, lease expiry, and reopen and verify no dispatch.
- Test every owned resource transition, lease expiry, disconnect, panel close,
  and identical app/probe subscriptions. Check credentials never reach mock
  outbound capture, cache, console, persisted records, or export. Test readiness
  timeout disposal, late readiness, shared deltas without an initial document,
  and heartbeat frames that leave otherwise complete evidence complete.
- Extend existing store/navigation/UI testing conventions for draft retention,
  context visibility, keyboard operation, disabled states, inline errors,
  truncation, comparison exclusions, and explicit import/save actions.
- Verify redacting argument zero in a two-argument array preserves argument one's
  index through save/export/import and blocks execution until the mask is resolved.
- Use browser IndexedDB integration for real transactions and cross-panel
  quotas rather than treating an in-memory mock as storage verification.

### Packaged browser integration

Extend both Meteor 2.16 and 3.5.1 fixtures with two deterministic test users,
owned/foreign records, an intentionally permissive fixture endpoint, a correctly
restricted endpoint, typed echo, controlled errors/delays, and named plus unnamed
overlapping publications. Test-only account setup must stay local to the fixtures
and never become a shipped application requirement.

Exercise the production extension path for captured replay on both connections,
async/sync compatibility, authenticated and anonymous probes, capability failure,
matrix stop semantics, saved-case reload, export/import into a separate browser
context, and cleanup. Verify server-side invocation counts for interrupted and
duplicate commands; checking only the UI is insufficient to establish no retry.

Native Chrome DevTools panels are not exposed through a supported Playwright page
target in the existing harness. Use the repository's packaged-panel harness for
automatable rendering and bridge checks, and retain a headed native DevTools
smoke for the actual panel lifecycle and keyboard/layout flow. Firefox production
build and manifest validation are mandatory; perform a headed Firefox smoke for
execution and cleanup and disclose if that environment is unavailable. Never
describe Chrome automation alone as Firefox runtime verification.

### Acceptance criteria and required evidence

| ID  | Observable acceptance criterion                                                                                                  | Required evidence                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| A1  | Captured, bookmarked, and manually entered requests open editable drafts; nothing is sent until Run.                             | UI/bridge tests and packaged workflow                         |
| A2  | Every run reaches its selected live connection; stale/unknown targets send nothing, including after reload.                      | Unit routing tests and two-server invocation counters         |
| A3  | Standard EJSON types round trip, malformed/custom unsupported input is explained, and no script executes.                        | Generated codec/validation tests on both runtimes             |
| A4  | Concurrent identical methods correlate correctly; result and writes completion work in either order.                             | Adapter tests plus fixture methods                            |
| A5  | Timeout, stop, disconnect, and duplicate commands never cause automatic method re-execution or false cancellation claims.        | State tests and server-side call counts                       |
| A6  | Shared probe cleanup preserves identical application subscriptions and app connections.                                          | Ownership tests plus live overlapping subscriptions           |
| A7  | Isolated inspection shows baseline/readiness/live data, ambient publication caveat, and bounded incomplete states.               | Document-reducer tests and unnamed-publication fixture        |
| A8  | Anonymous and supported explicit session reuse work on both fixtures; unsupported auth fails clearly without downgrade.          | Auth integration and capability-failure tests                 |
| A9  | Reuse credentials and internal login responses never enter ordinary capture, caches, console, saved cases, or exports.           | Capture-boundary tests and browser storage/message inspection |
| A10 | Catalog names remain connection-scoped, bounded, and distinguish observed application traffic from tool traffic.                 | Catalog/store tests                                           |
| A11 | Saved cases survive reload, preserve revisions, require target selection, and leave bookmarks/settings intact.                   | Real IndexedDB and existing-database integration              |
| A12 | Import/export is versioned, reviewed, atomic, bounded, redaction-aware, and never executes imported content.                     | Generated file tests and browser round trip                   |
| A13 | Two separately authenticated sessions can run the same case and compare labeled saved evidence across profiles.                  | Two-browser-context fixture workflow                          |
| A14 | Comparisons preserve type/missing distinctions and exclusions; incomplete evidence cannot silently pass whole-result assertions. | Pure comparison/assertion tests and UI states                 |
| A15 | Matrices preview all variants, enforce all caps, run sequentially, and stop correctly while preserving individual outcomes.      | Generated scheduler tests, fake clock, and server call counts |
| A16 | Panel close/navigation/invalidation/lease expiry release only owned resources and never log out the app.                         | Lifecycle tests and headed native-panel smoke                 |
| A17 | The UI is keyboard-accessible and usable in narrow/wide DevTools layouts; limits and identity uncertainty are visible.           | Component checks and headed UI review                         |
| A18 | Existing inspection/performance behavior, both builds/manifests, and maintained Meteor compatibility checks remain green.        | Repository verification commands and regression suite         |

All acceptance rows are currently **not executed** for this new feature. Update
this table or add a linked verification record with exact commands, outcomes,
warnings, and skipped environmental checks during implementation.

## Executable implementation checklist

These are dependency-ordered work units for one rollout. Commit each verified
unit with its associated tests and documentation. Parallelize independent pure
modules or reviews after their shared contracts are fixed; keep transport,
ownership, and storage mutations coordinated.

- [x] Resolve the three approval choices and record the actual authorization in
      this spec and decision.
- [x] Activate the requested implementation goal after committing these records.
- [ ] Establish adapter/fixture tests for connection-specific invocation,
      no-retry semantics, session reuse, and isolated transport disposal before
      building UI on those assumptions. Stop for a material design deviation if
      compatibility requires a different security boundary or dependencies.
- [ ] Define validated command, EJSON, saved-record, and run-lifecycle contracts
      with generated failing tests and named resource limits.
- [ ] Implement correlation and invocation adapters; replace default-only replay
      with draft entry and explicit connection routing.
- [ ] Implement owned connections, pre-capture credential handling, source-session
      capabilities, leases, and cleanup with lifecycle tests.
- [ ] Implement publication observation, baseline/snapshots, ambient-data labeling,
      and bounded reducers; prove shared subscription preservation.
- [ ] Implement catalog, request editor, results, and connection/context display
      in the existing navigation.
- [ ] Implement pure comparisons, exclusions, and declarative expectations, then
      connect them to immutable run snapshots.
- [ ] Implement deterministic matrices and the bounded sequential scheduler,
      including preview and interruption behavior.
- [ ] Implement the separate Dexie schema, reviewed save/import/export,
      redaction, transactional quotas, and cross-session snapshot selection.
- [ ] Complete procedural authenticated fixtures and production-extension
      integration for every acceptance criterion on both Meteor releases.
- [ ] Update README and privacy wording, add the public format reference, update
      `CHANGELOG.md` under Unreleased, and revise the decision to implemented.
- [ ] Run formatting checks, `yarn lint`, `yarn typecheck`, `yarn test`,
      `yarn build:chrome`, `yarn validate:chrome`, `yarn test:e2e:all`,
      `yarn build:firefox`, and `yarn validate:firefox`. Run the repository audit
      checks required by CI; record environmental/pre-existing failures honestly.
- [ ] Perform headed Chrome and Firefox smoke checks; record exact coverage and
      any unavailable native-panel boundary rather than inferring success.
- [ ] Review implementation against A1–A18, verify documentation and manifests
      agree, and commit the completed work with hooks and signing enabled.

## Implementation evidence

The encoded-value foundation now has 13 passing tests covering EJSON encoding
preservation, parameter validation, UTF-8 size, nesting/value limits, canonical
comparison, and unsafe object shapes. The initial test run failed because the
module was absent; the implemented module then passed. The existing three
build-tooling tests also passed. `yarn typecheck`, focused ESLint, and Prettier
checks passed. A dedicated strict TypeScript project now checks playground code
and its unit tests through the existing `yarn typecheck` command.

This establishes a shared input foundation, not completion of A3's live runtime
round trip or any other end-to-end acceptance criterion. Compatibility and
authentication fixture work is in progress.

The command/session foundation adds 17 passing tests for strict operation and
context validation, whole-command size, page/panel identity, lease expiry,
retirement callbacks, and duplicate-command protection at capacity. Its initial
test run failed before the modules existed; focused lint, formatting, and strict
typechecking then passed with the implementation. These pure tests do not yet
prove browser cleanup or end-to-end dispatch behavior.

## Direct rollout

Ship all included capabilities together in the next user-authorized release.
Do not invent a version or release date. No feature flag or staged product release
is required. Opening the Playground is passive; explicit actions start probes or
matrices, save evidence, or reuse authentication.

Existing users retain bookmarks, settings, and inspection defaults. Their first
save creates the separate playground database. The old replay icon becomes Edit
and run; document this visible behavior change. Update README privacy language
to acknowledge user-triggered DDP execution and owned connections to the
inspected application's server, plus local saved evidence and exports.

No publishing, store upload, deployment, or new browser permission is part of the
implementation goal unless separately authorized.

## Risks, uncertainty, and recovery

| Risk / uncertainty                                                                   | Required response                                                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Meteor private invocation/endpoint internals differ between releases.                | Keep narrow capability adapters, prove both fixtures early, and reject unsupported capabilities clearly.                       |
| Standard resume credentials are not exposed for every connection/auth configuration. | Reuse only with proven provenance; report unavailable. Never promise universal login cloning.                                  |
| An additional connection changes server connection counts or triggers server hooks.  | Explain owned connection semantics and dispose promptly; isolation is not a server sandbox.                                    |
| A method or subscription can change server state.                                    | Make Run explicit, show context/variant preview, prohibit automatic retry, and never promise rollback of remote effects.       |
| Ambient publications or concurrent writers confound comparisons.                     | Retain timestamps/baselines and explicit attribution limits; user interprets the evidence.                                     |
| Browser suspension delays cleanup.                                                   | Lease plus event-driven disposal; show interruptions and clean before any resumed dispatch.                                    |
| Captured payloads can contain application secrets.                                   | Explicit saving, reviewed redaction/export, bounded retention, and a strict separate internal-auth capture boundary.           |
| Limits hide part of a result.                                                        | Preserve truncation metadata throughout saving, importing, comparing, and asserting.                                           |
| A full rollout increases integration cost.                                           | Complete compatibility/lifecycle tests first and use reviewable verified commits; do not omit requested capabilities silently. |

Rollback removes the playground entry points and command handlers and restores
the prior release behavior. Stop all owned resources before disabling execution;
page reload is the fallback if an injected runtime cannot be replaced cleanly.
Saved playground records can remain inert in their separate database, so older
bookmark/settings storage remains usable. Export desired evidence before any
explicit playground-data deletion. Reverting the extension cannot undo writes
already performed on the server.

Implementation choices that materially change these contracts require an updated
spec/decision and an explanation of consequences and alternatives before
proceeding. Routine file splits and equivalent test organization do not.

## Review and handoff

Review in this order: approval choices and user workflow; execution/authentication
and cleanup contracts; saved/imported data formats; acceptance matrix; rollout
and recovery. During implementation, review pure contracts before adapters,
adapters before UI, and production fixture evidence before release readiness.

The final handoff must list changed files/interfaces, decisions and deviations,
verification against A1–A18, skipped checks, limitations, and rollback guidance.
This specification itself changes no runtime behavior or manifest version and
does not warrant a changelog entry claiming delivered functionality.

## Primary references

- [Meteor methods, subscriptions, and connection APIs](https://docs.meteor.com/api/meteor)
  inform the invocation, subscription ownership, and compatibility investigation.
- [DDP protocol](https://github.com/meteor/meteor/blob/devel/packages/ddp/DDP.md)
  defines correlation signals and connection-level document messages. Dedicated
  connection attribution limits are a design inference from those semantics.
- [Meteor Accounts](https://docs.meteor.com/api/accounts) documents current account
  storage modes; this supports capability detection rather than assuming every
  app exposes a reusable token. Current docs do not prove Meteor 2 compatibility.
- [Existing connection-identity decision](../decisions/2026-09-01-ddp-connection-identity.md)
  establishes object identity and page-local connection scoping in this project.
