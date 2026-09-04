# Invalidated Content-script Context Handling

## Problem

Reloading or updating the unpacked extension can leave an old content script in
an already-open webpage until that page reloads. The page-world Meteor injector
continues posting messages, and the stale content script calls
`runtime.sendMessage`, producing an uncaught `Extension context invalidated`
error in Chrome's extension error log.

## Evidence

- `src/entrypoints/content.ts` calls `browser.runtime.sendMessage(...)` and only
  attaches a Promise rejection handler.
- Chrome can throw synchronously while evaluating that API call after the
  extension context has been invalidated, before a Promise exists.
- Chrome's extension documentation states that content-script updates require
  both the extension and the host page to reload:
  https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#reload-extension
- Chrome documents content scripts as isolated extension contexts that use
  `runtime.sendMessage` to communicate with the extension:
  https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts

## Scope and contracts

- Wrap runtime message forwarding so synchronous throws and asynchronous
  rejections both resolve to a typed failure result.
- Never allow invalidated-context failures to escape the page message handler.
- Detach the stale `window` message listener after the first forwarding failure.
- Preserve successful forwarding and existing source validation.
- Do not hide unrelated exceptions outside the runtime forwarding boundary.

## Uncertainty

Chrome does not expose a supported way to revive an invalidated content-script
context. The newly loaded extension becomes functional after the host page is
refreshed, as required by Chrome's lifecycle.

## Risks and recovery

Detaching on any send failure can stop capture after a transient messaging
failure. This matches the existing intended behavior, which already detached in
the Promise rejection handler. Reverting the helper restores the former
Promise-only handling.

## Executable checklist

- [x] Test successful forwarding.
- [x] Test synchronous invalidated-context throws.
- [x] Test asynchronous runtime rejection.
- [x] Use the safe forwarding boundary in the content script.
- [x] Preserve listener teardown on failure.
- [x] Update the changelog and record the lifecycle decision.
- [x] Run full tests, lint, typecheck, Chrome build, and whitespace checks.

## Direct rollout

Ship directly in the next extension build. No permissions, data migration, or
feature flag are required.

## Verification

Acceptance requires all three forwarding outcomes to be covered, source-level
confirmation that the stale listener is removed, and the complete project
verification suite to pass.
