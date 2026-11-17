---
name: mstack-auto
description: Use when the user hands a job to mstack as a whole without saying which skill, such as starting this skill with a prompt, "use mstack for this", "let mstack pick", "mstack, do this", "which mstack skill fits this" or "which mstack skill should I use". Works in Claude Code and Codex. Not for a plain work request that mentions neither mstack nor this skill. Starts the one mstack skill that fits the prompt, after one line that says which skill and why.
---

# mstack auto

You pick the mstack skill that fits the user's prompt and start it. You choose from the routing table below, say which skill you chose and why in one line, and load it with the prompt as the user wrote it. The loaded skill does the job. You never do it yourself.

## Host tools

This file is the same on both hosts. It names roles, and this table says what plays each role.

| Role | Claude Code | Codex |
|---|---|---|
| This host | Claude Code | Codex |
| Your question tool | `AskUserQuestion` | A numbered question in chat, then wait for the reply |
| Loading a skill | The Skill tool, by the name the session lists, with the user's prompt as its arguments | Read the skill's SKILL.md and follow it, with the user's prompt as the request |
| The skill folders on disk | In the project `.claude/skills/` and `.agents/skills/`; for the user `~/.claude/skills/`, `~/.agents/skills/`, and the plugin cache `~/.claude/plugins/cache/`, but only under a plugin that `claude plugin list` shows as installed, because the cache keeps leftover copies (`CLAUDE_CONFIG_DIR` replaces `~/.claude`) | In the project `.agents/skills/` and `.codex/skills/`; for the user `~/.codex/skills/`, `~/.agents/skills/`, and the plugin cache `~/.codex/plugins/cache/`, but only under a plugin that Codex has enabled in its `config.toml` (`CODEX_HOME` replaces `~/.codex`) |

A skill is available when this session's skill list holds it, as `<name>` or `<plugin>:<name>`. Nothing else counts, because only a listed skill can be loaded now.

## Before anything else

Check `mstack-find-skills`, the one skill this skill requires. Do this before you read the prompt for a match.

1. It is available: continue.
2. It is not available, but a folder named `mstack-find-skills` with a SKILL.md exists in the skill folders on disk: it was installed after this session started. Say that a new session is needed, and stop.
3. Otherwise print this and stop, with nothing chosen and nothing loaded:

   ```text
   mstack-auto needs mstack-find-skills, which is not installed.
   Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install mstack-find-skills@mstack
   Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add mstack-find-skills@mstack
   Skills CLI:  npx skills add mubeda/mstack --skill mstack-find-skills -g -a <claude-code|codex> -y
   Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
   Then start a new session.
   ```

## Routing table

One row per mstack skill. "Next in its chain" names the skill that takes this one's result as its input. "On the other host" is filled only for a skill that runs on one host.

| The prompt is about | Skill | Runs in | Next in its chain | On the other host |
|---|---|---|---|---|
| An idea with no agreed goal or reason yet, or a wish for ideas and options | `mstack-brainstorm` | both | `mstack-write-specs` | |
| A request for a spec, a PRD, requirements or a design document, or something to build or change that is too large or too undecided to do directly. Not a small edit whose result is already clear | `mstack-write-specs` | both | `mstack-plan` | |
| An approved spec that needs an implementation plan: phases and tasks, not yet any code | `mstack-plan` | both | this host's review workflow | |
| Work ready to deliver in a repository with writer agents and a Codex review: a plan folder, a list of issues, or one larger task. Also a request for a Codex review of agents' work, or for CI runs handled one after another | `mstack-codex-review-workflow` | Claude Code only | | `mstack-claude-review-workflow` |
| The same delivery, when the user says Codex is to write the code and Claude manages, reviews and commits it | `mstack-claude-pm-codex-dev` | Claude Code only | | `mstack-claude-review-workflow` |
| Work ready to deliver in a repository with Codex writers and a Claude review: a plan folder, a list of issues, or one larger task. Also a request for a Claude review of Codex work, or for CI runs handled one after another | `mstack-claude-review-workflow` | Codex only | | `mstack-codex-review-workflow` |
| Something broken whose cause is not known and is to be found: a crash, a wrong result, a failing or flaky test, a regression, a slowdown, a hang, a failing CI run. Not a request to report a known problem as an issue | `mstack-diagnose` | both | | |
| Open issues or a backlog to sort: what to do now, next or later, duplicates, the next batch | `mstack-backlog-triage` | both | | |
| A problem, a change or a deferred follow-up that is already known and is to be written up as one issue in a tracker: filing an issue, opening a ticket, reporting a bug | `mstack-write-issue` | both | | |
| Review feedback that has arrived and has to be acted on: reviewer output, bot findings, pull-request comments | `mstack-receive-review` | both | | |
| A session that is ending or pausing with work left, or work to continue from a handoff file | `mstack-handoff` | both | | |
| A goal that takes many sessions and needs one owner who keeps its decisions and history | `mstack-chief-of-staff` | both | | |
| An answer or report the user could not follow and wants in plain words, or a wish for simple answers from now on | `mstack-explain-me-better` | both | | |
| A product-level plan with no code: an initiative split into ordered epics, for product or management people | `mstack-product-plan` | both | `mstack-epic` | |
| One epic to detail for developers, from a product plan or from chat, with no code | `mstack-epic` | both | `mstack-write-specs` | |
| Customer feedback (support tickets, interview notes, survey answers) and what it shows | `mstack-evidence` | both | | |
| Meeting notes or a transcript, and the decisions, action items and open points in them | `mstack-decisions` | both | | |
| A file or a text whose personal, customer or company identifiers are to be replaced before it is given to a model or to other people: anonymizing, redacting or cleaning data. Not what the data shows or what was decided in it | `mstack-anonymize` | both | | |
| A web page, a screen, a component, a form or a layout to build, restyle, polish or review for how it looks, behaves and can be used, small changes of that kind included. Not native apps, images or server code | `mstack-web-ui` | both | | |
| A new agent skill to create, or an existing one to fix, improve, test or benchmark | `mstack-skill-creator` | both | | |
| Which installed or public skill fits a job, or installing a skill that was found | `mstack-find-skills` | both | | |
| A question to answer from the web, forums or official documentation, or what a package's documentation, changes or known fixes say for the version in use | `mstack-research` | both | | |
| Which model and effort to use for a task, a subagent or a reviewer | `mstack-best-model-for` | both | | |
| Setting up mstack, or a dependency an mstack skill reported as missing | `mstack-setup` | both | | |

