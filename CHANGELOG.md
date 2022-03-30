# Change Log

All notable changes to this project will be documented in this file.

> The dates refer to when it was made available in the Chrome platform.

## [1.5] - 2021-10-00

## Added

- Google Analytics for improving the extension.
- The browser action of the extension opens Meteor Cloud.
- Add subscription duration, so we know how long specific subscriptions take.

## Changed

- Upgrade dependencies to latest.
- Add copy JSON button to minimongo drawer.
- Improved minimongo tracking performance and responsiveness.
- By default JSON documents are expanded up to 5 levels now.
- Remove Iosevka font, the default monospaced font from OS.
- Now the extension is loaded slightly earlier, so we don't miss initial Meteor activity.

## Fixed

- Fix stack trace error issue caused by a third party library affecting some users.

## [1.4] - 2020-07-21

## Changed

- Make stack trace and bookmark buttons more accessible.
- Make right menu more responsive.
- Estimated collection size is always visible for all collections.

## Fixed

- Fix `error-stack-parser` global pollution interacting badly with some websites.

## [1.3] - 2020-06-17

## Added

- Meteor `gitCommitHash` is now shown in the status bar.
- Community Slack button (with VFX!!)
- Added subscription search.
- Estimate Minimongo collection byte size.

## Changed

- Subscriptions are clickable and open the params object viewer.
- Improved naming for the extension global variables to avoid collisions.
- Removed horizontal scroll constraint, but making it more responsive is too much work for now.

## Fixed

- Fixed horizontal scroll showing when resizing.

## [1.2] - 2020-04-29

In this release I am focusing on some quality of life changes and addressing issues reported by the community. I tried to make the design simpler and more efficient as well.

### Added

- Minimongo sidebar navigation ordered alphabetically and with counts.
- Add the Iosevka font as it is more space efficient in certain scenarios.
- Subscriptions tab listing all current subscriptions in real-time-ish.

### Changed

- The DDP log is now a virtualized list with INFINITE scrolling and new logs come at the top.
- Moved extension logs from top frame to background. NO MORE ANNOYING CONSOLE LOGS!!!
- Logs now have their interaction menu as a popover in order to be more space efficient.
- More space-efficient tabs and status bars.

### Fixed

- Small fixes and improvements in Treerinator (JSON Viewer).
- Show subscription name when ready as well.
- Fixed GitHub stats not persisting as they should.

## [1.1] - 2020-04-02

I had to take a small hiatus from development after the initial release, but now I am back with a few quality of life changes and additions. Also, I am attempting to fix an issue where some installations do not initialize and thus don't log the DDP messages, which also happens to be at least a quality of life change. Hope it works, as I could not reproduce the issue, but I added a bunch of logs just in case, I promise.

### Added

- [Issue #1](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/1)
  Added ability to replay methods either from the logs or bookmarks.
- Added document count to collection navigator.
- Added Minimongo active collection clear button.
- Added GitHub buttons to make receiving feedback easier.
- Added long timestamp format on hover for logs which is useful for bookmarks.
- Added setting persistence, which means the filters will persist between sessions.
- Added about page with some basics and license information.

### Changed

- Adjusted the layout, so it is responsive to screens with less horizontal real-estate.
- Collection tags are now clickable.

### Fixed

- [Issue #2](https://github.com/leonardoventurini/meteor-devtools-evolved/issues/2)
  The extension now initializes from the content script, which means that we don't need the devtools panel open for initialization -- but we do need it for DDP logging.

## [1.0] - 2020-03-05

Initial release.

### Added

- Added DDP logging.
- Added DDP bookmarking.
- Added Minimongo browsing.
- Added search and pagination.
- Added a bunch of stuff really.
