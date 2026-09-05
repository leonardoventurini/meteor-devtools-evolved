# DDP Playground rollout

**Date:** 2026-09-05<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>
**Status:** Accepted for implementation on 2026-09-05; not yet implemented.<br>
**Specification:** [DDP Playground: complete rollout](../specs/2026-09-05-ddp-playground.md)

## Context

The user requested a balanced feature set for DDP-based debugging and targeted
security testing, then explicitly included every proposed follow-up in one
rollout. Existing replay uses the default Meteor connection without run
correlation. Connection-scoped capture, local Dexie storage, and Meteor 2/3
fixtures provide reusable infrastructure, but execution ownership, authentication
handling, saved cases, and comparisons need explicit contracts.

## Decision

Deliver one DDP Playground release containing editable method invocation,
publication probes, observed endpoint catalog, correlated results, structured
comparison, saved cases and reviewed import/export, bounded parameter matrices,
cross-session comparisons, and isolated connections. Implement in independently
verified commits without deferring any included capability to a later release.

The user approved all recommended options before goal activation, including
additive storage and owned connections without new production dependencies or
browser permissions. Apply these architectural boundaries:

- Derive every target from a selected live application connection and bind each
  run to page epoch, panel session, and connection identity. Never silently use
  the default connection.
- Use fresh invocations with no automatic retry, explicit completion evidence,
  and bounded scheduling. Do not provide exact raw-frame replay or scripting.
- Keep dedicated probe connections owned, leased, and disposable. Start without
  tool-initiated authentication; support explicit in-memory session reuse only
  where provenance and runtime capability are proven.
- Prevent internal authentication frames from reaching ordinary capture before
  the page-message/cache boundary. Do not store or export reuse credentials.
- Describe publication results as observed connection data, with baselines and
  ambient-publication limitations even on dedicated connections.
- Compare independently captured labeled snapshots across sessions. Use local
  persistence and reviewed export/import between profiles, without a live
  cross-profile service or credential coordination.
- Add a separate versioned Dexie database and public JSON format, preserving the
  existing bookmark database. Save only through explicit reviewed actions.
- Reuse the existing stack without new production dependencies or browser
  permissions. Verify both maintained Meteor versions and both browser builds.

Implementation and verification are authorized. Publishing a release and changes
outside these boundaries require separate authorization.

## Alternatives and rationale

An automated scanner, endpoint dictionary guessing, arbitrary JavaScript runner,
or high-volume fuzzer would expand the product beyond the requested balanced
workflow. Declarative cases and small explicit matrices provide reproducible
evidence with a tractable execution model.

Sharing live credentials or coordinating profiles through a companion service
would add privileges, deployment, and storage obligations. Snapshot comparison
provides the requested cross-session analysis without those architectural costs.

Using the existing bookmark schema for every playground record would couple
rollback and evolution to established user data. A separate database leaves
existing data intact while versioning the new public import/export contract.

A dedicated connection cannot guarantee per-publication provenance because
servers may publish ambient data and DDP documents lack publication ownership.
Baseline and delta views are useful, but labeling them as an exact publication
result would overstate the evidence.

## Consequences

Native compatibility testing established that an isolated transport must finish
its initial handshake before a no-retry call, and that server outcome must use
the result signal rather than an async promise or final callback. A call handed
to Meteor remains in flight while an async stub waits; local Stop cannot promise
to cancel it. The implementation therefore records invocation separately from
wire dispatch and keeps late evidence without restarting queued matrix work.
This clarifies the approved execution model without manipulating Meteor's
internal method completion bookkeeping.

Packaged integration also established that Meteor 3 queues subscription sends
behind asynchronous stubs. Ownership therefore uses a newly allocated native
subscription registry ID, then correlates its later DDP frame. It never adopts
a pre-existing application ID or bypasses Meteor's queue. Completed publication
adapters release observation state; immutable evidence remains in bounded history.
Custom EJSON decoders receive cloned encoded values so decoder mutation cannot
rewrite retained request evidence.

Cases, snapshots, and transfers share an explicit review step before persistence
or download. Loaded redacted request fields block execution until their
replacements are explicitly reviewed; intentional null is a user decision.
The native provider, runner, and panel use the approved separate connection and
storage architecture without new production dependencies or browser permissions.

Both maintained native transports retain an online listener after permanent
disconnect. The owned-connection helper captures and removes that specific
constructor-time listener, preserving application listeners. Standard constructor
capability is tested at the unit boundary; packaged runner integration must
still verify this cleanup against real runtimes before rollout completion.

This is a substantial single rollout whose release gate includes authentication,
cleanup, protocol correlation, quotas, and storage tests, not only UI completion.
Custom authentication and transports may be unavailable with explicit reasons;
the maintained standard configurations must work in both fixtures.

The playground can trigger real server effects. Timeout or local stop cannot undo
them. Reverting the feature leaves new saved records inert and preserves existing
bookmarks, but cannot reverse remote mutations. Update this record with
implementation deviations and verification before declaring the
rollout complete.
