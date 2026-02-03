# Suggested Commands

## Initial Setup
```bash
# Install dependencies for both root and devapp
yarn setup
```

## Development
```bash
# Start development mode for Chrome (default)
yarn dev

# Start development mode specifically for Chrome
yarn dev:chrome

# Start development mode for Firefox
yarn dev:firefox

# Run just the devapp (Meteor test application)
yarn devapp
```

**Note**: The `yarn dev` commands will:
1. Build and watch the extension
2. Run the devapp in parallel
3. Launch a browser instance with the extension installed
4. Auto-reload on code changes

## Building
```bash
# Build Chrome extension for production
yarn build:chrome

# Build Firefox extension for production
yarn build:firefox

# Clean build artifacts
yarn clean
```

## Linting & Formatting
```bash
# Run ESLint on all source files
yarn lint

# Prettier and ESLint run automatically via pre-commit hooks
# Manual formatting is handled by lint-staged
```

## Git Operations
```bash
# Standard git commands work normally
git status
git add <files>
git commit -m "message"  # Pre-commit hook runs lint-staged automatically
git push
```

## Useful System Commands (macOS/Darwin)
```bash
# List files
ls -la

# Search for files
find . -name "*.tsx"

# Search in files
grep -r "pattern" src/

# View file contents
cat <file>
head -n 20 <file>
tail -n 20 <file>

# Navigate directories
cd <directory>
pwd
```

## Testing Extension Manually
After running `yarn dev:chrome` or `yarn dev:firefox`, the extension will be loaded in a browser instance. Navigate to `http://localhost:2100` to see the devapp and test the extension's DevTools panel.

## Node/Yarn Version Management
The project uses Volta to manage Node and Yarn versions:
- Node.js: 14.19.3
- Yarn: 1.22.18

Volta will automatically use the correct versions if installed.

## Troubleshooting
```bash
# If dependencies are out of sync, reinstall
rm -rf node_modules yarn.lock
yarn install

# If devapp has issues
cd devapp
rm -rf node_modules yarn.lock
yarn install
cd ..

# Reset Meteor (if devapp is broken)
cd devapp
meteor reset
cd ..
```
