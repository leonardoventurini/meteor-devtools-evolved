# Demand-Driven Capture Work

**Date:** 2026-09-01<br>
**Project:** `meteor-devtools-evolved`<br>
**Project root:** `/Users/leonardo/Repositories/leonardoventurini/meteor-devtools-evolved`<br>
**Issues:** [#34](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/34)

## Context

The extension captured and parsed a 50-frame JavaScript stack for every inbound
and outbound DDP message. Every non-heartbeat message also scheduled a complete
snapshot of every Minimongo collection, even when the Minimongo panel was not
being inspected. DDP history was retained without a bound. Reporters observed
high CPU, memory, rendering, and DDP latency under message-heavy workloads.

Inbound callbacks execute inside Meteor's dispatch path, so their synchronous
stack describes Meteor internals rather than the application code that
initiated an operation. Outbound calls can retain an actionable application
call site. The panel already has an explicit bridge request that obtains a
Minimongo snapshot when the user selects that panel.

## Decision

- Capture stacks only for outbound, non-heartbeat DDP messages.
- Refresh Minimongo snapshots only through explicit panel bridge requests; DDP
  traffic does not rebuild collection snapshots.
- Retain at most the newest 5,000 DDP events in the panel store.
- Remove per-batch and per-document console diagnostics from capture hot paths.
- Enforce these policies with deterministic operation-count and retention tests
  instead of environment-sensitive wall-clock thresholds.

## Rejected alternatives

### Sample all inbound and outbound stacks

Sampling would reduce cost but still spend work on inbound stacks that cannot
identify the initiating application call site. It also makes trace availability
unpredictable without adding equivalent diagnostic value.

### Continue periodic full Minimongo snapshots

A longer throttle interval still clones every document when the panel is not in
use and creates an arbitrary freshness/performance tradeoff. Explicit refresh
ties the cost to inspection intent and provides a simple deterministic
contract.

### Retain unlimited DDP history

Unlimited history preserves every event but guarantees session-length memory
growth. Export or persistence can be designed separately if users need a full
long-running trace; the interactive panel should remain bounded.

### Gate CI on browser wall-clock timing

Browser timing varies substantially by runner and payload. Operation counts and
data bounds directly protect the architectural hot paths without flaky gates.

## Rationale

The chosen boundary preserves actionable outbound diagnostics and complete DDP
payload capture while eliminating two forms of repeated work that scale with
traffic and collection size. It also bounds the only session-growing event
store. Each behavior is testable without a live browser benchmark.

## Consequences

- Inbound DDP rows no longer offer a stack trace.
- Minimongo data refreshes when explicitly requested rather than continuously
  following background traffic.
- The oldest DDP event is evicted after the 5,000-event limit is reached.
- The existing byte totals remain session totals and may exceed the bytes of
  the currently retained rows.
- A future export feature must obtain data before eviction or introduce bounded
  persistence outside the interactive store.
