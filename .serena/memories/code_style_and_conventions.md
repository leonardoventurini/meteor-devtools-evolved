# Code Style and Conventions

## ESLint Configuration

The project extends `@tstt/eslint-config` with custom overrides:

- **global-require**: Disabled (allows require() anywhere)
- **@typescript-eslint/no-var-requires**: Disabled (allows const x = require())
- **@typescript-eslint/no-inferrable-types**: Error with ignoreParameters and ignoreProperties
- **Global variables**: `Meteor` and `i18n` are defined as readonly

## Prettier Configuration

Inherits from `@tstt/eslint-config/.prettierrc.js` (exact settings not visible but standard Prettier defaults)

## EditorConfig Settings

- **Indentation**: 2 spaces (for .js, .jsx, .ts, .tsx, .groovy)
- **Line endings**: LF (Unix-style)
- **Charset**: UTF-8
- **Trailing whitespace**: Trimmed
- **Final newline**: Required
- **Visual guides**: 80 characters

## TypeScript Configuration

- **Strict mode**: Disabled (`strict: false`)
- **noImplicitAny**: Disabled
- **Target**: ES6
- **Module**: CommonJS
- **Module resolution**: Node
- **Decorators**: Experimental decorators enabled
- **JSX**: React
- **Source maps**: Enabled
- **ESModuleInterop**: Enabled
- **Path mapping**: `@/*` → `src/*`

## Naming Conventions

Based on code inspection:

- **Components**: PascalCase (e.g., `Panel`, `Options`, `Popup`)
- **Files**: Match component names for React components
- **Constants**: Likely UPPER_SNAKE_CASE (based on Constants.ts)
- **Utilities**: camelCase functions

## Code Organization Patterns

- **React**: Functional components with hooks (React 17)
- **State Management**: MobX stores for global state
- **Styling**: Mix of styled-components, SCSS modules, and Tailwind utilities
- **Type Definitions**: Global types in `src/index.d.ts`
- **Imports**: Use path alias `@/` for src directory imports

## Component Structure

Based on `App.tsx`:

- Import external libraries first (React, Blueprint, etc.)
- Then internal components/pages
- Finally styles (CSS/SCSS)
- Component logic and rendering

## Best Practices (from CONTRIBUTING.md)

1. Code must be linted and properly formatted
2. Features should benefit the Meteor community as a whole
3. Be friendly and supportive in contributions
4. Use appropriate IDE (WebStorm recommended by maintainer)
