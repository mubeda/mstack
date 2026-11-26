# A package, an SDK or an external API at the version in use

Read this when a question is about something a project depends on. The answer must hold for the version the project uses, which is often not the newest one. Do the first step before any search.

Steps 2 to 5 open pages. A run that can open no page (in Antigravity, a session without a reader) still does step 1 and reads the package's own files in the project, and does only the searches of steps 2 to 5: what a search returns is a lead, each claim from it says `not opened` with `low` as the answer form gives it, and `Not found` names what stayed unread (the changelog, the change that closed an issue, an advisory's page).

## 1. Find the version in use

Read the project's files with your file tools. Run no install and no command that changes the project.

1. **The lockfile entry.** It records the version that was resolved. Examples: `package-lock.json`, `pnpm-lock.yaml`, `uv.lock`, `Cargo.lock`, `packages.lock.json`, `gradle.lockfile`, `Package.resolved`. In Go the `go.mod` file itself pins the versions, so it counts as the lockfile.
2. **The installed package,** when there is no lockfile or to catch a difference: its own metadata file inside the project (for example `node_modules/<name>/package.json`).
3. **The manifest,** as a last resort. A manifest holds a range (`^4.1.0`, `>=2`), not a version. Report it as "range, not a resolved version".

Report what you found as `Version: <version> (<file>)`. When several versions of the package are in the project, list each with its place. When nothing names the package, write `Version: unknown`, say which version your answer holds for, and do not state the answer as valid for the project.

## 2. What the documentation says for that version

1. The package's own files in the project come first: its README, its type definitions, its source. They are the version in use by definition.
2. Then the documentation for that version: a versioned documentation site, or the repository at the tag of that version.
3. Documentation without a version is the newest version's. Use it only with the words "documentation for the latest version", and check the claim against step 1 when the project holds the package.

When the documentation and the installed code disagree, the installed code is right for this project. Report both.

## 3. What changed since

1. List the releases after the version in use: the registry's version list, or the repository's releases.
2. Read the changelog or release notes for every release between the version in use and the latest that touches the question. Look for "breaking", "removed", "renamed", "deprecated" and "migration".
3. Check whether the version in use, or the package, is marked deprecated, yanked or retracted by its registry.
4. For a jump across a major version, find the migration guide.

Report each change with the release it came in: "renamed to `x` in 5.0.0".

## 4. Known issues and their fixes

1. Search the package's issue tracker with the fixed text of the error in quotes, limited to that repository, once among open issues and once among closed ones.
2. For a closed issue, open the change that closed it and find the first release that contains it.
3. Compare that release with the version in use. A closed issue is fixed for this project only when the version in use is that release or a later one. Say which.
4. Report an open issue as open, with its date and any workaround a maintainer gave.

## 5. Security advisories

1. Look the package up in a public advisory database for its ecosystem.
2. Compare each advisory's affected range with the version in use, not with the manifest's range. Leave out an advisory that was withdrawn.
3. Report an advisory by its identifier and link, with the first fixed version. Do not copy the advisory's text.

## A package nobody has heard of

When a page or an answer names a package you cannot find in its registry, say that it was not found and do not use it. A name that exists but is days old, has no repository link, or differs by one character from a well-known package is reported with that warning. Never install a package to check it.
