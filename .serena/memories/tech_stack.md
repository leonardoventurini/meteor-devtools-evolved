# Tech Stack

## Core Technologies
- **TypeScript** 4.4.3 - Main programming language with ES6 target
- **React** 17.0.2 - UI framework (functional components with hooks)
- **MobX** 6.4.0 - State management library
- **Webpack** 5 - Module bundler and build tool

## UI & Styling
- **Blueprint** 4.14.1 - Core UI components library by Palantir
- **Styled Components** 5.3.3 - CSS-in-JS styling
- **SASS/SCSS** - Additional styling with sass-loader
- **Tailwind CSS** 3.0.24 - Utility-first CSS framework
- **DaisyUI** 2.15.2 - Tailwind CSS component library
- **Normalize.css** - CSS reset
- **Heroicons React** - Icon library

## Data & State
- **Dexie** 3.2.2 - IndexedDB wrapper for bookmarks storage
- **mobx-react-lite** 3.3.0 - React bindings for MobX

## Utilities
- **Luxon** 2.5.2 - Date/time manipulation
- **Lodash** (selective imports: debounce, memoize, sortby, throttle)
- **D3** (collection, hierarchy, selection, shape) - Data visualization
- **pretty-bytes** - Byte formatting
- **uuid** - Unique ID generation

## Build Tools & Dev Environment
- **Babel** 7 - JavaScript transpiler
- **ts-loader** - TypeScript loader for Webpack
- **PostCSS** - CSS processing
- **Terser** - JavaScript minification
- **web-ext** - Browser extension development tool
- **concurrently** / **npm-run-all** - Run multiple commands
- **wait-on** - Wait for resources before starting

## Code Quality
- **ESLint** - JavaScript/TypeScript linter (extends @tstt/eslint-config)
- **Prettier** - Code formatter (from @tstt/eslint-config)
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files

## Runtime Environment
- **Node.js** 14.19.3 (managed by Volta)
- **Yarn** 1.22.18 (managed by Volta)

## Browser APIs
- **@types/chrome** - Chrome extension API types
- **webextension-polyfill** - Cross-browser extension API
