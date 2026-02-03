# Architecture and Design Patterns

## Browser Extension Architecture

### Multi-Context Design

The extension operates in multiple browser contexts:

1. **DevTools Panel** (`src/Pages/Panel`) - Main UI for DDP tracking and Minimongo inspection
2. **Options Page** (`src/Pages/Options`) - Extension settings and configuration
3. **Browser Action Popup** (`src/Pages/Popup`) - Quick access popup from toolbar
4. **Background Scripts** - Browser extension background processes (in `src/Browser/`)
5. **Content Scripts** - Injected into Meteor app pages (in `src/Injectors/`)

### Communication Bridge

- `src/Bridge.ts` handles inter-context communication
- Uses browser extension messaging APIs
- Coordinates between DevTools panel, content scripts, and page context

## State Management with MobX

### Store Pattern

- MobX 6 with `mobx-react-lite` for React integration
- Stores located in `src/Stores/`
- Likely uses observable state with computed values and actions
- React components observe stores using hooks

### State Persistence

- **Dexie (IndexedDB)** for persistent storage (bookmarks)
- Located in `src/Database/`
- Allows saving DDP messages across sessions and browser restarts

## Component Architecture

### UI Framework Hierarchy

1. **Blueprint** - Primary component library (buttons, dialogs, forms, etc.)
2. **Custom Components** - Project-specific components in `src/Components/`
3. **Styled Components** - CSS-in-JS for component-specific styling
4. **SCSS** - Global styles and theming
5. **Tailwind CSS + DaisyUI** - Utility classes for rapid styling

### Component Patterns

- Functional components with React Hooks (React 17)
- MobX observer components using `observer()` HOC or hooks
- Likely uses `react-singleton-hook` for global singletons
- `react-window` for virtualized lists (performance for large DDP message lists)

## Data Visualization

### D3.js Integration

Used for visualizing Meteor/DDP data structures:

- **d3-hierarchy** - Tree structures for Minimongo documents
- **d3-shape** - Shapes for data visualization
- **d3-selection** - DOM manipulation for charts
- **d3-collection** - Data structure utilities

Custom "Object Treerinator" for document visualization (mentioned in README)

## Performance Optimizations

### Virtualization

- `react-window` + `react-window-infinite-loader` for handling thousands of DDP messages
- Virtual scrolling prevents DOM bloat with large datasets

### Memoization & Throttling

- `lodash.memoize` - Cache expensive computations
- `lodash.debounce` - Debounce user input
- `lodash.throttle` - Throttle high-frequency events (DDP message processing)

## Build System

### Webpack Configuration

- **Base config** - Shared settings
- **Dev builds** - Watch mode, source maps, faster builds
- **Prod builds** - Minification, optimization
- **Target-specific** - Different configs for Chrome vs Firefox
  - Chrome uses Manifest V3
  - Firefox may use Manifest V2 or adapted V3

### Asset Handling

- `file-loader` - Images and static assets
- `css-loader` + `style-loader` - CSS module handling
- `sass-loader` - SCSS compilation
- `postcss-loader` - PostCSS transformations (Tailwind)
- `ts-loader` - TypeScript compilation
- `babel-loader` - JavaScript transpilation

### Code Splitting

Likely splits code by extension context (panel, popup, options, background)

## Extension-Specific Patterns

### Webextension Polyfill

- `webextension-polyfill` provides cross-browser compatibility
- Converts callback-based APIs to Promises
- Allows same code to work on Chrome and Firefox

### Injectors Pattern

- Content scripts in `src/Injectors/` inject code into Meteor app pages
- Intercepts DDP messages by hooking into Meteor's DDP client
- Sends captured data to DevTools panel via messaging bridge

### Analytics

- `src/Analytics.ts` likely tracks usage (opt-in)
- Helps understand feature usage and bugs

## Development Workflow

### Hot Module Replacement

- Webpack dev builds watch for changes
- Browser extension reloads on rebuild
- Devapp runs concurrently on port 3000

### Concurrent Development

- `npm-run-all` / `concurrently` - Run multiple processes
- `wait-on` - Synchronize startup (wait for builds and devapp)
- `web-ext run` - Launches browser with extension loaded

## Styling Strategy

### Layered Approach

1. **Normalize.css** - Base reset
2. **Tailwind base** - Utility-first foundation
3. **DaisyUI** - Component classes on top of Tailwind
4. **Blueprint** - Pre-built React components
5. **SCSS modules** - Component-specific styles
6. **Styled Components** - Dynamic, prop-based styling
7. **Polished** - Color manipulation and mixins for styled-components

This multi-layered approach provides flexibility while maintaining consistency.
