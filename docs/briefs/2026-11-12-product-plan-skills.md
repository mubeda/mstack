# Design brief: Product-level planning skills (mstack-product-plan and mstack-epic)

Status: Approved 2026-11-12 (approved in chat by the user)
Size: project
Source: conversation 2026-11-12. Research: `reports/Product plan skill research.md` (local, not committed).

## Intent

A product manager who tried `mstack-plan` liked its interview (rounds of questions until everything is settled) but found that its result is a developer's document. Product and management people need the same kind of interview one level higher: they describe an initiative, and the result is a set of epics that developers later use as detailed input for a spec and a plan. The documents contain no code and no development steps. After this work, a product person owns what gets built and why, and a developer owns how.

Two new skills do this:

- `mstack-product-plan` interviews about one initiative and writes one product plan: the initiative, then a short section per epic, in order.
- `mstack-epic` takes one epic of an approved product plan, interviews it in depth, and writes one detailed epic document that `mstack-write-specs` accepts as its source.

## Goals, non-goals and anti-goals

Goals:

- A product person can finish a product plan alone, with no repository and no developer in the room.
- Each detailed epic lets a developer start `mstack-write-specs` without asking the product decisions again.
- Both skills run in four hosts: Claude Code, Codex CLI, the Claude desktop app and the ChatGPT desktop app.
- The interview keeps the form the user liked: numbered rounds, a recommendation with each question, a plain yes accepts it, and it runs until no decision is open.

Non-goals:

- No code, no technical design, no tasks, no estimates in hours or days.
- No export to a tracker. A skill that already does that can read the documents.
- No start file that runs the build chain, and no status table that later steps update. The user chose the second-opinion review only.
- No change to what `mstack-plan` or the three workflows do.

Anti-goals:

- A document that prescribes the solution, so developers have nothing left to decide.
- A document a developer cannot write a spec from, because acceptance, scope or constraints are missing.
- A skill that stops in a desktop app because another mstack skill is not installed.
- Questions in developer words (endpoint, schema, migration) put to a product person.

## Constraints

- Four hosts (the user's decision). The desktop apps load a skill as one uploaded folder, have no plugins, no repository by default, no question tool and no subagent tool (web search of the vendors' help pages, 2026-11-12; not tested by this project). So each skill is one self-contained folder, questions are numbered rounds in chat on every host, and every other mstack skill is optional.
- `AGENTS.md`: a skill folder holds everything the skill uses; no personal or company data; adapted text is rewritten and credited in the skill's notices file; nothing is copied from a source without a license; model names appear only in `mstack-best-model-for`.
- The repository's skills name host tools only inside a host table. The table of these two skills has four columns.
- The research found no existing skill that combines an interview until settled, a split into several epics and no development content. Anthropic's `write-spec` (Apache-2.0) and a BMAD-derived skill (MIT) may be adapted with credit. The `prd-development` skill's license was not checked, so nothing is taken from it. Shape Up and opportunity solution trees are copyrighted texts: ideas only, in this project's words.
- The research (preprints with simulated users) found that AI interviewers miss many unstated requirements and ask their best questions late, that a list of interviewer mistakes improves questions, and that a check against a written quality list agrees well with human raters. The skills use several rounds, such a list, a checklist read, and a visible list of open questions.

## Approaches considered

- A. One skill, `mstack-product-plan`, with every epic's detail in one document. Fastest to ship; a large initiative makes one very long document.
- B. No new skill: a product mode inside `mstack-brainstorm` and `mstack-write-specs`. Nothing new to install, but both skills are written for developers and read code first, and each would carry two audiences and two sets of hosts.
- C. Two skills, `mstack-product-plan` and `mstack-epic`. Scales to large initiatives and lets different people detail different epics; two skills to build, test on four hosts and explain.

Picked: C, by the user.

## Tradeoffs accepted

- Two skills instead of one: more to build and explain, in exchange for short product plans and one document per epic.
- One decision in many places (design red flag): the opening lines and section headings of the product plan and the epic are read by `mstack-product-plan`, `mstack-epic` and `mstack-write-specs`. Cost: a format change touches three plugins. Kept, with one shared format reference file that ships identically in the plugins that read it and a check in `check-marketplace.mjs`, as `plan-format.md` is handled today.
- Lists kept in step by hand (design red flag): two new plugins add rows to the README table, the install lists, `mstack-setup`'s dependency list, `mstack-chief-of-staff`'s route table and both registries. Cost: the usual sweep; the repository's checks catch the registries and manifests only.
- Built-in short versions of steps that other mstack skills do better (finding the reason, processing a review): some repeated rules, in exchange for working alone in a desktop app. Each skill says when it used a built-in version.
- In a desktop app the second opinion is a fresh read by the same model, which tends to miss more than another vendor's review. The document records which kind of review it had.
- The desktop apps are supported on the strength of their documentation. Until someone runs the skills there, the README says they are untested in those apps.

## Decisions

### Decided by the user

