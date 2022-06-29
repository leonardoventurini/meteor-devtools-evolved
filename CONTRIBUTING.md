## Setting the Environment Up

1. Install dependencies for `devapp/` with `yarn`.

   > As of now we use Node.js `v12.16.1`.

2. Also install dependencies for the root project with `npm install`.

   > Duh!

3. Run `yarn start`.

   > This command will generate an unpacked extension inside the `chrome/` directory, which should be loaded inside `Google Chrome` in `Developer Mode`. It will also spawn a development server which you can access from `localhost:3000`.

4. Hack away!

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
