# Design brief: Antigravity as a third mstack host

Status: Approved 2026-11-21 (approved in chat by the user)

Note of 2026-11-23, added when the work was re-scoped: two parts of this brief no longer hold, and the three specs that followed it are the authority (`docs/specs/2026-11-21-add-antigravity-host.md`, decisions D26 to D28 and D34 to D37). First, no agent and no script starts or drives an Antigravity session; the evidence for Antigravity comes from sessions a person opens. Second, no mstack skill reaches another client through a bridge of another repository: Claude is reached with the Claude Code client itself and Codex with `codex exec`. The passages below that describe reaching a client through such a bridge, and the permission to file issues in that repository, are kept as the record of what was approved on 2026-11-21 and are not instructions.

## Intent

The mstack skills run today in Claude Code and Codex. The user wants them to run in the Antigravity CLI (`agy`) as well, and wants the review and development workflows to work with whichever vendors are installed: any of the three hosts can lead, and the other vendors review or develop. Today the workflows are fixed pairs (Claude leads and Codex reviews, Codex leads and Claude reviews, Claude manages and Codex writes). After this work, a user with one, two or three of the vendors installed gets the same behavior from any host, and the strongest review the machine allows.

## Goals, non-goals and anti-goals

Goals:
- Every mstack skill loads and works in each host it runs in: every skill except the six workflows runs in Claude Code, Codex and Antigravity, and each workflow runs in its leader's host; each is tested in its hosts with the real client (`claude`, `codex`, `agy`).
- Six workflows, two per leading host, named by the leader: `mstack-claude-led-review`, `mstack-claude-led-dev`, `mstack-codex-led-review`, `mstack-codex-led-dev`, `mstack-antigravity-led-review`, `mstack-antigravity-led-dev`. Each runs only in its leader's host (the session the user is in is the leader), so each host offers two. Each asks which installed vendor reviews (review workflows) or develops (dev workflows, one developer per run).
- In a dev workflow the leader always reviews the developer's code, and the third vendor reviews too, in parallel, when it is installed; the developer never reviews its own code.
- One reviewer rule, for plan reviews and code reviews, in every host: when both other vendors are available, recommend both, run them in parallel and process their findings together; when one is available, recommend it; when none is, warn and do a same-vendor review. The user may accept the recommendation or pick one reviewer; that pick is the user's decision for the run. In a dev workflow the leader always reviews, so the pick there is only whether the third vendor reviews too.
- `mstack-plan` offers the plan reviewer by that rule, and its plan start file (`execute-plan.md`) offers the two workflows of the host it runs in.
- A new shared skill, `mstack-vendors` (working name), owns the installed-vendor check, the reviewer rule, and the command per vendor and host for a code review, a plan review and a developer run.
- Antigravity installs per plugin from the repository address or a folder; each plugin that runs in Antigravity passes `agy plugin validate`.

Non-goals:
- No Antigravity marketplace file and no release archives with checksums.
- No fix to agent-bridges inside this mstack pull request; bugs found there get a GitHub issue there, and are fixed in agent-bridges itself.
- No change to what any existing skill is for, beyond the host and vendor additions.

Anti-goals (failure even if everything runs):
- The reviewer rule or the vendor commands written out in more than one skill, apart from the built-in steps AGENTS.md requires of `mstack-product-plan` and `mstack-epic` and the OpenCode and Cursor steps of `mstack-skill-creator`.
- A skill that claims to work in Antigravity without a run with the real `agy` client behind the claim.
- A new skill that reads a value an old version saved (for example an old progress file) and silently runs with a reviewer or developer the user never chose.
- Personal data, home paths or private names in any committed file.

## Constraints

