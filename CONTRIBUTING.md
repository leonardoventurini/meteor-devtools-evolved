## Setting the Environment Up

1. Install Node.js `26.5.1`, then install dependencies for `devapp-3.4` and
   the root project with Yarn.

```shell
yarn setup
```

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

> This command will build and watch the extension and run the `devapp-3.4` in parallel mode and when they are ready it will launch the chrome/firefox private instance with extension installed

5. Hack away!

   > Open a Pull Request from your fork to our repo once it is done or need a review.

## Environment Commands

If you use Linux you can run `source .envrc` for some useful commands

> -c: for chrome, -f: firefox, (chrome is default)

- Setup extension and test project Dependencies

```shell
setup
```

## Build

- Chrome

```shell
yarn build:chrome
```

- Firefox

```shell
yarn build:firefox
```

## Verification

Run the same primary checks enforced by CI:

```shell
yarn install --immutable
yarn lint
yarn typecheck
yarn test
yarn build:chrome
yarn build:firefox
yarn audit
yarn audit:devapp
```

`yarn audit:all` additionally reports development-only advisories without
blocking CI when no patched upstream release exists.

## Guidelines & Objectives

1. The code must be linted and properly formatted, that can be easily done with the right IDE -- I use JetBrains WebStorm. Perhaps some git hooks would come in handy in the future.
2. Every feature needs to take into account the Meteor community as a whole and not the interest of a few in detriment of others.
3. Be friendly and supportive, no one is perfect, and we all have limited time, especially in these difficult times.