- The skills work with no repository open and never ask about code (round 1).
- The product plan is one Markdown document: the initiative, then its epics (round 1).
- Each epic carries its outcome, who it is for, scope and non-goals, acceptance in business terms, priority, dependencies and open questions for developers; a few user stories at most; no tasks (round 1).
- Each epic is the input of `mstack-write-specs`, which feeds `mstack-plan` (round 1).
- Epics are ordered as now, next and later, each with a one-line reason; no scoring formulas (round 2).
- Each epic has one measurable result, or says it is not measurable yet and why (round 2).
- A fresh read asks whether a developer could write a spec from the document and lists what is missing; a human developer review is optional and never a gate (round 2).
- The first skill is named `mstack-product-plan` (round 2).
- Hosts: Claude Code, Codex CLI, the Claude desktop app and the ChatGPT desktop app.
- The skills may call any other mstack skill; when one is missing, they do a short built-in version of that step and say so. Further mstack skills may be created if this work needs them.
- Sources: inside a git repository the skill reads its documents without asking; on every host it then asks once for further folders, files, links or attachments.
- Approach C: two skills.
- Before approval, the other vendor's model reviews the product plan and each detailed epic, as `mstack-plan` has its plan reviewed; where no second vendor is available, a fresh read by the same model replaces it and the document says so.
- The two desktop apps are a best effort: the folders are written to work there and the README explains the upload; no extra packaging or checks until an upload test shows what is needed (approval message, accepting the recommendation).

### Agent's calls

- The second skill is named `mstack-epic`. Reason: it says what comes out, like `mstack-plan`.
- Each epic has a rough size (small, medium or large) set by the product person, with a one-line reason, and no prescribed solution; ideas the team already has go in one optional line. Reason: the research's clearest boundary between product and engineering work; proposed to the user and not answered.
- Opening lines: `# Product plan: <title>` and `# Epic: <title>`, each followed by a `Status:` line with the same Draft and Approved forms as the design brief. Reason: `mstack-write-specs` already recognizes a brief this way.
- Approval is an explicit yes to the written file; any later edit sets it back to Draft. Reason: every other mstack document works this way.
- `mstack-write-specs` learns to treat an Approved epic as it treats an Approved brief: its decisions are settled, its open questions for developers join the interview. A Draft epic is context only. Reason: without this the hand-off the user chose does not work.
- Where the files go: a place the user names; otherwise in a repository `docs/product/<yyyy-mm-dd>-<slug>/product-plan.md` with detailed epics beside it as `epics/<nn>-<slug>.md`; outside a repository the current folder, or the chat itself when the host cannot write files. Reason: one folder per initiative keeps a plan and its epics together.
- When the request is an unformed idea, the skill uses `mstack-brainstorm` if installed, else asks its own open questions until the reason is known. Reason: that skill already does this.
- The review's findings are processed with `mstack-receive-review` when installed, else by built-in rules: verify each finding, fix facts, keep product decisions for the user. Reason: same rule as `mstack-plan`, without making the skill a requirement.
- The reviewer's model and effort come from `mstack-best-model-for` when installed; otherwise the host's default, and the skill says so. Reason: no model name may be written into these skills.
- The open questions for developers are whatever the product person does not know or does not want to decide; the interview collects them and never asks about technical feasibility. The list may be empty. Reason: the product person may have no developer to ask, and a developer review is never a gate.
- In `mstack-write-specs`, an Approved epic's scope, non-goals, acceptance and measurable result count as settled decisions, as a brief's decisions do; the spec's own interview turns them into requirements and scenarios. Nothing is mapped mechanically, so the shared contract is the opening lines and the heading names only. Reason: a parsing contract would break on every format change.
- The rough size is advisory: it goes into the spec as context, and nothing refuses an epic that grows. It does not decide the now, next and later order. Reason: the product person sets it without knowing the code.
- The built-in short versions are an exception for these two skills, because they must run where no plugin can be installed. `AGENTS.md` says so in its shared-skills section, and the rule for every other skill stays as it is. Reason: the user chose the built-in versions; the repository's rule would otherwise forbid them.
- `mstack-epic` also accepts an epic described in chat, without a product plan. Reason: a small initiative is one epic, and the first skill would be one step too many.
- The two skills ship in one pull request, `mstack-product-plan` first. Reason: the shared format file and the `mstack-write-specs` change belong to both.
- Both skills are built with `mstack-skill-creator` as plugin targets, with its comparison test. Reason: the repository's normal route.

## Open questions

- Do both desktop apps load and run these skills as documented? Answered by a manual upload test by the user once the skills exist. It can wait, because the folder format is the same on all four hosts.
- Does the ChatGPT desktop app need extra metadata beside `SKILL.md`? Answered during the spec by reading its documentation. It can wait, because it adds a file and changes no behavior.
- May anything be adapted from the `prd-development` skill? Answered by reading its repository's license during the spec. It can wait, because the design uses none of its text.

## Left to the spec

- The exact sections and headings of the product plan and of the detailed epic, and the shared format file.
- The interview: the coverage list for a product person, the list of interviewer mistakes, and when the interview ends.
- The checklist of the fresh read, and how its result is shown.
- How the cross-vendor review is started on each host, and what the document records about it.
- The built-in short versions, one per optional mstack skill, and the sentence that announces each.
- What `mstack-write-specs` does with each part of an epic, and with an epic written by a later format.
- How each skill behaves when the host cannot read or write files.
- The install instructions for the two desktop apps, the plugin versions and the marketplace version.
- The eval cases, including one with no repository and one with no other mstack skill installed.
