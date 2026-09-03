## Setting the Environment Up

1. Install Node.js `26.5.1`, then install dependencies for the root project and
   both maintained Meteor fixtures with Yarn. Install
   [Just](https://just.systems/) 1.57 or newer to use the repository helper
   recipes.

```shell
yarn setup
yarn test:e2e:install
```

The second command installs the Chromium revision pinned to Playwright. The
browser binary is cached outside the repository and is not part of Yarn's
dependency graph.

The repository pins Yarn through the `packageManager` field. Because Node 26
does not bundle Corepack, install and enable it first when your Node
distribution does not provide it:

```shell
npm install --global corepack@0.36.0
corepack enable
```

2. Run the extension locally

```shell
yarn dev # default chrome
```

```shell
yarn dev:chrome # for chrome
```

```shell
yarn dev:firefox # for firefox
```

> This command builds and watches the extension, runs `devapp-3.5` in
> parallel, and launches a private Chrome or Firefox instance with the
> extension installed when both are ready.

5. Hack away!

   > Open a Pull Request from your fork to our repo once it is done or need a review.

## Helper Recipes

Run `just` to list the cross-platform repository helpers:

```shell
just
```

- Setup extension and test project Dependencies

```shell
just setup
```

- Start development mode (Chrome by default)

```shell
just develop
just develop firefox
```

- Build release archives for both browsers

```shell
just build
```

## Build

- Chrome

```shell
yarn build:chrome
yarn validate:chrome
```

- Firefox

```shell
yarn build:firefox
yarn validate:firefox
```

## Verification

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

`yarn audit:all` additionally reports development-only advisories without
blocking CI when no patched upstream release exists.

The Playwright suite starts the real Meteor 3.5.1 and 2.16 fixtures and loads
the production Chrome extension against each generation. It covers
service-worker startup, page injection, rich deterministic data, DDP method and
publication lifecycles, connection isolation, subscriptions, mutations,
Minimongo snapshots, Performance events, and packaged panel rendering. Run it
after the Chrome build validator. Use `yarn test:e2e` for Meteor 3 only or
`yarn test:e2e:meteor2` for Meteor 2 only.

Each fixture renders a **Fixture controls** catalog for repeatable manual
validation. Wait until its status is ready, then trigger one bounded scenario
at a time while inspecting the corresponding DevTools panel. Use **Reset
fixture** after mutation-oriented inspection. Playwright calls the equivalent
fixture-only `globalThis.__meteorDevtoolsFixture` hook so automation and manual
testing exercise the same scenario implementations.

Playwright cannot address a custom Chrome DevTools panel through a supported
page target. Complete that browser-owned boundary manually before release:

1. Run `yarn dev:chrome` and open `http://127.0.0.1:2100`.
2. Open DevTools and select the **Meteor** panel.
3. Confirm the default and additional connections are available.
4. Confirm DDP traffic, the 750-record primary corpus, unnamed and client-only
   collections, and the `links` subscription contain live fixture data.
5. Trigger method, publication, mutation, burst, and local Performance controls
   and confirm each corresponding panel updates.

Repeat the browser-owned boundary on Meteor 2 by running `yarn devapp:2` and
`yarn wxt -b chrome` in separate terminals, opening
`http://127.0.0.1:2200`, and repeating the catalog checks with the Meteor 2
callback/synchronous implementation.

## Guidelines & Objectives

1. The code must be linted and properly formatted, that can be easily done with the right IDE -- I use JetBrains WebStorm. Perhaps some git hooks would come in handy in the future.
2. Every feature needs to take into account the Meteor community as a whole and not the interest of a few in detriment of others.
3. Be friendly and supportive, no one is perfect, and we all have limited time, especially in these difficult times.
