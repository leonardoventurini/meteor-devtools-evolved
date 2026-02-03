# Task Completion Checklist

When completing a coding task in this project, follow these steps:

## 1. Pre-Commit Automatic Checks
The project uses Husky + lint-staged for pre-commit hooks. When you commit, the following runs automatically:
- ✓ ESLint on all staged .js, .jsx, .ts, .tsx files
- ✓ TypeScript type checking (tsc --noEmit)
- ✓ Prettier formatting on staged files
- ✓ React Scripts tests (if applicable, with --passWithNoTests)

**If the pre-commit hook fails**, fix the issues before committing:
```bash
# Run lint manually to see all issues
yarn lint

# TypeScript errors need to be fixed in code
# ESLint and Prettier issues are often auto-fixed by lint-staged
```

## 2. Manual Verification
After making changes, verify:

### Linting
```bash
yarn lint
```
Ensure no ESLint errors or warnings.

### Security Audit
```bash
yarn run audit
```
Ensure no high or critical security vulnerabilities are introduced.

### Building
```bash
# Test Chrome build
yarn build:chrome

# Test Firefox build  
yarn build:firefox
```
Ensure both builds complete successfully without errors.

### Manual Testing
```bash
# Start dev environment
yarn dev:chrome  # or yarn dev:firefox
```
- Open the browser instance that launches
- Navigate to http://localhost:2100 (devapp)
- Open DevTools and find the "Meteor" panel
- Test your changes manually in the extension UI

## 3. Code Quality Checks
Before considering the task done:

- [ ] TypeScript compiles without errors
- [ ] ESLint shows no errors or warnings
- [ ] Code follows project conventions (2-space indent, LF line endings, etc.)
- [ ] No unused imports or variables
- [ ] MobX stores updated if state changes
- [ ] Components are properly typed
- [ ] Path imports use `@/` alias where appropriate

## 4. Cross-Browser Compatibility
If the change affects browser-specific code:
- [ ] Test in Chrome build (`yarn dev:chrome`)
- [ ] Test in Firefox build (`yarn dev:firefox`)
- [ ] Check for webextension-polyfill usage for cross-browser APIs

## 5. Git Commit
```bash
git add <changed-files>
git commit -m "descriptive message"
# Pre-commit hooks run automatically
```

## 6. Common Issues

### Pre-commit hook fails
- Check `yarn lint` output
- Run prettier manually if needed
- Fix TypeScript errors shown by tsc

### Build fails
- Check webpack output for specific errors
- Verify all imports exist and are correct
- Check for TypeScript compilation errors

### Extension doesn't load
- Check browser console for errors
- Verify manifest.json was generated correctly
- Check extension/chrome or extension/firefox directories exist

## Notes
- The devapp must be running for the extension to work properly
- IndexedDB data persists between sessions (for bookmarks)
- Check Chrome DevTools console in the extension context for runtime errors
