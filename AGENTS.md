# AGENTS.md for mstack

Instructions for AI agents (Codex reads this file; Claude Code reads it through `CLAUDE.md`).
This repo ships Claude Code, Codex and Antigravity plugins. The "code" is mostly `SKILL.md` files and their
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

Evidence for Antigravity comes from the self-test that `scripts/agy-self-test/` builds, which a person starts in their own session. No script and no agent of this repository starts an Antigravity session. An agent that develops or tests this repository (and every eval run) may run only `agy --version`, `agy models` and `agy plugin validate <folder>`, and prints `agy plugin install` for the user instead of running it. The installed `mstack-setup` skill is the exception that belongs to a user's own session: it runs `agy plugin install` there after the user's yes.

## Skills install two ways

Every skill installs as a plugin (the Claude Code and Codex marketplaces, and in Antigravity `agy plugin install` with the address of the plugin's folder, because Antigravity has no marketplace for this repository) or with the skills CLI (`npx skills add mubeda/mstack`, which finds the skills through `skills.sh.json`). The skills CLI copies or links only `plugins/<plugin>/skills/<skill>/`, so that folder must hold everything the skill uses: its `references/`, `scripts/`, a `LICENSE` identical to the root one, and its `THIRD_PARTY_NOTICES.md`. Never point a skill at a file outside its own folder. The one exception is an agent definition: Claude Code and Antigravity load agent definitions only from a plugin's `agents/` folder, so `mstack-research` ships its readers there, one per host (`plugins/mstack-research/agents/reader.md` for Claude Code and `plugins/mstack-research/agents/antigravity-reader/agent.md` for Antigravity; search and reading tools only, no model name), and `mstack-antigravity-led-review` ships its lane agent there (`plugins/mstack-antigravity-led-review/agents/review-lane/agent.md`; file reading, file editing and shell commands only, no model name). Each `tools` list is a YAML list, which both validators accept, and `check-marketplace.mjs` fails when an agent's list differs from its pinned tools or names a model. A skills CLI install has no plugin agent: `mstack-research` names its reader by its listed type, never by path, in Claude Code says in its answer that its readers ran without a tool restriction, and in Antigravity opens no page (its result block says so on the `Search:` line); `mstack-antigravity-led-review` has no lane agent and does its items one after another. In Codex `mstack-research`'s reader is a nested read-only run either way, which cannot write but can still run commands, so the agent file changes nothing there. A skill that adds an agent definition states the same way what it does without it. Name any `SKILL.md` used as test data `SKILL.md.fixture`, or it installs as a second skill. `check-marketplace.mjs` checks all of this, including that an Antigravity plugin's `SKILL.md` bodies (the text after the frontmatter) are at most 24,000 bytes, because Antigravity loads only that much of a body; `check-skill.mjs` of `mstack-skill-creator` allows a host tool only inside a skill's host table; it checks `AskUserQuestion`, `codex exec`, `claude -p`, `opencode run`, `cursor-agent`, `ask_question` and `invoke_subagent`. Installs live in two skills. `mstack-setup` installs the mstack skills' dependencies at user scope after one yes (in Antigravity it runs only `agy plugin install`, the code-index install and its connect command, and shows every other command for the user to run, as its `references/dependencies.md` says), and `mstack-find-skills` installs a skill it found only after asking the user the route (plugin or skills CLI) and, for the skills CLI, the scope (global or this repository), the method (symlink or copy) and the agents, because the CLI does not prompt when an agent runs it; the Antigravity plugin command it prints for the user to run and never runs. Every other skill names `mstack-setup` instead of installing (`mstack-product-plan`, `mstack-epic`, `mstack-evidence` and `mstack-decisions` name no installer at all, see Shared skills); `mstack-skill-creator` keeps its own install questions for OpenCode and Cursor only.

## Files the six workflows share

The six workflow plugins come in two kinds: `review` (`mstack-claude-led-review`, `mstack-codex-led-review`, `mstack-antigravity-led-review`) and `dev` (`mstack-claude-led-dev`, `mstack-codex-led-dev`, `mstack-antigravity-led-dev`). Each kind has one shared text: the `SKILL.md` text below its `name` and `description` frontmatter is identical across every workflow of a kind, with a three-column host table, and each workflow adds `host.md` outside `references/` whose first line names its host. `THIRD_PARTY_NOTICES.md` and every file in `references/` are identical across all six workflows, because each install copies only its own skill folder (kind-specific files use `review-*` and `dev-*` names and ship in all six). Edit every copy in the same change. `scripts/check-marketplace.mjs` fails, naming the kind and the plugin or the file and the plugin, when a copy differs or is missing. The ten numbered sections (0 to 9) keep their numbers in both kinds, because the shared reference files point at them. Keep the shared files host-neutral: they name no host tool (the host table and `host.md` do). The broad-research part of `references/external-facts.md` points at `mstack-research`; its lane rule is the workflows' own.

`references/plan-format.md` is shared seven ways: `mstack-plan` writes plans in that format and the six workflows read them. All seven plugins ship identical copies, and `check-marketplace.mjs` fails when they differ. A change to the format is a change to all seven plugins, including what each does with plans written by the old format (sweep rule 5 below).

`references/codegraph.md` is shared ten ways: `mstack-plan`, `mstack-write-specs`, `mstack-diagnose`, `mstack-backlog-triage` and the six workflows ship identical copies of the codegraph steps, and `check-marketplace.mjs` fails when a copy differs from `mstack-plan`'s or is missing. Each `SKILL.md` only points at it; no codegraph command is written into a `SKILL.md`.

## Shared skills

Skill search, installs, model choice, review processing, research outside the repository and which other vendor can review or develop each live in one skill: `mstack-find-skills`, `mstack-setup`, `mstack-best-model-for`, `mstack-receive-review`, `mstack-research` and `mstack-vendors`. No plugin ships a copy of the review rules (`check-marketplace.mjs` fails on a `references/receiving-review.md`); `mstack-plan` and the six workflows load `mstack-receive-review` for every review, and so do their lanes and developers. In Claude Code, Codex and Antigravity no other skill restates their rules, tables or commands: it calls them and reads their result block (`mstack-skill-creator` keeps built-in steps for OpenCode and Cursor only). Claude is reached with `claude -p`, as Codex is with `codex exec`, and both commands come from `mstack-vendors`. `mstack-auto` is an exception of a different kind from the product skills below: it holds its own routing table, with one row per mstack skill that says when the skill applies, because a router needs every skill in one place. The table says when a skill applies and never restates a skill's steps (see The routing table of mstack-auto). A caller whose required shared skill is missing stops with the install commands and the name `mstack-setup`. `mstack-find-skills` is required by `mstack-auto`, which hands it every job no mstack skill covers. `mstack-research` is required by `mstack-plan`, the six workflows (in a dev workflow on the leader's side only, because the coordinator does the broad research) and, in Claude Code, Codex and Antigravity, `mstack-skill-creator`; `mstack-write-specs` and `mstack-diagnose` print its install commands when it is missing and continue with their own lookup. Every caller sends it the literal called message defined in its `SKILL.md` (first line `Called by: <skill>`) and reads the result block defined in its `references/report-format.md`, so a change to either is a change to every caller. The lane rule of `external-facts.md` stays in the six workflows: a lane checks one narrow fact with a local probe, and Codex lanes run with the network off, so it is not a restatement of the research procedure. `mstack-research` takes its readers' models from `mstack-best-model-for` and runs every question as a quick one, without readers, when that skill is missing. Its result block ends with a `Search:` line of four forms (`Search: ran`, `Search: ran, pages not opened (shell commands denied)`, `Search: ran, pages not opened (no restricted reader)` and `Search: not run (<reason>)`), because Antigravity has no tool that opens a page and opens one only through the restricted reader above. In Claude Code it hands a broad question the user asked to Claude's own deep-research skill when the session lists `anthropic-skills:deep-research`, and never in called mode; nothing of that skill's text is copied. `mstack-best-model-for` is required by `mstack-plan`, the six workflows and `mstack-skill-creator`; `mstack-diagnose`, `mstack-write-specs`, `mstack-brainstorm` and `mstack-backlog-triage` print the same install commands when it is missing and continue without starting any subagent. `mstack-write-issue` drafts tracker issues for the user and, in called mode, for the six workflows, which offer it for their deferred follow-ups only when it is installed and never require it (their shared `references/follow-up-issues.md`). It requires no other skill and nothing requires it, so no preflight script checks it. A caller sends the literal called message of its `references/result-block.md`, shows the drafts, and runs a post line only when it has one of that file's two fixed forms and agrees with the draft that was shown; so a change to the message, the block or the forms is a change to the six copies of `follow-up-issues.md`. It never posts in the turn that shows a draft, and its eval cases run against a stand-in `gh` (`evals/_fixture/bin/gh`), never a real tracker. `mstack-anonymize` replaces identifying values with a script of its own folder (`scripts/anonymize.mjs`, Node.js with no package). It requires no other skill and nothing requires or calls it, so no preflight script checks it. The agent never opens the raw file or the user's terms file, and opens a result file only for a review the user asked for; the script's report holds counts and never a value. Its tests and eval cases use values from ranges reserved for examples and a made-up terms file, never the user's own, and `evals/_fixture/trace-check.mjs` reads Claude Code traces and Antigravity transcripts, fails closed on a record or a tool it does not know, and fails a session whose tool calls could have read the raw data by another means than the script. A change to the script's command line, its report or the form of a placeholder is a change to its `SKILL.md`, its reference file, its tests, the trace check and the eval graders. Its text never calls a result anonymous or compliant with a law. `mstack-web-ui` builds and reviews web interfaces, modern web platform features (Baseline fallbacks, HTML/CSS/JS, CWV, client web security, Passkeys, privacy, PWA, Built-in AI, WebMCP, Wasm) and Manifest V3 Chrome extensions from text alone: it ships no script and no data, and fetches no rules from the network. It requires no other skill and nothing requires or calls it, so no preflight script checks it; the six workflows keep `ui-ux-pro-max` for web work. The project's design system, components and stack win over every default in it, a taste rule in it is a default with its reason and never a ban, and its React part applies only in a project that uses React, by the installed version. A rule in it that comes from a source is rewritten and credited in its `THIRD_PARTY_NOTICES.md`; a rule of choice that no source states is marked in the text as the skill's default and carries its reason. It builds a decorative effect that runs without end only when the user asks for it by name. Each subject has one value in one part: `plugins/mstack-web-ui/tests/skill-shape.test.mjs` fails on a second press scale or target size, on a duration in the part on component choice, on a second statement of the five-second limit for moving content, on a part over its line limit, and on an address in the rules. A new rule goes into the part that owns its subject, with its reason, and never as a second statement of a value another part gives. `mstack-resolve-merge-conflicts` resolves Git merge, rebase, cherry-pick, stash-pop, and staged marker-only conflicts with a read-only local script of its own folder (`scripts/conflict-context.mjs`, Node.js 18+ and Git with no external packages). It requires no other mstack skill and nothing requires or calls it, so no preflight script checks it; it never commits, continues, pushes, tags, or aborts without explicit user consent, and credits its four MIT/Apache-2.0 sources in its `THIRD_PARTY_NOTICES.md`. `mstack-sharpen-prompt` reframes and sharpens rough user prompts before AI execution from text alone: it ships no script, runs 100% offline with zero URLs in rule text, requires no other mstack skill and nothing requires or calls it, picks `reframe`, `sharpen` or `both` automatically, stays strictly read-only in the rewrite turn ending with a one-line execution offer, and credits its two MIT sources (`cursor/plugins` `pstack` and `github/awesome-copilot`) in its `THIRD_PARTY_NOTICES.md`. A change to a shared skill's input or result block is a change to every caller (sweep rule 1). Model names appear only in `mstack-best-model-for`'s table, in reviewer questions and in reviewer defaults, in a rule that excludes one named model, and in an eval case as test input or as the expected answer. The dev workflows take their developer-model options from `mstack-best-model-for` at run time, so no developer model name is written into their skill text.

