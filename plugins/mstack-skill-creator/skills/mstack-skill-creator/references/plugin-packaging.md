# Plugin packaging

Read this in Phase 0 (to recognize the target), Phase 7 (packaging) and Phase 8 (the review, after packaging). Packaging applies only to a plugin target. A local target skips Phase 7, and runs Phase 8 only when the user accepted the review.

## Recognizing a plugin target

A repository is a plugin target when it has both a Claude Code registry (`.claude-plugin/marketplace.json`) and a Codex registry (`.agents/plugins/marketplace.json`) whose entries point at plugin folders. Propose the plugin target and wait for the user's answer before writing any file. When only one registry exists, say what you found and ask whether the skill should go in it or be local.

## Reading the repository's rules

A plugin target states its own rules. Read, in this order, and follow what they say over anything in this file. The one exception is the Antigravity manifest (Files a plugin needs), which you add also when the rules do not name it:

1. The agent instructions at the root (`AGENTS.md`, `CLAUDE.md`, or `CONTRIBUTING.md`).
2. The README's section on adding a plugin or a skill.
3. The scripts the instructions name as checks, and the newest plugin folder, as the example to copy.

Write down the rules you found and the checks you will run, and show them to the user with the target question. When the repository names no check, say so now and again in the report: the packaging was then not verified by a check.

## Files a plugin needs

Copy the shape of the newest complete plugin in the repository. Look for each of these, and create the ones that plugin has, plus the Antigravity manifest (below):

| What | Where to look |
|---|---|
| One manifest per host | `<plugin>/.claude-plugin/plugin.json`, `<plugin>/.codex-plugin/plugin.json` (with `"skills": "./skills/"`), `<plugin>/.antigravity-plugin/plugin.json` (`name`, `version`, `description`, `license`, `author`) |
| An entry in each registry | the two registry files above, mirroring a neighbor's fields |
| The skill folder | `<plugin>/skills/<name>/SKILL.md`, its references, scripts and evals |
| A license copy | inside the skill folder, when the newest plugin has one, identical to the root license |
| A notices file | inside the skill folder, when the newest plugin has one; it credits every adapted source |
| A README entry | the table of plugins, and each install section |

Keep the plugin folder name, the manifest `name`, the registry entries and the skill folder name equal.

### Single-host plugins

When the repository's agent instructions declare a plugin single-host (for example under `## Single-host plugins` in `AGENTS.md`, as ``- `<name>`: Claude Code only``, `Codex only` or `Antigravity only`), package it with **only** its declared host's manifest folder and registry entry:

- **Claude Code only**: `.claude-plugin/plugin.json` and an entry in `.claude-plugin/marketplace.json`; no Codex or Antigravity manifest and no Codex registry entry.
- **Codex only**: `.codex-plugin/plugin.json` (with `"skills": "./skills/"`) and an entry in `.agents/plugins/marketplace.json`; no Claude Code or Antigravity manifest and no Claude Code registry entry.
- **Antigravity only**: `.antigravity-plugin/plugin.json`; no Claude Code or Codex manifest and **no** entry in either marketplace registry.

Every other plugin of an mstack-style marketplace keeps the three-manifest rule (all three manifests and both registry entries).

### The Antigravity manifest

Create `<plugin>/.antigravity-plugin/plugin.json` for every plugin you package that is not declared single-host for another host, in any host: also when the user named fewer hosts, when the repository's rules name only two manifests, and when the newest plugin has none. A plugin of an mstack-style marketplace then installs in Antigravity too. Its `version` equals the other manifests' version. Write all five fields, and never hold the manifest back for a value you are unsure of. Take `description`, `license` and `author` from the plugin's other manifests or from the newest plugin's. Where none has a value, the license is the identifier of the root license file (for example `Apache-2.0`), or `LicenseRef-<repository name>` when that file has no known identifier, and the author is `{"name": "<owner>"}`, the owner taken from the repository's remote, the root license file or the Git user name. Name the values you chose in the report, so the user can correct them. The one plugin that gets none is a plugin the repository's rules assign to a single other host (Claude Code only or Codex only).

After writing it, check whether Antigravity's command is installed with `command -v agy`:

- Found: run `agy plugin validate "<plugin folder>"`. It must exit 0. When it exits with another code, the packaging is not done: correct what its output names, run it again, and when it still fails show the output to the user and report the skill as not ready to commit. After exit 0, copy its success line into the report word for word (`✔ Validation passed` on 2026-11-23). Run no other `agy` command.
- Not found: write "Antigravity manifest not validated: agy not found" in the report.

Neither outcome is a test in Antigravity. Never report the skill as tested there because the manifest exists or the validator passed.

## Versions

A new plugin starts at the version the repository's newest plugin started at (for example `0.1.0`). A changed plugin needs a higher version than the default branch has. Every copy of one version changes together: the three manifests and both registry entries. A plugin that the repository's rules assign to one host has only that host's manifest and registry entry. When a registry has its own `metadata.version`, raise it as the repository's rules say (for example the minor number when a plugin is added), to the same value in every registry that has one.

## The repository's checks

1. Run every check the rules name, from the repository root, and read the whole output.
2. Fix each failure in the plugin's files, then run the check again.
3. Quote each check's final result line in the report.
4. When a check still fails after your fixes, show its failing output to the user and report the skill as not ready to commit.

