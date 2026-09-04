# Modern Meteor Icon Family

## Problem

The existing extension icon uses dated neon stripes and stores its visible mark
off-center inside the PNG canvas. Reusing it in the panel toolbar therefore
requires a CSS optical-offset workaround and still produces inconsistent
branding across surfaces.

## Evidence

ImageMagick measured the visible content of `meteor-32.png` as a 24×24 region
offset 8px down and right within its 32×32 canvas. The toolbar screenshot shows
the resulting mark reading low and right despite a mathematically centered
layout box.

## Desired outcome

Replace the complete packaged icon family with a modern minimal meteor/comet:
dominant Meteor red, one cool-blue accent, transparent background, centered
content, and a strong silhouette down to 16px.

## Scope and contracts

- Keep the public icon paths and manifest interface unchanged.
- Store one normalized 512×512 master and derive 16, 32, 48, 64, and 128px
  PNGs from it.
- Preserve transparency and equal safe area around the visible artwork.
- Remove toolbar-specific optical translation after fixing the source asset.
- Keep the toolbar rendering at 24×24px and non-interactive.
- Add no production dependency.

## Uncertainty

Raster downsampling necessarily softens diagonal edges at 16px. The chosen
concept uses only three bold elements so its silhouette and accent remain
distinct after reduction.

## Risks and recovery

Changing extension icons affects browser chrome as well as the panel toolbar.
The existing Git history provides immediate recovery, and unchanged manifest
paths avoid migration or compatibility risk.

## Executable checklist

- [x] Add asset-family dimension and manifest-path tests.
- [x] Normalize and save the generated master.
- [x] Derive every packaged icon size from the master.
- [x] Remove the toolbar optical-offset workaround.
- [x] Update the changelog and architecture decision.
- [x] Verify transparency, centering, tests, lint, typecheck, and Chrome build.

## Direct rollout

Ship the replacement assets directly in the next extension package. No data,
permission, or public API migration is required.

## Verification

Acceptance requires exact PNG dimensions, non-opaque alpha channels, centered
visible bounds, unchanged manifest references, recognizable 16px rendering,
and successful full project verification.
