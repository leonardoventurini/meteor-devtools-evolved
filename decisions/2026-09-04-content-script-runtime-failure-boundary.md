# Content-script Runtime Failure Boundary

## Context

After an extension reload or update, Chrome can leave the old content script in
an existing webpage until that page reloads. The page-world injector continues
emitting messages, but the isolated content script's extension runtime is no
longer valid. `runtime.sendMessage` can then throw synchronously or reject its
Promise asynchronously. Handling only Promise rejection left the synchronous
error uncaught in Chrome's extension error log.

## Decision

Route content-script runtime messages through a typed asynchronous boundary that
converts both synchronous throws and asynchronous rejections into a boolean
failure. On failure, detach the page message listener so the stale context stops
attempting extension communication.

## Rejected alternatives

- Checking `runtime.id` before every message was rejected because the check can
  race invalidation and accessing the runtime itself may fail.
- Matching the text of `Extension context invalidated` was rejected because
  browser wording is not a stable API and the existing behavior already stops
  forwarding on any runtime-send failure.
- Reinjection from the stale content script was rejected because an invalidated
  context cannot safely revive itself; Chrome requires the host page to reload
  content scripts after extension changes.

## Rationale

Placing the try/catch around the actual API invocation is the only boundary that
contains both failure timing modes. Returning a typed result keeps lifecycle
handling explicit and independently testable.

## Consequences

Host pages no longer accumulate uncaught invalidated-context errors after the
extension reloads. Capture remains stopped in that stale page until the user
reloads it, which is Chrome's required content-script update lifecycle. Any
runtime-send failure detaches forwarding, matching the prior intended Promise
rejection behavior.