Run `scripts/check-skill.mjs` on the new skill folder as well, and for a public repository `scripts/scan-private.mjs` on the plugin folder (Phase 4).

## Cross-vendor review

### Claude Code, Codex and Antigravity

In these three hosts, take every reviewer, command and fallback review from `mstack-vendors`, and process every review with `mstack-receive-review`. Never choose a reviewer or write a reviewer command of your own here. When no `mstack-vendors` block can be had (for example no network when needed, or `mstack-vendors` failing), report the review as not run with the reason.

1. Use the `code review` answers from the `mstack-best-model-for` call of `SKILL.md` › Host tools to build `Models:` for `claude` and `codex` without this host's own vendor (`codex` alone in Claude Code, `claude` alone in Codex, both `claude` and `codex` in Antigravity), always converting any Claude model to its full headless id from `Claude headless id` / `How to set`, never an alias.
2. Call `mstack-vendors` with this exact literal message kept verbatim in the conversation (never a summary). `Writers:` is `claude` in Claude Code, `codex` in Codex and `unknown` in Antigravity. In Antigravity this skill sends no `Leader model` line and does not ask for it.

   ```text
   Called by: mstack-skill-creator
   Host: <claude-code | codex | antigravity>
   Workspace: <repository root, or the target skill or project folder when reviewing a local skill outside a Git repository>

   Job: code review
   Writers: <claude | codex | unknown>
   Workflow: review
   Models: <vendor>=<model id> <effort>[; <vendor>=<model id> <effort>]
   ```

   Write the `mstack-vendors` result block before running any review command.
3. When `Recommend:` names one or more reviewers: ask the user once with your question tool which offered reviewers should review and on which model (the recommendation is the default; never offer `antigravity`). If any chosen default model is flagged as expensive in `mstack-best-model-for`, ask a question of its own naming the next non-flagged model down (a model the user typed draws no question; a session that cannot ask runs the recommendation on non-flagged models). Whenever the user's chosen reviewer subset or any model or effort differs from the discovery block's `Recommend:` and `Models:`, send one selection refresh message to `mstack-vendors` with `Models:` holding only the chosen reviewer(s) and their final model and effort (full headless id for Claude), and run only that execution block's commands.
4. When `Recommend:` says `a fallback review`: ask no pick question and no model question, warn the user that no other vendor is reviewing and this is a fallback review, and follow the block's `Steps` for the fallback review.
5. Run the final block's commands and `Steps` in full over the plugin folder, the registry and README changes, and the spec when there is one (with two reviewers, one after the other; wait for every command to complete and read its output; handle failures and fallback exactly as the `Steps` say). Hand each reviewer's output unchanged and unmerged to `mstack-receive-review` once per review with the three caller lines (`Review:`, `Writers:`, `Reviewer vendor:`) that the `Steps` specify.
6. Record every review in the Phase 9 report with its Record value from `mstack-receive-review` and the block's Record column (never upgrading a `writer unknown`, `reviewer unknown` or `same-vendor` review to `cross-vendor`), and list every finding with what happened to it.
7. After fixing verified findings, run the static check, the private-data scan and the repository's checks again, and quote their result lines.

### OpenCode and Cursor

These six steps apply only in OpenCode and Cursor, where `mstack-vendors` is not required:

1. Ask the reviewer named in the "Cross-vendor reviewer" section of the host file for a read-only review of the plugin folder, the registry and README changes, and the spec when there is one. Write the prompt to a file with your file tool and pass it to the reviewer from that file, so no shell expands anything in it. State in the prompt the form of the answer: numbered findings, each with the file and line it is about, what goes wrong there and how to see it (a command, or the lines to read), then one last line with the verdict, "Verdict: no findings" or "Verdict: <n> findings". When the reviewer is a command of another vendor's client, wait for the command to end and read its output before you go on.
2. Record a review as cross-vendor only when the reviewer's vendor is known and differs from the vendor of the model that wrote the skill. Record it as same-vendor when both are known and equal, and otherwise write what is known, as the host file says. When no reviewer of another vendor is available, warn the user, run the same prompt in a fresh read-only context of your own vendor, and record the review as same-vendor. When this session can start no fresh context either (no subagent tool and no fresh-session command that works), read the files again yourself against that prompt, and record the review as same-vendor, by the author, without a fresh context.
3. An empty output or an error is never a clean review. Read the error, fix the cause once, rerun once, and otherwise fall back as in item 2.
4. Verify every finding against the files before acting. Fix a real finding, and check the same mistake in sibling files. Reject a finding the files contradict, with the reason, and change nothing for it. Send an unclear finding back once.
5. List every finding with what happened to it.
6. After the fixes, run the static check, the scan and the repository's checks again, and quote their result lines.

## The report

For a plugin target, the report lists every workflow step (research, spec, plan, writing, packaging, static check, comparison test, benchmark, review, versions, the repository's checks) with its outcome, or "not run" and the reason, and names each step that used a built-in fallback. It gives the validator's result line for the Antigravity manifest, or says that the manifest was not validated. A skipped step means the skill is not ready to commit.

Never commit, push, open a pull request or publish. Offer the next step, and take it only when the user asks.
