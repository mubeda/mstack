---
name: mstack-find-skills
description: Use when the user asks "is there a skill for this", "find me a skill for X", "which skills help with this task", "search skills.sh", or wants to install a skill for a job, or when another mstack skill needs the installed skills that fit its tasks or work items (a plan's phases, a workflow's lanes, a skill being created). Works in Claude Code and Codex. Returns the matching installed skills per item with a reason, and vetted public candidates from skills.sh for the gaps.
---

# mstack-find-skills

Finds the skills that fit a job: installed skills first, then vetted public candidates from the skills.sh directory for the gaps only. Every other mstack skill takes its skill matches from here.

| Role | Claude Code | Codex |
|---|---|---|
| Question tool | AskUserQuestion | a numbered question in chat, then wait |
| Loading another skill | the Skill tool | read its SKILL.md |

## Two modes

- **User mode**: the user invoked the skill. If they gave a text, that text is the one work item; do not ask what they need. If they gave nothing, ask one question about the job with your question tool and wait. Search nothing until the answer arrives.
- **Called mode**: another skill loaded this one and said which skill is calling. Ask nothing and install nothing, ever. Return one result block entry per work item, in the order given.

A called message lists work items, each with an ID, a goal, and optionally files and steps. An optional line `Also read: <folders>` names folders whose `SKILL.md` files join the inventory although they are not installed, such as a repository's own plugin folders. Two optional input lines change the run:

- `Online search: off (<reason>)`, or a message saying the network is unavailable: run no online step, and close with `Online search: not run (<reason>)`.
- `Install: <owner/repo>@<skill>` lines, one per candidate from an earlier result, in user mode: skip the inventory and the search, and go straight to `references/install.md` with those candidates.

## Order of work

1. **Inventory.** Read `references/matching.md` and build the list of installed skills for this host, then add the `Also read` folders. Mark each skill `loads now`, `loads in a new session` or `repository, not installed`.
2. **Score.** Score every skill against every item with the rules in `references/matching.md`. Keep at most four per item. An empty list is a valid answer.
3. **Gaps.** Mark the items with a clear domain and no match. An item that needs no specialist is not a gap.
4. **Search and vet.** Only for gaps, follow `references/public-search.md`. Recommend at most two candidates per gap, each vetted on audits, installs and age, license and its SKILL.md. When the search fails, report it as not run; never conclude that no public skill exists.
5. **Report.** Write the result block below.
6. **Install, user mode only.** When the user wants a candidate, follow `references/install.md`: one round of questions, then only the selected commands. In called mode, stop after the result block.

## Result block

```text
## mstack-find-skills result

### <ID>
Skills:
- <name> (<where installed>, <loads now | loads in a new session | repository, not installed>): <reason of six to twelve words>
Gaps:
- <what is missing> (searched: "<query>", "<query>")
  - <owner/repo>@<skill>: installs <N>, first seen <date>, audits <vendor verdict (categories), ... | not audited>, license <license>, <skills.sh link>
    Install: <the commands from references/install.md>

Online search: ran | not run (<reason>)
```

Write `Skills: none` or `Gaps: none` when a list is empty. Write one `### <ID>` section per item, in the caller's order. In user mode, the item ID is `1`.

Never report a candidate whose audit could not be read from its skills.sh pages as passed; it reads `not audited`. A candidate with a `fail` verdict or without a license is never recommended.