`mstack-vendors` owns which other vendor may and can do each job from a session (a code review, a plan review, a developer): the eligibility rule (a reviewer or developer vendor is `claude` or `codex`, minus the leader's vendor, and for a review minus the writers), the Record column, filled by the table of `mstack-receive-review`, and the command and steps per host, vendor and job. A caller sends the literal called message and reads the result block, both in its `references/result-block.md`, so a change to either is a change to every caller (sweep rule 1). It requires no other skill and names no model: the models come in the caller's `Models` line. `antigravity` is never a vendor it calls, and Claude is reached with `claude -p`. `mstack-vendors` is required by the six workflows, `mstack-plan`, the start file's inline execution and, in Claude Code, Codex and Antigravity, `mstack-skill-creator`. The three removed workflows are replaced as follows: `mstack-codex-review-workflow` by `mstack-claude-led-review`, `mstack-claude-review-workflow` by `mstack-codex-led-review`, and `mstack-claude-pm-codex-dev` by `mstack-claude-led-dev`.

One client is enough (decided by the user, 2026-11-24): mstack works with one of Claude Code, Codex and Antigravity installed. A part that needs another vendor's client is optional and falls back (a same-vendor fallback review with a warning). Only a skill specific to a vendor or a pairing may stop because that vendor is missing: (a) a dev workflow may stop for a missing developer vendor, while the host's review workflow still runs with its fallback review; (b) a required mstack skill is not a vendor requirement, because it installs in the one host the user has. No workflow's first preflight part requires another vendor's client.

`mstack-product-plan` and `mstack-epic` are the exception to "no other skill restates their rules". They are written for product people and also have to work in the Claude and ChatGPT desktop apps, where no plugin can be installed. So no other skill is required by them: each carries short built-in versions of the steps a missing helper skill would do (finding the reason, processing a review, choosing a model), in its `references/product-interview.md` and `references/product-review.md`, announces in one line when it uses one, and never stops, prints install commands as a condition, or names `mstack-setup` as a requirement. Their descriptions stay within 200 characters, the lowest limit documented for the Claude desktop app. `mstack-evidence` and `mstack-decisions` are written for the same people and hosts and follow the same two rules: they require no other skill, and their descriptions stay within 200 characters. They use no helper skill at all. Their sources are customer feedback and meeting transcripts, so they never send a document or its sources to another vendor's model: their review is a fresh read by the same vendor's model, after a script in the skill's folder has checked every quote and count against the sources (where no code can run, the skill checks them by reading the sources again and says so). For the same reason `mstack-product-plan` and `mstack-epic` skip their cross-vendor reviewer whenever a source holds customer feedback, an interview, meeting notes or a transcript, in any form (an evidence or decisions document among them, or a source of the parent plan), and when unsure they treat the source as if it did (`product-review.md` › Who reviews).

The product documents share one format file five ways. `references/product-format.md` ships as identical copies in `mstack-product-plan`, `mstack-epic`, `mstack-evidence` and `mstack-decisions`, which each write one kind of document in it (a product plan, an epic, an evidence document, a decisions document), and in `mstack-write-specs`, which reads an approved epic, evidence document or decisions document as a source. For the last two kinds the shared file holds only the opening lines, the part names and the reading rule; the layout inside their parts, and the exact line forms their check scripts read, belong to `evidence-format.md` and `decisions-format.md` in the writing skill. A change to a line form there is a change to that skill's script and its tests. `references/product-interview.md` and `references/product-review.md` ship as identical copies in `mstack-product-plan` and `mstack-epic` only. `check-marketplace.mjs` fails when a copy differs or is missing. These three files name no host tool: each `SKILL.md` says which tool plays each role, and puts a host command only in a cell of its host table. A change to the format (an opening line, a header line, a fixed heading or label) is a change to all five plugins, including what `mstack-write-specs` does with documents written by the old format (sweep rule 5 below).

`mstack-brainstorm` comes before `mstack-write-specs` in the chain: it turns an unformed idea into an approved design brief (first line `# Design brief: <title>`, then a `Status:` line), and `mstack-write-specs` treats the user's decisions in an Approved brief as settled. A change to the brief's opening lines or part headings is a change to both skills.

## The routing table of mstack-auto

`mstack-auto` picks the skill for a prompt from the table under `## Routing table` in `plugins/mstack-auto/skills/mstack-auto/SKILL.md`. Keep it true in the same change that touches a skill:

- **A skill is added:** add its row (when it applies, the hosts it runs in, the next skill of its chain, and for a skill of one host its counterpart on another host).
- **A skill is removed:** remove its row, and its name from every other row's chain and other-host cells.
- **A skill changes what it is for, where it sits in a chain, or which hosts it runs in:** change its row, and the "Choose" rules of that file when they name the skill.

Bump `mstack-auto` with every such change. `check-marketplace.mjs` fails when a plugin of either registry or with an Antigravity manifest has no row (`mstack-auto` itself needs none), or a row names a skill that is no such plugin. It cannot tell whether a row is right: read the row against the skill's description, in your own words, never as a copy of it.

## Git and pull requests

- `main` is the default branch. Work on a branch, push it, and open a pull request. Merge `main`
  into the branch when it moves.
- Before switching branches or editing, check which branch is checked out (`git status -sb`).
- Commit, push or open a pull request only when the user explicitly asks for that step.
  Approving something else (a draft, a plan, a list of fixes) is not consent.
- Never merge a pull request before its review bots have finished. Wait until every automated
  review on it reports a result, process each finding, and merge only then. A review that arrives
  after the merge costs a second pull request.

## Before every commit

1. **Run the checks.**
   ```bash
   git fetch origin main
   node scripts/check-version-bumps.mjs
   node scripts/check-marketplace.mjs
   ```
   `check-marketplace.mjs` runs `agy plugin validate` on every plugin with an Antigravity manifest when a file
   named `agy` is found on `PATH` (an `agy.exe` or `agy.cmd` on Windows is not looked for, so the step is skipped there), and prints `Antigravity validator step skipped: agy was not found on PATH` otherwise.
2. **Bump the version of every plugin you changed.** Claude Code and Codex only pick up a plugin
   change when its version changes. Change it everywhere it appears: its entries in `.claude-plugin/marketplace.json`
   and `.agents/plugins/marketplace.json`, the plugin's `.claude-plugin/plugin.json`, its
   `.codex-plugin/plugin.json` and its `.antigravity-plugin/plugin.json`. Every plugin has all three
   manifests except the single-host plugins in the `singleHost` table of `scripts/check-marketplace.mjs`,
   which have only their host's manifest and registry entry; an Antigravity-only plugin has no registry entry. A plugin already bumped on this branch
   (not yet on `main`) needs no second bump for later fixes in the same pull request. After
   merging `main`, a plugin bumped on both sides needs a version above both parents.
   Also raise the marketplace's own `metadata.version`, to the same value in `.claude-plugin/marketplace.json`
   and `.agents/plugins/marketplace.json`, the minor number when a plugin is added or removed and the patch
   number otherwise.
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
   meaning. Skills share contracts, because a value one skill writes, others read. A change to what a skill is for, to its place in a chain or to its hosts is also a change to its row in `mstack-auto`'s routing table. **When you widen or
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
