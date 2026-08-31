# Repository guidance for coding agents

## Changelog maintenance

Keep `CHANGELOG.md` current as part of the same change that affects the project.

- Add entries beneath `## [Unreleased]`; do not invent a release version or
  date unless the user explicitly provides one.
- Record user-visible features and behavior under `Added`, `Changed`, `Fixed`,
  `Removed`, or another Keep a Changelog-style subsection as appropriate.
- Record major dependency, runtime, build-system, CI, compatibility, and
  security changes even when they do not directly alter the interface.
- Omit purely internal refactors, formatting, tests, or documentation edits
  unless they materially affect contributors, releases, or supported behavior.
- Describe outcomes in concise past tense. Avoid commit hashes, implementation
  minutiae, and claims that have not been verified.
- Update an existing Unreleased bullet when it describes the same change rather
  than adding a duplicate entry.
- When cutting a release, move the relevant Unreleased entries under the
  user-supplied version and release date, then leave an empty Unreleased section
  for future work.

Before committing, confirm the changelog agrees with the manifest versions,
documentation, compatibility policy, and verification actually performed.
