# Change Log

All notable changes to this project will be documented in this file.

> The dates refer to when it was made available in the Chrome platform.

## [1.2] - COMING SOON

In this release I am focusing on some quality of life changes and addressing issues reported by the community.

### Added

- Minimongo sidebar navigation with document counts.

### Changed

- The DDP log is now a virtualized list with INFINITE scrolling and new logs come at the top.
- Moved extension logs from top frame to background. NO MORE ANNOYING CONSOLE LOGS!!!

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
