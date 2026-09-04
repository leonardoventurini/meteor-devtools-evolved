# Modern Meteor Brand Mark

## Context

The legacy icon's neon stripe treatment and asymmetric canvas padding made it
look dated and visually misaligned when reused in the new panel toolbar.

## Decision

Adopt a minimal diagonal meteor/comet mark with a dominant red body and one
cool-blue trail. Maintain a normalized 512px transparent master and derive all
packaged raster sizes from it while preserving existing public icon paths.

## Rejected alternatives

- Retaining CSS translation was rejected because it treats one rendering
  surface instead of correcting the source artwork.
- Updating only the toolbar icon was rejected because it would split the
  extension into two visual identities.
- A badge or enclosing tile was rejected to keep the mark lightweight against
  both browser chrome and the dark developer-tools toolbar.

## Rationale

Bold geometry survives favicon-scale downsampling better than the legacy thin
stripes. A single normalized master prevents size variants from drifting and
unchanged manifest paths make the branding update operationally safe.

## Consequences

Browser extension chrome and the panel toolbar now share one modern identity.
Future changes should update the master first and regenerate the complete icon
family rather than editing individual sizes.
