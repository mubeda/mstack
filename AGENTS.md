# AGENTS.md for mstack

Instructions for AI agents (Codex reads this file; Claude Code reads it through `CLAUDE.md`).
This repo ships Claude Code and Codex plugins. The "code" is mostly `SKILL.md` files and their
`references/` and `scripts/`, which other agents execute as instructions. A wrong sentence here
is a bug in production.

## Public repository: no personal or company data

This repository is open source and its skills are for anyone. Never commit anything tied to one
person's machine, employer or projects: names of people, companies, customers or internal
products; private hostnames, IPs or URLs; absolute home paths (`/home/<name>`, `/Users/<name>`);
ticket keys, internal project codes, tokens or credentials. Address the reader as "the user" and
refer to a skill's own files relative to the skill folder. Before every commit, grep the added
lines for these and run a secret scanner (for example `gitleaks`) if one is installed.

The one exception is third-party attribution. When a skill adapts text from another project,
credit it in that skill's `THIRD_PARTY_NOTICES.md` (inside the skill folder, so it ships with
every install, plugin or skills CLI) with the copyright line and license text that project's license requires. Rewrite
adapted rules in your own words. Copy nothing from a source that has no license.

## Skills install two ways

Every skill installs as a plugin (Claude Code and Codex marketplaces) or with the skills CLI (`npx skills add mubeda/mstack`, which finds the skills through `skills.sh.json`). The skills CLI copies or links only `plugins/<plugin>/skills/<skill>/`, so that folder must hold everything the skill uses: its `references/`, `scripts/`, a `LICENSE` identical to the root one, and its `THIRD_PARTY_NOTICES.md`. Never point a skill at a file outside its own folder. Name any `SKILL.md` used as test data `SKILL.md.fixture`, or it installs as a second skill. `check-marketplace.mjs` checks all of this. Installs live in two skills. `mstack-setup` installs the mstack skills' dependencies at user scope after one yes, and `mstack-find-skills` installs a skill it found only after asking the user the route (plugin or skills CLI) and, for the skills CLI, the scope (global or this repository), the method (symlink or copy) and the agents, because the CLI does not prompt when an agent runs it. Every other skill names `mstack-setup` instead of installing; `mstack-skill-creator` keeps its own install questions for OpenCode and Cursor only.

## Files the three workflows share

`mstack-codex-review-workflow` (Claude leads, Claude writes), `mstack-claude-review-workflow` (Codex leads) and `mstack-claude-pm-codex-dev` (Claude leads, Codex writes) ship identical copies of `THIRD_PARTY_NOTICES.md` and every file in `references/`, because each install copies only its own skill folder. Edit all three copies in the same change. `check-marketplace.mjs` fails when they differ. Keep the shared files host-neutral: they say "the cross-vendor reviewer" and "the advisor when the host has one", and each `SKILL.md` says which tool plays each role (in `mstack-claude-pm-codex-dev` the Codex review is the same-vendor one, because Codex wrote the code). Keep the section numbers of the three `SKILL.md` files the same, because the shared files point at them.

`references/plan-format.md` and `references/receiving-review.md` are shared four ways: `mstack-plan` writes plans in that format and the three workflows read them, and all four process every review with the same rules, without asking the user. All four plugins ship identical copies, and `check-marketplace.mjs` fails when they differ. A change to the format is a change to all four plugins, including what each does with plans written by the old format (sweep rule 5 below).

`references/codegraph.md` is shared seven ways: `mstack-plan`, `mstack-write-specs`, `mstack-diagnose`, `mstack-backlog-triage` and the three workflows ship identical copies of the codegraph steps, and `check-marketplace.mjs` fails when a copy differs from `mstack-plan`'s or is missing. Each `SKILL.md` only points at it; no codegraph command is written into a `SKILL.md`.

## Shared skills

Skill search, installs and model choice each live in one skill: `mstack-find-skills`, `mstack-setup` and `mstack-best-model-for`. In Claude Code and Codex no other skill restates their rules, tables or commands: it calls them and reads their result block (`mstack-skill-creator` keeps built-in steps for OpenCode and Cursor only). A caller whose required shared skill is missing stops with the install commands and the name `mstack-setup`. A change to a shared skill's input or result block is a change to every caller (sweep rule 1). Model names appear only in `mstack-best-model-for`'s table, in reviewer questions and in reviewer defaults. `mstack-claude-pm-codex-dev` takes its developer-model options from `mstack-best-model-for` at run time, so no developer model name is written into it.

`mstack-brainstorm` comes before `mstack-write-specs` in the chain: it turns an unformed idea into an approved design brief (first line `# Design brief: <title>`, then a `Status:` line), and `mstack-write-specs` treats the user's decisions in an Approved brief as settled. A change to the brief's opening lines or part headings is a change to both skills.

## Git and pull requests

- `main` is the default branch. Work on a branch, push it, and open a pull request. Merge `main`
  into the branch when it moves.
