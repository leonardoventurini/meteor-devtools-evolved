# Browser Manifest Privacy and Compatibility

## Context

The extension retained a custom Universal Analytics sender, a retired tracking
ID, and Google Analytics host permissions after project telemetry was retired.
The Firefox manifest also lacked the identity, compatibility, and data-use
metadata expected by current AMO validation.

Chrome and Firefox do not yet share a reliable background-worker manifest
contract: Chrome uses Manifest V3 service workers, while Firefox supports the
existing Manifest V2 background script without a browser-specific MV3 split.

## Decision

- Remove analytics code, event calls, its UUID dependency, and Google Analytics
  host access. Declare no data collection in the Firefox manifest.
- Keep Chrome on Manifest V3 and Firefox on Manifest V2.
- Set Firefox desktop 140.0 and Android 142.0 as the minimum versions and
  preserve the published AMO ID.
- Remove Firefox's unnecessary `tabs` permission.
- Limit content injection and Chrome's exposed injected resource to HTTP(S)
  pages, the supported Meteor application surface.
- Generate packaged manifest versions from `package.json`.

## Rejected alternatives

- Replacing Universal Analytics with GA4 was rejected because telemetry is no
  longer a product requirement and would require explicit consent and data-use
  design.
- Keeping dormant analytics permissions was rejected because it violates least
  privilege and misrepresents current behavior.
- Converting Firefox to Manifest V3 in this change was rejected because Firefox
  background support differs from Chrome and would require a separate runtime
  migration and browser smoke-test effort.
- Retaining `<all_urls>` was rejected because non-HTTP schemes are outside the
  supported Meteor web application contract.

## Rationale

The selected design matches actual behavior, minimizes browser privileges,
removes obsolete data transmission, and makes store metadata deterministic.
Firefox 140 is the first desktop release supporting the built-in data-collection
declaration used here; Android support begins with Firefox 142.

## Consequences

The extension no longer sends page views, page metadata, user-agent data, or
navigation events to Google Analytics. File URLs and other non-HTTP schemes are
no longer injected. Future telemetry requires a new explicit privacy decision,
consent design, manifest declaration, and tests. A future Firefox Manifest V3
migration remains a separate architectural change.

## Verification

Vitest enforces the source-manifest privacy and compatibility contracts. Both
production builds verify generated versions, and Firefox store lint checks the
packaged manifest.
