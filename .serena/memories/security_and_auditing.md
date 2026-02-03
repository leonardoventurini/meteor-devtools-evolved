# Security and Auditing

## Audit Script

The project includes a security audit script that checks for high and critical severity vulnerabilities:

```bash
yarn run audit
```

This runs: `yarn npm audit --all --recursive --severity high`

## Security Resolutions

Due to transitive dependencies, the project uses Yarn resolutions to enforce secure versions of nested dependencies. These are defined in `package.json` under the `"resolutions"` field.

### Current Security Resolutions

The following packages are pinned to secure versions to address known vulnerabilities:

- **@babel/traverse**: ^7.23.2 - Fixes arbitrary code execution vulnerability
- **axios**: ^1.6.0 - Fixes SSRF and credential leakage vulnerability
- **braces**: ^3.0.3 - Fixes uncontrolled resource consumption
- **cross-spawn**: ^7.0.5 - Fixes Regular Expression Denial of Service (ReDoS)
- **fast-json-patch**: ^3.1.1 - Fixes prototype pollution
- **form-data**: ^4.0.0 - Fixes unsafe random function in boundary generation
- **http-cache-semantics**: ^4.1.1 - Fixes ReDoS vulnerability
- **json5**: ^2.2.3 - Fixes prototype pollution via parse method
- **jsonwebtoken**: ^9.0.0 - Fixes unrestricted key type vulnerability
- **jws**: ^4.0.0 - Fixes improper HMAC signature verification
- **loader-utils**: ^3.2.1 - Fixes prototype pollution and ReDoS vulnerabilities
- **node-forge**: ^1.3.2 - Fixes ASN.1 unbounded recursion
- **qs**: ^6.14.1 - Fixes DoS via memory exhaustion
- **semver**: ^7.5.4 - Fixes ReDoS vulnerabilities across multiple version ranges
- **sha.js**: ^2.4.12 - Fixes missing type checks
- **ws**: ^8.17.1 - Fixes DoS when handling requests with many HTTP headers

## Security Update Process

When security vulnerabilities are discovered:

1. Run `yarn run audit` to identify issues
2. Update direct dependencies where possible
3. Add/update resolutions for transitive dependencies
4. Run `yarn install` to apply changes
5. Run `yarn run audit` again to verify fixes
6. Test the application to ensure nothing broke
7. Commit the changes with a clear security-focused message

## Regular Security Maintenance

- Run `yarn run audit` regularly (monthly recommended)
- Keep direct dependencies up to date
- Monitor GitHub security advisories
- Review and update resolutions when new vulnerabilities are disclosed

## Important Notes

- The project uses **Yarn 4.12.0**, not npm, so use `yarn` commands
- Resolutions in package.json override nested dependency versions
- Some older dependencies (like file-loader) may have vulnerabilities that require resolutions because they're no longer maintained
- Always test builds after security updates: `yarn build:chrome` and `yarn build:firefox`
