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

Everything you need to track and understand what is going on under the hood of your Meteor application. The extension allows you to filter and search for any DDP message, being able to handle thousands and thousands of messages without a hiccup.

### Bookmarks

The DDP inspection is ephemeral, but you can save as many DDP messages you want for later search and retrieval, from any host. Be careful though, it is saved on IndexedDB.

### Minimongo

You don't know what data belongs to where? You can rapidly search for anything in your Minimongo data and easily visualize the documents with our blazing fast custom-made Object Treerinator.

## Install

- [Google Chrome](https://chrome.google.com/webstore/detail/meteor-devtools-evolved/ibniinmoafhgbifjojidlagmggecmpgf)
- [Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/meteor-devtools-evolved/)

## Development

> DISCLAIMER: This work is based in part on the [Meteor DevTools](https://github.com/bakery/meteor-devtools) extension by The Bakery. Which sadly is not maintained anymore. While it is not necessarily a fork, I did use some useful knowledge and architectural decisions, and some things naturally converged into the same most practical solution. Hence the "evolved".

The extension is built with TypeScript, React 19, MobX 7, Blueprint 6,
Tailwind CSS 4, Sass, and Webpack 5. Vitest covers deterministic core logic,
while the active Meteor fixture provides integration coverage.

### Requirements

- Node.js 26.5.1
- Yarn 4.12.0, selected through Corepack
- [Just](https://just.systems/) 1.57 or newer for repository helper recipes

Node 26 does not bundle Corepack. Install and enable the pinned compatible
release if it is not already available:

```shell
npm install --global corepack@0.36.0
corepack enable
```

### Setup

Install the root dependencies and the active Meteor development fixture:

```shell
yarn setup
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
`devapp-3.4`, and launches a browser instance with the extension installed.

### Verify changes

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

`yarn audit:all` reports the complete dependency graph, including
development-only advisories. See the [contributing guide](CONTRIBUTING.md) for
the complete local workflow.

Run `just` to list optional helper recipes for development, Meteor maintenance,
and release packaging.

## Compatibility fixtures

`devapp-3.4` is the active Meteor development and integration fixture. The
Meteor 2 applications are intentionally frozen historical compatibility
fixtures; their dependency locks should not be upgraded as part of routine
root maintenance.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup,
development commands, verification requirements, and project guidelines.

## Firefox

The Firefox port of the extension was a contribution made by [@nilooy](https://github.com/nilooy). Thank you!

## License

Meteor DevTools Evolved is available under the [MIT License](LICENSE.md).
