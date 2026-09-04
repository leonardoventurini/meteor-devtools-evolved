<div align="center">

<img src="https://media.giphy.com/media/Pt2yOXUALOhpB5dpiM/giphy.gif" alt="Meteor Devtool Evolved Gif" />

<h1>Meteor DevTools Evolved</h1>

<p>Behold, the evolution of Meteor DevTools.</p>

Meteor Devtools Evolved is currently available for Google Chrome and Mozilla Firefox.

</div>

<p align="center">
    <a href="https://github.com/leonardoventurini/meteor-devtools-evolved/actions/workflows/ci.yml">
        <img src="https://github.com/leonardoventurini/meteor-devtools-evolved/actions/workflows/ci.yml/badge.svg?branch=development" alt="CI status" />
    </a>
    <a href="LICENSE.md">
        <img src="https://img.shields.io/github/license/leonardoventurini/meteor-devtools-evolved" alt="MIT license" />
    </a>
</p>

<p align="center" >
    <a href="https://chrome.google.com/webstore/detail/meteor-devtools-evolved/ibniinmoafhgbifjojidlagmggecmpgf">
    <img width="120" src="https://img.shields.io/badge/%20-Chrome-orange?logo=google-chrome&logoColor=white" alt="Download for Chrome" />
    </a>
    <a href="https://addons.mozilla.org/en-US/firefox/addon/meteor-devtools-evolved/">
    <img width="110" src="https://img.shields.io/badge/%20-Firefox-red?logo=mozilla&logoColor=white" alt="Download for Firefox" />
    </a>
</p>

