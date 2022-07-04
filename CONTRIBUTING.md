## Setting the Environment Up

1. Install dependencies for `devapp` & `root` with `yarn`.

```shell
yarn setup
```

   > As of now we use Node.js `v14.19.3`.

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

   > This command will build and watch the extension and run the `devpp` in parallel mode and when they are ready it will launch the chrome/firefox private instance with extension installed

5. Hack away!

   > Open a Pull Request from your fork to our repo once it is done or need a review.

## Environment Commands

If you use Linux you can run `source .envrc` for some useful commands

> -c: for chrome, -f: firefox, (chrome is default)

* Setup extension and test project Dependencies

```shell
setup
```


## Build
* Chrome
```shell
npm run build:chrome
```
* Firefox
```shell
npm run build:firefox
```


## Guidelines & Objectives

1. The code must be linted and properly formatted, that can be easily done with the right IDE -- I use JetBrains WebStorm. Perhaps some git hooks would come in handy in the future.
2. Every feature needs to take into account the Meteor community as a whole and not the interest of a few in detriment of others.
3. Be friendly and supportive, no one is perfect, and we all have limited time, especially in these difficult times.
