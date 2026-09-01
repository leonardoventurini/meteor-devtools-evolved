# Open GitHub Issues Analysis

**Repository:** `leonardoventurini/meteor-devtools-evolved`  
**Analysis date:** 2026-09-01  
**Code baseline:** `73661a0` (`development`)  
**Scope:** All open GitHub issues; pull requests and security alerts excluded

## Executive summary

The repository has eight open issues: three bugs, three suggestions, and two
unlabeled requests. None has an assignee or milestone. The backlog contains one
high-impact performance problem, several valid but stale feature requests, one
likely obsolete compatibility question, and two reports that need fresh
reproduction against the current extension.

Recommended headline actions:

1. Treat [#34](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/34)
   as the top engineering priority. Current capture behavior provides credible
   mechanisms for the reported slowdown and needs measurement plus redesign.
2. Close [#53](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/53)
   with evidence from the maintained Meteor 3.5.1 fixture, while directing any
   performance-specific follow-up to #34.
3. Reproduce [#33](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/33)
   against Meteor 2.16 and 3.5.1. Its instrumentation targets legacy synchronous
   collection methods and may not cover modern async APIs.
4. Implement [#16](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/16)
   as a small layout fix, then tackle the JSON usability work in
   [#54](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/54).
5. Keep #5, #10, and #27 open as explicit roadmap items, but define narrower
   contracts before implementation.

## Priority overview

| Priority | Issue | Assessment | Recommended disposition |
| --- | --- | --- | --- |
| P0 | [#34 Performance Issues](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/34) | Confirmed risk; current architecture plausibly explains reports | Reproduce, benchmark, and fix before adding capture-heavy features |
| P1 | [#33 Performance Tab empty](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/33) | Likely still valid or incomplete on modern Meteor | Reproduce and redesign instrumentation with #34 work |
| P1 | [#54 Collapse/filter collection JSON](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/54) | Valid current UX gap with clear user value | Split into incremental tree-state and search improvements |
| P2 | [#16 Responsive subscription columns](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/16) | Current fixed width still conflicts with request | Implement as a quick, testable layout improvement |
| P2 | [#5 Unnamed collections](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/5) | Unsupported; multiple users expressed value | Research Meteor 2/3 registration internals and add stable synthetic IDs |
| P2 | [#10 Additional DDP connections](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/10) | Unsupported by hard-coded default connection | Specify connection discovery/registration before implementation |
| P3 | [#27 MiniMongo shell](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/27) | Valuable but broad and potentially expensive | Start with safe structured find/findOne UI, not an arbitrary shell |
| Close | [#53 Meteor 3+ support?](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/53) | Compatibility question is answered; reporter agreed to close | Close with fixture/test evidence and cross-reference #34 |

## Detailed issue analysis

### #34 — Performance Issues

**Opened:** 2022-04-20 · **Last activity:** 2025-10-01 · **Label:** `bug`  
**Priority:** P0 · **Confidence:** High that material performance risks remain

Several users across macOS and Windows reported severe CPU, memory, rendering,
and DDP latency when the extension is enabled. Reports include hundreds of
15–20 KB documents, subscription-heavy pages, Chrome and Firefox, and systems
ranging from Intel Macs to Apple Silicon. The number and diversity of reports
make a machine-specific explanation unlikely.

Current implementation evidence:

- Every inbound and outbound DDP message calls `sendLogMessage`, which captures
  and parses as many as 50 stack frames before forwarding the event
  ([`Inject.ts`](../src/Browser/Inject.ts), lines 9 and 44–50).
- Every non-ping/pong message schedules a complete Minimongo snapshot
  ([`Inject.ts`](../src/Browser/Inject.ts), lines 53–57).
- Each snapshot clones and normalizes every document in every registered
  collection, with leading and trailing throttled runs every second
  ([`MinimongoInjector.ts`](../src/Injectors/MinimongoInjector.ts), lines 22–35).
- Every normalized document is serialized again for display metadata, and the
  current wrapper logs every collection name to the page console
  ([`MinimongoStore/index.ts`](../src/Stores/Panel/MinimongoStore/index.ts),
  lines 126–138).
- DDP subscription metadata repeatedly searches the accumulated log collection,
  adding work as the session grows
  ([`DDPStore.ts`](../src/Stores/Panel/DDPStore.ts)).

The recent increase from 15 to 50 captured frames improves diagnostics but may
worsen this issue under high DDP volume. That tradeoff should be measured rather
than assumed acceptable.

**Recommended next action:** Create a repeatable stress fixture with configurable
message rate, document count, and payload size. Benchmark four independently
switchable costs: DDP interception, stack capture, Minimongo snapshots, and
panel rendering. Then:

- capture stack traces only when enabled, sampled, or explicitly requested;
- update Minimongo incrementally from DDP `added`/`changed`/`removed` events or
  refresh only when the Minimongo panel is visible;
- remove per-document console logging;
- impose bounded DDP retention with explicit export/clear controls;
- add performance budgets to CI for pure transformation stages.

**Disposition:** Keep open, label `bug`, assign an owner, and make it the next
substantial engineering project.

### #33 — Performance Tab empty

**Opened:** 2022-04-19 · **Last activity:** 2022-04-20 · **Label:** `bug`  
**Priority:** P1 · **Confidence:** Medium

The only report predates the current React, Meteor, manifest, and build stacks,
so it needs a fresh reproduction. However, the present instrumentation still
has clear coverage gaps:

- It wraps only `find`, `findOne`, `insert`, `update`, `upsert`, and `remove`
  discovered through `Object.entries(Mongo.Collection.prototype)`
  ([`MeteorAdapter.ts`](../src/Injectors/MeteorAdapter.ts), lines 28–55).
- It does not include Meteor 3 async APIs such as `insertAsync`, `updateAsync`,
  `upsertAsync`, and `removeAsync`.
- It measures only synchronous return time. Promise settlement and cursor work
  are not represented, so modern calls may be missing or misleading.

**Recommended next action:** Add fixture tests that execute synchronous Meteor 2
operations and asynchronous Meteor 3 operations, asserting that Performance
events appear. Replace broad prototype mutation with explicit, version-aware
wrappers and record sync duration separately from asynchronous completion time.

**Disposition:** Keep open until reproduced. Link it to #34 because performance
instrumentation must be low-overhead before it is expanded.

### #54 — Collapse collection JSON and/or filter JSON display

**Opened:** 2025-07-29 · **Last activity:** 2025-07-29 · **Label:** none  
**Priority:** P1 · **Confidence:** High

The issue asks for collapsed-by-default nested JSON, collapse-all controls,
filtering by keys/values, Mongo-style document queries, projected fields, and a
visible `_id` in document lists. The central complaint remains valid:

- Object and array nodes currently default to collapsed only below level five
  ([`Collapsible.tsx`](../src/Utils/ObjectTreerinator/Collapsible.tsx), line 14).
- The existing Minimongo search filters whole document strings at the list level;
  it does not filter or highlight keys/values inside the expanded tree
  ([`CollectionStore.ts`](../src/Stores/Panel/MinimongoStore/CollectionStore.ts)).
- Document rows show a truncated JSON preview rather than a dedicated `_id`
  column ([`MinimongoRow.tsx`](../src/Pages/Panel/Minimongo/MinimongoRow.tsx),
  lines 42–55).

**Recommended next action:** Split the request into deliverable increments:

1. Add Expand all / Collapse all and a persisted default expansion depth.
2. Show `_id` as a dedicated, copyable row field.
3. Add key/value tree filtering with ancestor preservation and match highlights.
4. Specify a constrained query/projection model; coordinate it with #27 rather
   than evaluating arbitrary JavaScript.

**Disposition:** Keep open, add the `suggestion` label, and use it as the parent
issue for JSON inspection usability.

### #16 — Responsive subscription table columns

**Opened:** 2020-10-20 · **Last activity:** 2021-10-07 · **Label:** `bug`  
**Priority:** P2 · **Confidence:** High

The owner agreed to fix this, but current code still caps both subscription name
and parameters at `25vw`, regardless of available table width
([`Subscriptions.tsx`](../src/Pages/Panel/Subscriptions/Subscriptions.tsx),
lines 82–93). The table itself fills the panel, leaving unused space possible
while parameter text remains truncated. Clicking a row exposes the complete
parameters, but that does not satisfy scanability.

**Recommended next action:** Use a fixed or compact width for ID/status/duration,
allow Params to consume remaining width, and add an expandable/wrapping row or
copy action. Verify narrow, medium, and wide panel layouts.

**Disposition:** Keep open and implement as a quick win.

### #5 — Add support for unnamed collections

**Opened:** 2020-04-06 · **Last activity:** 2021-10-07 · **Label:** `suggestion`  
**Priority:** P2 · **Confidence:** High that it remains unsupported

The current collector reads only
`Meteor.connection._mongo_livedata_collections` and keys results by
`collection.name` ([`MinimongoInjector.ts`](../src/Injectors/MinimongoInjector.ts),
lines 12–27). A client-only `new Mongo.Collection(null)` may not be registered in
that map, and a null name cannot serve as a stable key for multiple collections.

**Recommended next action:** Research collection registration behavior in both
Meteor 2.16 and 3.5.1. If unnamed collections cannot be discovered reliably,
instrument collection construction and maintain a weak registry. Display stable
session-scoped labels such as `Local collection 1`, while retaining the actual
null name in metadata.

**Disposition:** Keep open. Add acceptance tests with multiple unnamed
collections to prevent key collisions.

### #10 — Additional DDP connections

**Opened:** 2020-06-15 · **Last activity:** 2021-10-07 · **Label:** `suggestion`  
**Priority:** P2 · **Confidence:** High that it remains unsupported

DDP interception, subscription lookup, and Minimongo collection access are all
hard-wired to `Meteor.connection`:

- [`DDPInjector.ts`](../src/Injectors/DDPInjector.ts), lines 7–37;
- [`MeteorLibrary.ts`](../src/Browser/MeteorLibrary.ts), lines 4–10;
- [`MinimongoInjector.ts`](../src/Injectors/MinimongoInjector.ts), line 13.

Meteor does not expose a dependable public global containing every connection,
so automatic discovery may require instrumenting `DDP.connect` or offering a
page API that applications use to register connections.

**Recommended next action:** Define a connection identity contract first. Then
intercept future `DDP.connect` calls, include the default connection, and expose
a selector that scopes DDP, subscriptions, and Minimongo data consistently.
Avoid silently merging data from different servers.

**Disposition:** Keep open as a medium-sized feature with a written design.

### #27 — MiniMongo shell

**Opened:** 2021-08-05 · **Last activity:** 2021-10-07 · **Label:** `suggestion`  
**Priority:** P3 · **Confidence:** High that it is not implemented

No shell or `find`/`findOne` query interface exists. The current search is a
case-insensitive substring match over serialized document wrappers. A literal
JavaScript shell would add security, serialization, CSP, cross-world execution,
autocomplete, and error-reporting complexity.

**Recommended next action:** Start with a structured query builder supporting a
document selector, sort, limit, and projection. Execute it against the captured
snapshot where possible; use page-world Minimongo only when semantic fidelity
requires it. Define supported operators and EJSON types explicitly. This work
should follow #34 so large query results do not deepen existing performance
problems and should share projection/filter UX with #54.

**Disposition:** Keep open, but rename or clarify it as a safe query interface
rather than an unrestricted shell.

### #53 — Meteor 3+ support?

**Opened:** 2025-04-27 · **Last activity:** 2026-02-02 · **Label:** none  
**Priority:** Close · **Confidence:** High

The issue began as a compatibility question with an imprecise accuracy concern.
A collaborator reported successful Meteor 3 usage, and the reporter later said
the original problem was a subscription-heavy slow page, had been mitigated,
and could be closed.

The repository now maintains `devapp-3.5` pinned to Meteor 3.5.1 with explicit
release assertions, full-app tests, a production build smoke test, and a working
Rspack development server. This directly answers the compatibility question.

**Recommended closing comment:** Meteor 3 is supported and continuously
represented by the Meteor 3.5.1 fixture. Thank the reporter, close the issue,
and direct reproducible slowdown reports to #34 with Meteor version, message
volume, payload size, and a minimal reproduction.

**Disposition:** Close as answered/resolved; do not treat it as an independent
Meteor 3 defect.

## Proposed roadmap

### Phase 0 — Backlog hygiene

- Close #53 with current fixture evidence and cross-reference #34.
- Add `suggestion` to #54 and add consistent priority/area labels to all issues.
- Assign an owner and milestone to #34.
- Request current-version reproduction details on #33 and #34.

### Phase 1 — Performance and correctness foundation

- Build a high-volume Meteor fixture scenario and benchmark #34.
- Add runtime switches for stack capture and Minimongo synchronization.
- Replace full repeated snapshots with incremental or visibility-driven updates.
- Modernize Performance instrumentation for Meteor 2 sync and Meteor 3 async
  collection APIs, resolving or narrowing #33.

### Phase 2 — High-value inspection UX

- Fix responsive subscription columns (#16).
- Deliver collapse depth, expand/collapse all, `_id` visibility, and tree search
  from #54 in separate reviewed increments.
- Add unnamed collection discovery and collision-safe display identities (#5).

### Phase 3 — Broader data access

- Design and implement multiple DDP connection identities and selection (#10).
- Build a constrained Minimongo query/projection interface shared by #27 and
  the advanced parts of #54.

## Suggested issue labels

| Issue | Suggested labels |
| --- | --- |
| #34 | `bug`, `priority: critical`, `performance`, `needs reproduction` |
| #33 | `bug`, `performance`, `meteor-3`, `needs reproduction` |
| #54 | `suggestion`, `minimongo`, `ux` |
| #16 | `bug`, `subscriptions`, `ux`, `good first issue` |
| #5 | `suggestion`, `minimongo`, `meteor-internals` |
| #10 | `suggestion`, `ddp`, `architecture` |
| #27 | `suggestion`, `minimongo`, `needs design` |
| #53 | `close: answered` |

## Methodology and limitations

This report reviewed all issues returned by GitHub's open-issue query on
2026-09-01, including every available comment, and compared their claims with
the `development` branch at commit `73661a0`. It did not change issue state,
labels, assignees, milestones, or comments. It did not include pull requests,
Dependabot alerts, or closed issues.

Code inspection can establish missing capabilities and credible performance
mechanisms, but it cannot prove runtime severity. Issues #33 and #34 therefore
need controlled reproduction and profiling before selecting exact fixes.