- Before switching branches or editing, check which branch is checked out (`git status -sb`).
- Commit, push or open a pull request only when the user explicitly asks for that step.
  Approving something else (a draft, a plan, a list of fixes) is not consent.

## Before every commit

1. **Run the checks.**
   ```bash
   git fetch origin main
   node scripts/check-version-bumps.mjs
   node scripts/check-marketplace.mjs
   ```
2. **Bump the version of every plugin you changed.** Claude Code and Codex only pick up a plugin
   change when its version changes. Change it everywhere it appears: `.claude-plugin/marketplace.json`,
   the plugin's `.claude-plugin/plugin.json` and its `.codex-plugin/plugin.json` (Claude-only
   plugins have none). A plugin already bumped on this branch
   (not yet on `main`) needs no second bump for later fixes in the same pull request. After
   merging `main`, a plugin bumped on both sides needs a version above both parents.
   Also raise the marketplace's own `metadata.version` in `.claude-plugin/marketplace.json`, the minor
   number when a plugin is added or removed and the patch number otherwise.
   `check-version-bumps.mjs` fails when a changed plugin's version, or the marketplace version, is not higher than `main`'s;
   `check-marketplace.mjs` fails when the copies of a version disagree.
3. **Run the outside-the-diff sweep** (below).
4. **Get a second-opinion review before any commit the user asks for**, from a reviewer in another
   session or from another vendor (for example a read-only Codex review from Claude Code). Let the
   user choose which findings to fix. The sweep below stays your job: a reviewer gets sweep
   instructions only where it accepts them. For example, `codex exec review --uncommitted`
   rejects a custom prompt and only reads the repository's instructions.

## The outside-the-diff sweep

A diff shows the lines you changed, never the lines your change made false: another skill that
reads the field you moved, a reference file that still describes the old behavior, an example
that teaches the old shape. Every review that reads only the diff misses them. Run these six
checks before committing:

1. **Sweep every reference to a thing whose meaning changed**, such as a tool or parameter, a
   heading a skill searches for, a reference-file name, a step number or a label. Search for it by name
   (`rg -n <name>`) across all of `plugins/` (each `SKILL.md` *and* its `references/` and
   `scripts/`), `README.md` and `AGENTS.md`, and re-read every hit against the new
   meaning. Skills share contracts, because a value one skill writes, others read. **When you widen or
   narrow a list** (the texts a check scans, the fields a step reads, the skills a preflight
   requires), also search for each *old* member by name. Sub-rules often restate one member
   instead of pointing at the list, and updating the list's definition leaves them behind.
2. **Every instruction must work against the real tool.** Check each tool call's parameters
   against the tool's actual schema, and each install command against the real source. Check
   every variant the skill handles, not the first one. Never write a tool, parameter, command,
   file or step into a skill that you have not seen this session. Reviewers usually cannot call
   the live tool, so put the evidence in the pull request description (the call, its result,
   the date), or they will report the claim as unverified. **A name can resolve to more than one
   tool.** For example, Claude Code's built-in `code-review` skill reviews a path, but the
   official `code-review` plugin command only reviews a pull request and comments on it. Name the
   one the skill means, and say what to do when only the other one is available.
3. **Re-read every sentence you touched, whole, and the examples next to it.** Rewording carries
   the old claims forward, and agents copy examples as faithfully as they follow rules.
4. **Review the branch, not the last commit.** Read both `git diff origin/main...HEAD` and
   `git diff HEAD` (staged and unstaged), so a line made false by an earlier commit is still in
   view. When a second-opinion reviewer accepts instructions, tell it explicitly to check
   unchanged text in other plugins and reference files that names a changed field, tool or
   heading. When it does not, that check is yours alone.
5. **Handle what the previous version saved.** A resume will meet values written by the old
   version whenever you change what a saved value means: a choice recorded in a planning file, a
   checkpoint status, a file name a resume looks for. State what the skill does with each old
   value. Never treat an old value as consent to new, wider behavior: ask once instead.
6. **When a step starts writing a file, find everything that tracks that file.** That includes
   hashes, identities and checkpoints recorded for it, any "preserve" or "never rewrite" rule,
   and any staleness check that compares against it. Search for the file name and update every
   hit.

Report the sweep in the hand-over, e.g. "swept `check-required-skills`: 3 files checked, 2 updated".

## Fixing review findings

A finding names one place; the same mistake usually sits in its siblings too.

- **Fix the kind of mistake, not only the line.** Name the mistake in general terms first. Then
  search for every other place with the same shape: sibling bullets in the same rule, other steps
  that do the same thing, the reference files that describe it, and other plugins. Fix them in
  the same change, and report it like the sweep.
- **When you add or tighten a rule in this file, apply it to the existing text.** Search the repo
  for text that breaks the new rule and fix it in the same change.

## Hand-over report

```
Did:      <what changed, in one or two sentences>
Verified: <command + real outcome, e.g. check-marketplace.mjs → passed; the sweep result>
Skipped:  <anything not run, and why, or "none">
Noticed:  <unrelated problems found and deliberately not fixed, or "none">
```

Never report a check as passing that you did not run.