[Harder, Better, Faster, Stronger](https://www.youtube.com/watch?v=gAjR4_CbPpQ) :rocket:

Are you beginning with Meteor? Do you want to get a sense of "what is going on" or even to optimize your Meteor app? This is the tool for you.

:point_right: [Changelog](CHANGELOG.md) · [Contributing guide](CONTRIBUTING.md)

## Features

### Distributed Data Protocol (DDP)

Inspect, filter, search, and bookmark inbound and outbound DDP messages. Capture
is bounded to the newest 5,000 events, and actionable outbound calls include
stack traces. Applications that use additional `DDP.connect` connections get a
global connection selector; logs, byte totals, subscriptions, and Minimongo
snapshots remain isolated by server.

The bottom-anchored **Settings** tab controls whether a newly opened DevTools
panel shows messages captured before it opened or starts from current traffic.
**Show captured history** remains the default. **Start from now** discards
cached rows and byte totals for the inspected tab without affecting bookmarks
or page data; the panel prompts for an explicit reload before applying a changed
startup policy to the active session.

### Bookmarks

The DDP inspection is ephemeral, but you can save as many DDP messages you want for later search and retrieval, from any host. Be careful though, it is saved on IndexedDB.

### Minimongo

Browse named and unnamed local collections, copy document IDs directly from
result rows, and inspect nested documents with persisted expansion depth,
expand/collapse-all controls, and highlighted key/value filtering.

The structured query interface runs only against the captured snapshot. It
supports dotted selectors, an explicit operator allowlist, sort, projection,
and a 500-document result ceiling without evaluating arbitrary JavaScript.

### Subscriptions and performance

Inspect subscription parameters, readiness, activity, and duration in a
responsive table. The Performance panel records explicit Meteor 2 synchronous
collection calls and Meteor 3 asynchronous settlement timing while preserving
application return values and errors.

### Privacy

The extension does not collect or send analytics. Bookmarks remain in your
browser's local IndexedDB storage. The DDP startup-history preference uses the
extension's local settings storage and is not transmitted. Network access is
limited to the GitHub API for repository metadata and links you explicitly open
from the extension.

## Install

- [Google Chrome](https://chrome.google.com/webstore/detail/meteor-devtools-evolved/ibniinmoafhgbifjojidlagmggecmpgf)
- [Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/meteor-devtools-evolved/)

## Development

> DISCLAIMER: This work is based in part on the [Meteor DevTools](https://github.com/bakery/meteor-devtools) extension by The Bakery. Which sadly is not maintained anymore. While it is not necessarily a fork, I did use some useful knowledge and architectural decisions, and some things naturally converged into the same most practical solution. Hence the "evolved".

The extension is built with TypeScript, React 19, MobX 7, Blueprint 6,
Tailwind CSS 4, Sass, and WXT on Vite 8. WXT generates the Chrome Manifest V3
and Firefox Manifest V2 packages from shared typed entrypoints. Vitest covers
deterministic core and build-policy logic. Playwright loads the packaged Chrome
extension in bundled Chromium and exercises it against the maintained Meteor
3.5.1 and 2.16 fixtures.

### Requirements

- Node.js 26.5.1
- Yarn 4.12.0, selected through Corepack
- The Meteor CLI used by the pinned fixture release
- [Just](https://just.systems/) 1.57 or newer for repository helper recipes

Node 26 does not bundle Corepack. Install and enable the pinned compatible
release if it is not already available:

```shell
npm install --global corepack@0.36.0
corepack enable
```

### Setup

Install the root dependencies and both maintained Meteor fixtures, then install
Playwright's pinned Chromium revision:

```shell
yarn setup
yarn test:e2e:install
```

Start the default Chrome development environment:

```shell
yarn dev
```

Firefox and explicit Chrome commands are also available:

```shell
yarn dev:firefox
yarn dev:chrome
```

The development command builds and watches the extension, starts
`devapp-3.5`, and launches a browser instance with the extension installed.

### Verify changes

Run the same primary checks enforced by CI:

```shell
yarn install --immutable
yarn lint
yarn typecheck
yarn test
yarn build:chrome
yarn validate:chrome
yarn test:e2e:all
yarn build:firefox
yarn validate:firefox
yarn audit
yarn audit:devapp
```

`yarn audit:all` reports the complete dependency graph, including
development-only advisories. See the [contributing guide](CONTRIBUTING.md) for
the complete local workflow.

`yarn test:e2e` covers the default `devapp-3.5` fixture on port 2100;
`yarn test:e2e:meteor2` covers `devapp-2.16` on port 2200; and
`yarn test:e2e:all` runs both sequentially. Each command loads the production
Chrome build in Playwright's bundled Chromium and verifies Manifest V3 startup,
page-world injection, rich deterministic Minimongo snapshots, isolated
secondary-connection data, correlated method success and failure, publication
lifecycles, mutations, bounded traffic, Performance capture, and packaged panel
rendering. Build and validate Chrome first. CI runs the fixtures on separate
matrix runners.

Chrome does not expose custom DevTools panels through a supported Playwright
page target. Before release, perform the remaining headed smoke with
`yarn dev:chrome`: open DevTools on `http://127.0.0.1:2100`, select **Meteor**,
confirm both connections appear, then verify DDP, Minimongo, and Subscriptions
show live fixture data.

For the same manual boundary on Meteor 2, start `yarn devapp:2`, run
`yarn wxt -b chrome` in another terminal, open `http://127.0.0.1:2200`, and
repeat the panel checks against the `random` collections and subscriptions.

Run `just` to list optional helper recipes for development, Meteor maintenance,
and release packaging.

Production extension artifacts are written to `.output/chrome-mv3` and
`.output/firefox-mv2`. Use `just build` to create store ZIPs in `releases/`.

## Compatibility fixtures

`devapp-3.5` is the active Meteor 3.5.1 development fixture. `devapp-2.16` is
the single maintained Meteor 2 compatibility fixture. Both are blocking Chrome
browser-integration targets. Each fixture uses its Meteor release's embedded
Node/npm toolchain, so run its npm commands through `meteor npm`.

Both fixtures expose the same versioned validation catalog. Their primary
connection publishes 20 projects, 220 tasks, and 510 events with deterministic
nested values, dates, arrays, null/missing fields, Unicode, multiline text, and
long strings. A real additional connection subscribes to 12 isolated records.
Meteor 2 exercises callback calls and synchronous collection operations;
Meteor 3 exercises Promise calls and asynchronous collection operations.

The fixture page includes bounded controls for structured and delayed methods,
controlled failures, mutation and publication lifecycles, traffic bursts,
local Performance operations, and reset. Wait for the displayed fixture status
to become ready before triggering scenarios. Automation can use the stable
fixture-only `globalThis.__meteorDevtoolsFixture` contract; this hook is not an
extension public API.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup,
development commands, verification requirements, and project guidelines.

## Firefox

The Firefox port of the extension was a contribution made by [@nilooy](https://github.com/nilooy). Thank you! Current releases require Firefox 140 or newer on desktop and Firefox 142 or newer on Android.

## License

Meteor DevTools Evolved is available under the [MIT License](LICENSE.md).
