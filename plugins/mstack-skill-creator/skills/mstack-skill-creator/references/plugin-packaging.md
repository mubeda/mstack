# Plugin packaging

Read this in Phase 0 (to recognize the target), Phase 7 (packaging) and Phase 8 (the review, after packaging). Packaging applies only to a plugin target. A local target skips Phase 7, and runs Phase 8 only when the user accepted the review.

## Recognizing a plugin target

A repository is a plugin target when it has both a Claude Code registry (`.claude-plugin/marketplace.json`) and a Codex registry (`.agents/plugins/marketplace.json`) whose entries point at plugin folders. Propose the plugin target and wait for the user's answer before writing any file. When only one registry exists, say what you found and ask whether the skill should go in it or be local.

## Reading the repository's rules

A plugin target states its own rules. Read, in this order, and follow what they say over anything in this file:

1. The agent instructions at the root (`AGENTS.md`, `CLAUDE.md`, or `CONTRIBUTING.md`).
2. The README's section on adding a plugin or a skill.
3. The scripts the instructions name as checks, and the newest plugin folder, as the example to copy.

Write down the rules you found and the checks you will run, and show them to the user with the target question. When the repository names no check, say so now and again in the report: the packaging was then not verified by a check.

## Files a plugin needs

Copy the shape of the newest complete plugin in the repository. Look for each of these, and create the ones that plugin has:

| What | Where to look |
|---|---|
| One manifest per host | `<plugin>/.claude-plugin/plugin.json`, `<plugin>/.codex-plugin/plugin.json` (with `"skills": "./skills/"`) |
| An entry in each registry | the two registry files above, mirroring a neighbor's fields |
| The skill folder | `<plugin>/skills/<name>/SKILL.md`, its references, scripts and evals |
| A license copy | inside the skill folder, when the newest plugin has one, identical to the root license |
| A notices file | inside the skill folder, when the newest plugin has one; it credits every adapted source |
| A README entry | the table of plugins, and each install section |

Keep the plugin folder name, the manifest `name`, the registry entries and the skill folder name equal.

## Versions

A new plugin starts at the version the repository's newest plugin started at (for example `0.1.0`). A changed plugin needs a higher version than the default branch has. Every copy of one version changes together: both manifests and both registry entries. When the Claude Code registry has its own `metadata.version`, raise it as the repository's rules say (for example the minor number when a plugin is added).

## The repository's checks

1. Run every check the rules name, from the repository root, and read the whole output.
2. Fix each failure in the plugin's files, then run the check again.
3. Quote each check's final result line in the report.
4. When a check still fails after your fixes, show its failing output to the user and report the skill as not ready to commit.

Run `scripts/check-skill.mjs` on the new skill folder as well, and for a public repository `scripts/scan-private.mjs` on the plugin folder (Phase 4).

## Cross-vendor review

1. Ask the reviewer named in the "Cross-vendor reviewer" section of the host file for a read-only review of the plugin folder, the registry and README changes, and the spec when there is one. Write the prompt to a file with your file tool and pass it to the reviewer from that file, so no shell expands anything in it.
2. When no reviewer of another vendor is available, warn the user, run the same prompt in a fresh read-only context of your own vendor, and record the review as same-vendor.
3. An empty output or an error is never a clean review. Read the error, fix the cause once, rerun once, and otherwise fall back as in item 2.
4. Verify every finding against the files before acting. Fix a real finding, and check the same mistake in sibling files. Reject a finding the files contradict, with the reason, and change nothing for it. Send an unclear finding back once.
5. List every finding with what happened to it.
6. After the fixes, run the static check, the scan and the repository's checks again, and quote their result lines.

## The report

For a plugin target, the report lists every workflow step (research, spec, plan, writing, packaging, static check, comparison test, benchmark, review, versions, the repository's checks) with its outcome, or "not run" and the reason, and names each step that used a built-in fallback. A skipped step means the skill is not ready to commit.

Never commit, push, open a pull request or publish. Offer the next step, and take it only when the user asks.