## Choose

Work through these rules in order. Each one says what the user sees.

1. **No prompt.** The user started this skill with nothing to do. Ask one question for the job with your question tool, and wait. Never take a job from earlier messages of the conversation.
2. **A question about the skills, with no job.** The user asks which mstack skills exist or what they do, and gives no job: answer with the skill names of the table and one line each, and load nothing. This holds even when the question mentions a skill by name.
3. **A skill the user asks to run.** The prompt asks for one mstack skill of the table by name ("use mstack-diagnose on this"): that skill is the choice. A skill that is only mentioned is not a choice. `mstack-auto` is never a choice: when the prompt names this skill, ignore the name and choose for the job.
4. **Two unrelated jobs in one prompt.** Apply rules 5 to 10 to the first job only. After the announcement line, add one sentence that names the second job and its skill, for afterwards.
5. **Read the job, by meaning.** A prompt in another language is matched the same way. Collect the rows whose first cell describes this job. A skill that merely sounds near does not fit, and a small edit whose result is already clear fits no row, unless a row names small changes of that kind.
6. **One delivery row at most.** When more than one of the three delivery rows was collected, keep one of them and every other collected row. Keep `mstack-claude-pm-codex-dev` when the prompt says Codex is to write the code while Claude manages and reviews it, on either host (in Codex, outcome 1 below handles it). Otherwise keep this host's review workflow: `mstack-codex-review-workflow` in Claude Code, `mstack-claude-review-workflow` in Codex. Never ask the user to choose between delivery rows.
7. **Several collected rows are links of one chain.** The chains are `mstack-brainstorm`, then `mstack-write-specs`, then `mstack-plan`, then the delivery row; and `mstack-product-plan`, then `mstack-epic`, then `mstack-write-specs`. Keep only the earliest link whose input the user does not have yet.
   - The user has an input only when the artifact exists and is approved. An idea with no stated goal has nothing: `mstack-brainstorm`. A goal that is clear but not written and agreed: `mstack-write-specs`. An approved spec the prompt names: `mstack-plan`. An approved plan the prompt names: the delivery row.
   - A named draft goes to the skill that writes that kind of document, which continues it: a draft brief to `mstack-brainstorm`, a draft spec to `mstack-write-specs`, a draft plan to `mstack-plan`.
   - Work at product level with no code (an initiative, epics, a product or management person asking) belongs to the product chain. "Plan" with a spec or code in view belongs to the development chain.
8. **Exactly one row is left.** That skill is the choice. Do not ask the user to confirm it.
9. **Several rows are left.** They are not links of one chain, so this is a real tie. Ask one question with your question tool that lists each remaining skill with one line on what it would do, and load nothing before the answer. Example: "process the backlog" fits sorting it (`mstack-backlog-triage`) and delivering it (the delivery row).
10. **No row is left.** There is no choice. Go to outcome 4 below.

## Then

Exactly one of these four outcomes follows. Check them in this order, because the order matters: a skill of the other host is never reported as missing.

1. **The chosen skill runs only on the other host** (its "Runs in" cell names the other host). Say so in one line. Ask, with your question tool, whether to load the skill in its "On the other host" cell instead, and say in one line what that skill does differently (who writes the code, who reviews it). Do not say the chosen skill is not installed, and do not name `mstack-setup`: no install makes it run here. On a yes, continue with that skill at outcome 2. On a no, stop.
2. **The skill to load is not available in this session.** Name it as the skill that fits. Say that it is not available in this session, that `mstack-setup` installs it, and that a new session picks it up. Then stop. Print no announcement line, and load no other skill in its place.
3. **The skill is available.** Print this as the first line of your answer, before anything else:

   ```text
   mstack-auto: <skill>, because <reason in a few words>.
   ```

   When the skill's row names a next skill in its chain (for the delivery link, this host's review workflow), name it in that same line, after the reason: `mstack-auto: mstack-brainstorm, because the idea has no agreed goal yet; mstack-write-specs comes next.` Then load the skill with the user's prompt unchanged. Load it as the user's own request: never say that a skill is calling, because several mstack skills then switch to a mode that asks nothing and returns a result block. Once the skill is loaded it has the conversation: add no step, summary or check after it.
4. **No mstack skill fits.** Say in one line that no mstack skill fits the job. Then load `mstack-find-skills` the same way, as the user's own request, with the prompt as its text. It looks across every installed skill.

## Never

- Do the prompt's job yourself, in any outcome, including when no skill fits or the fitting one is missing.
- Install anything, write a file, commit or push.
- Load a skill in its called mode, or tell it which skill loaded it.
- Rewrite, shorten or add to the user's prompt before it reaches the loaded skill.
- Pick the nearest-sounding skill so that there is a match.
- Ask the user to confirm a choice the rules above already settle.