- AGENTS.md: shared skills own their rules and other skills call them and read their result block; shared reference files ship as identical copies, checked by `scripts/check-marketplace.mjs`; every changed plugin is bumped in each registry that lists it (a plugin for one host has only that host's entry and manifest); the marketplace gets a minor bump when plugins are added or removed; the `mstack-auto` routing table changes with every added, removed or renamed skill; the outside-the-diff sweep and a second-opinion review come before every commit.
- AGENTS.md: each skill folder holds everything it uses, because the skills CLI copies only that folder.
- AGENTS.md: `mstack-product-plan`, `mstack-epic`, `mstack-evidence` and `mstack-decisions` may require no other skill, because they also run in desktop apps without plugins; `mstack-product-plan` and `mstack-epic` can call a helper when it is installed and must work without it, and `mstack-evidence` and `mstack-decisions` use no helper at all. `mstack-evidence` and `mstack-decisions` never send a document or its sources to another vendor's model, and `mstack-product-plan` and `mstack-epic` skip their cross-vendor reviewer whenever one of those two documents is among their sources, directly or through a parent document.
- AGENTS.md: `mstack-research` ships a Claude Code agent definition in its plugin's `agents/` folder (`agents/reader.md`, with Claude Code tool names), and Antigravity plugins also load `agents/`.
- The `mstack-anonymize` trace check reads one trace format, ignores tool names it does not know, and passes when it saw no tool call, so a run in another host can pass it without proving the raw file was never read.
- `scripts/check-version-bumps.mjs` and `scripts/check-marketplace.mjs` know only the Claude Code and Codex manifests and registries: `check-version-bumps.mjs` skips a plugin with neither manifest as removed, and `check-marketplace.mjs` fails on it.
- Antigravity documents no third-party marketplace. The `agy` 1.5.13 binary reads a `marketplace.json` only when each entry has a download address and a checksum (probed in the previous session).
- A plugin with only `.antigravity-plugin/plugin.json` passes `agy plugin validate` (one warning, no logo). An Antigravity plugin can hold `skills/`, `agents/`, `rules/`, `hooks.json` and `mcp_config.json`, and no `commands/` (probed).
- Bridges: Antigravity is reached through the agent-bridges `antigravity` plugin and Claude through the agent-bridges `claude` plugin. Codex is reached today two ways: read-only reviews through the third-party skill-codex `codex` skill, and the Codex developer of `mstack-claude-pm-codex-dev` through the OpenAI Codex plugin for Claude Code (`codex:codex-rescue`), which runs in Claude Code only; the workflow checks the developer's job, phase and thread before it accepts changes. skill-codex and the OpenAI plugin are maintained outside agent-bridges.
- agent-bridges issue 7 is fixed and closed (from `antigravity` 0.1.2, `claude`, `gemini` and `cursor` 0.2.4 and `opencode` 0.3.4, bridges keep state in their own folder); jobs that an older bridge started in another plugin's folder are not found after the update.
- The Antigravity companion's `review` command takes a model (`-m`) but no custom prompt; a custom prompt goes through `adversarial-review` focus text or through `task` without the write flag. `agy` takes effort both as a suffix of the model id and as an `--effort` flag.
- The Antigravity bridge's setup does not check sign-in: it checks `agy --version` and says sign-in can only be checked by a run. The Claude bridge checks `claude auth status`, and `codex login status` exists for Codex.
- `agy` runs models from more than one provider (Gemini, Claude, an open-weight GPT model), so the host does not tell which vendor's model wrote or reviewed the code.
- Writing developers through the Claude and Antigravity bridges need an explicit permission-bypass opt-in and can then run commands without prompting, unlike the sandboxed Codex developer of today's workflow, whose Git stays read-only while the leader reviews and commits.
- `agy plugin install` and `agy plugin link` write to the global Antigravity configuration.
- The repository is public.

## Approaches considered

1. **Inline in each skill.** A third column in every host table, and each workflow and `mstack-plan` writes out the vendor check, the reviewer rule and the bridge commands itself. No new dependency; the rule lives in eight places and needs a check to keep them in step.
2. **A shared vendor skill (picked).** `mstack-vendors` owns the vendor check, the reviewer rule and the command per vendor and host; the six workflows and `mstack-plan` call it in called mode and read its result block (the brief-review round added the plan start file and `mstack-skill-creator` as callers, see Decisions); host tables get a third column for tools only. The rule exists once, the same way `mstack-best-model-for` owns model choice.
3. **A host file per host.** Host-neutral `SKILL.md` files plus one host file per host in each skill's `references/`. Adding a host means adding files, but it touches about 75 files and still repeats the reviewer rule in each workflow.

The user picked approach 2, because the rule and the commands then exist once.

## Tradeoffs accepted

- Removing the developer's own review: today `mstack-claude-pm-codex-dev` records a review by Codex of Codex's code as the same-vendor review; under the new rule the developer never reviews its own code, which buys a cross-vendor review on every dev run, and `mstack-receive-review`'s rule on same-vendor reviews changes with it.
- One more required shared skill: the six workflows, `mstack-plan`, the plan start file and `mstack-skill-creator` (in Claude Code, Codex and Antigravity) stop at their preflight without `mstack-vendors`. It buys one place for the rule and the commands.
- A new contract: a change to `mstack-vendors`'s called message or result block is a change to every caller (AGENTS.md sweep rule 1).
- Design red flag, lists kept in step by hand: host tables in every skill gain an Antigravity column, so a fourth host would again touch every skill. Accepted because host tools (question tool, subagent tool, skill folders) differ per skill's use and approach 3 was declined.
- Old plan folders are not carried over: an old `execute-plan.md` still runs inline, but its workflow choices name the three removed plugins: they run their old behavior while the old plugin stays installed, and fail at the install step once it is gone; nothing maps them. Running `mstack-plan` again on an approved folder keeps its old start file, so the user plans again in a new folder. It buys one route with no aliases or stubs to maintain; README says so.
- The six workflows share reference files (today three do), so each shared file ships in six copies, checked by `check-marketplace.mjs`.
- The pull request is all or nothing: it waits until every skill that runs in Antigravity passes a real `agy` run, so an agent-bridges bug that blocks a skill holds the whole change until it is fixed in agent-bridges (third-party dependencies are the exception the warning rule makes). It buys a release with no partial Antigravity support to explain.
- Antigravity users install plugin by plugin from the repository address or a folder, without a marketplace, until Antigravity documents one.

## Decisions

### Decided by the user

- Brainstorm first, then a spec, a plan and the build (interview, 2026-11-21).
- Three hosts: Claude Code, Codex and Antigravity; every existing skill is adapted and tested in Antigravity, and the Codex side is done in full (interview).
- Six workflows named by the leading host, each asking which installed vendor reviews or develops; the three old workflows are removed (interview), and old plan folders are not mapped (brief-review round, 2026-11-21).
- The reviewer rule: both other vendors when both are installed, in parallel with findings processed together; otherwise the installed one; with none, a warning and a same-vendor review; for plan and code reviews alike (interview).
- `mstack-plan` offers the reviewer by that rule and its plan start file offers the workflow that runs the plan (interview).
- Bridges: agent-bridges for Claude and Antigravity, and for Codex reviews the skill-codex `codex` skill (interview). A Codex developer runs through the OpenAI Codex plugin in Claude Code, keeping today's job, phase and thread checks, and through skill-codex `codex exec` with a write sandbox in Antigravity; `mstack-vendors` holds both commands (brief-review round).
- In Antigravity, a third-party dependency with no Antigravity support (for example ponytail, codegraph, ui-ux-pro-max) is a warning line, not a preflight stop: the skill runs without it and says so, so no third-party project blocks the pull request (brief-review round).
- An inline `execute-plan.md` run and `mstack-skill-creator` (in Claude Code, Codex and Antigravity) also call `mstack-vendors` for their cross-vendor review, so the rule exists once; `execute-plan.md` then needs `mstack-vendors` installed, and `mstack-skill-creator` keeps built-in steps for OpenCode and Cursor only (brief-review round).
- Tests with the real `claude`, `codex` and `agy` clients on cheap models, including one end-to-end run of each workflow (interview).
- One pull request for everything (interview).
- Antigravity packaging: a `.antigravity-plugin/plugin.json` per plugin, checked with `agy plugin validate` in the repository checks; install commands by repository address or folder in README and `mstack-setup`; no marketplace file or archives (packaging question).
- Bugs found in agent-bridges while testing get a GitHub issue there without asking first (standing rule).
- Build with approach 2, a shared `mstack-vendors` skill (approaches question, 2026-11-21).
- Each workflow runs only in its leader's host; `execute-plan.md` offers that host's two workflows (builder-check round, 2026-11-21).
- In dev workflows the leader reviews, plus the third vendor in parallel when installed; one developer per run (builder-check round).
- The pull request waits until every skill passes a real `agy` run; nothing ships with partial Antigravity support (builder-check round).

### Agent's calls

- The reviewer rule is applied by `mstack-plan` and the plan start file in every host, because the user wants the same behavior from all three hosts.
- `mstack-best-model-for` gets an Antigravity column, because the workflows need a model and effort per vendor; `mstack-setup`, `mstack-auto`, AGENTS.md, README and the checks follow; every plugin is bumped and the marketplace gets a minor bump, because AGENTS.md requires it.
- Availability is per vendor, per job (code review, plan review, developer) and per host: the CLI is present, the bridge or plugin for that job loads, and sign-in is confirmed; a missing piece leaves the vendor out of that job with a message, rather than failing the workflow.
- A vendor is the provider of the model that runs, not the host, and every bridge run into `agy` uses a Gemini model, because otherwise Claude-written code could get a Claude review through Antigravity recorded as cross-vendor.
- Eligible reviewers are the available vendors other than every vendor whose model wrote the code under review: in a review workflow the leader and the lanes (whose models the workflow assigns), in a dev workflow the developer. When no eligible vendor is available, the rule's same-vendor review applies and is recorded as such.
- A dev workflow needs a second available vendor to develop; with only the leader's vendor available it stops, says why, and offers the leader's review workflow. With exactly two vendors, the leader reviews alone.
- A writing developer from another vendor must not be able to publish anything before the leader's review; the leader still reviews and commits. This is a security point, because the Claude and Antigravity bridges' write mode skips permission prompts.
- The user's own-host-only answer narrows "every skill" in the hosts, packaging and release-gate decisions: only plugins that run in Antigravity get an `.antigravity-plugin/plugin.json`, `agy plugin validate` and a real `agy` run; the four workflows led by Claude or Codex are tested in their own host only.
- skill-codex is third-party and only a helper: a Codex review's channel is a signed-in `codex` CLI, so without the skill, Codex reviews run through plain `codex exec`, as `mstack-claude-pm-codex-dev` does today (`mstack-codex-review-workflow` today switches to a fresh Claude review instead; the new workflows follow the first).
- The third-party warning rule applies wherever Antigravity is a side of a run: in an Antigravity session, and on the developer side when Antigravity develops in a Claude- or Codex-led dev workflow, because the leader checks the developer's side too.
- When a host has no subagent or lane tool, its workflows run the lanes one after another and say so, rather than being dropped.
- Cheap test models: Claude `haiku`, Codex `gpt-6-luna`, Antigravity `gemini-3.8-flash-medium` (cost tiers not verified; the spec confirms them).
- Old plan folders: the user plans again in a new folder, because running `mstack-plan` on an approved folder keeps its old start file. Where a new skill meets a value an old version saved (for example an old progress file naming a removed workflow), it stops with a message that names the new workflows and says to plan again; nothing is mapped or resumed silently (AGENTS.md sweep rule 5).
- `mstack-vendors` is required by the six workflows, `mstack-plan`, the plan start file and `mstack-skill-creator`; other skills that start a cross-vendor step today keep their current behavior unless the spec finds they need it.
- The four product skills keep their built-in steps and do not require `mstack-vendors`, because AGENTS.md forbids them a required skill. `mstack-evidence` and `mstack-decisions` stay same-vendor only. Whether the built-in cross-vendor reviewer of `mstack-product-plan` and `mstack-epic` learns Antigravity, for documents with no evidence or decisions source, direct or inherited, is left to the spec.
- The brief goes in `docs/briefs/`, which the repository already uses and does not ignore; it is not committed until the user asks.

## Open questions

- Can `agy plugin install` install one plugin from a subfolder of a repository address? Answered by a probe during the spec (after asking, because it writes global configuration); it can wait because it changes only the install commands, not the design.
- What does `agy plugin import claude` keep and drop? Answered by a probe during the spec; it can wait for the same reason.
- Do the agent-bridges `claude` plugin and the skill-codex `codex` skill run from inside Antigravity? Answered by a probe during the spec; the design holds either way: an agent-bridges `claude` plugin that cannot load blocks the pull request until it is fixed in agent-bridges, and skill-codex, a third-party project, falls under the warning rule.
- What are Antigravity's question tool, subagent tool, web search and page-reading tools, and skill folders, for the host tables and for `mstack-research`? Answered from Antigravity's documentation and a probe during the spec.
- Are the cheap test models the cheapest of each vendor? Answered by `mstack-best-model-for` and the vendors' pricing pages during the spec.

## Left to the spec

- The exact called message and result block of `mstack-vendors`, and how it detects each vendor in each host.
- The command per vendor and host for a code review, a plan review and a developer run, including how the leader waits for and collects results, and what happens to jobs an older bridge started.
- How the findings of two parallel reviewers reach `mstack-receive-review` together, unmerged and with their sources, so it merges duplicates and settles conflicts as it does today.
- The section layout of the six workflows and which reference files they share.
- The Antigravity column of every host table, and the Antigravity column of `mstack-best-model-for`'s table.
- The `check-marketplace.mjs` and `agy plugin validate` changes, the eval cases per skill, and the end-to-end test of each workflow.
- Which old saved values a new skill meets (for example an old progress file) and the message it prints. An old `execute-plan.md` keeps working in inline mode; its workflow choices fail at the install step because those plugins are gone, and README says to plan again in a new folder.
- Whether the built-in cross-vendor reviewer of `mstack-product-plan` and `mstack-epic` learns Antigravity.
- How the check scripts handle plugins for Antigravity only, and what they do on a machine or CI without `agy`.
- What `vendor: both` means in `mstack-best-model-for` once there are three vendors, and how a capped or stepped effort maps to Antigravity's model ids and `--effort` flag.
- A trace check for `mstack-anonymize` that reads Antigravity's trace format and fails on zero tool calls and on any tool name it does not know, so its privacy guarantee holds in every host.
- What `mstack-research`'s reader agent does in Antigravity, given its Claude Code tool names.
- How `mstack-vendors` learns which provider's model is running in each host, and what happens when an Antigravity session leads on a non-Gemini model.
- How sign-in is confirmed per vendor (`claude auth status`, `codex login status`, a small first run for `agy`), and the per-job availability cases, such as Codex available to review but not to develop in Claude Code when the OpenAI Codex plugin is missing.
- The mechanism that keeps a writing developer from publishing (a linked worktree shares refs and remotes; a before-and-after ref check misses a push to an explicit address; one candidate is a scratch clone with no remote and no push credentials), and the risk that is left.
