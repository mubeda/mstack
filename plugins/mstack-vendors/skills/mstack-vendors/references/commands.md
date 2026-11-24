# Commands and steps

Read this after the rows of every section are decided and before you write the block. It gives the Command cell of each available `reviewer` and `developer` row and the numbered lines of each section's `Steps`. Read this first part, the part of your host, and of the last parts the ones your sections need: `## Two reviewers`, `## A run that fails` and `## The fallback review` for a review, `## A developer in a copy` and `## A Codex developer` for a developer job. The steps are written for the calling skill: it follows them after the block, so write them as orders to it.

How to fill a command or a step line. Write a command into its cell whole, as one line: never shorten it, never put `...` into it and never put words around it. Replace every name in angle brackets, and leave exactly two: `<prompt file>` and `<scratch file>`, which the caller fills when it runs the command. A `developer` section is the one exception: its Command cell and its steps also keep the names of values that exist only while the caller works, and the caller fills them as the steps give them: `<copy>`, `<gitConfig>`, `<base>`, `<source>` and `<plan>` (printed by `dev-copy.mjs make`), `<plan folder>`, `<patch file>`, `<previous patch>`, `<session id>`, `<thread>`, `<phase-id>` and `<job-id>`. No other name stays. This holds for lines of another part that you put into a step line too, such as the fallback lines of your host: fill every name in them, `<skill folder>` and `<workspace>` included, before you write them.

- `<channel>`: the `channel` value of the vendor check's line for that vendor and job, the absolute path of the client.
- `<model>` and `<effort>`: the vendor's entry on the group's `Models` line. For `claude` the model must be a full model id, because an alias can run another model than the one it names; pass on what the caller sent and change nothing.
- `<workspace>`: the caller's `Workspace` line, as it was written.
- `<skill folder>`: the absolute path of this skill's folder.
- `<job>`, `<writers>`, `<vendor>`: the section's job, its `Writers` line and the row's vendor.

The caller may run a command with a worktree of the same repository in place of the workspace path, after `git worktree list` showed that worktree. It changes nothing else in a command.

Values that cannot go into a command. Every value is put into the command as text, so a value with one of the characters `"`, `$`, `` ` `` or `|`, or outside Windows `\`, would change what the command does. Never escape such a value by hand:

- A workspace path with one of them: a path with one of the characters `"`, `$`, `` ` `` or `|` is not supported, and outside Windows a path with `\` neither. The vendor check refuses such a path: it exits 2 with a message that ends `is not supported`, so by rule 10 of `references/result-block.md` every `reviewer` and `developer` row is `not available` with the reason `availability check failed: ` and that message, every `|` in it written as `/`. A worktree path with one of them is not used in place of the workspace.
- A model or an effort on the `Models` line with one of them: that vendor's row is already `not available` by "State and Reason" of `references/vendor-rules.md`, and has no command. A model the user names after a rejected model is held to the same rule: with one of them, the run is not repaired.
- A scratch, prompt, patch or copy path is chosen by the caller or printed by a script. Choose them without these characters. The scratch folder of the host table must have none of them, and a copy path that `dev-copy.mjs make` prints with one of them is a reason to stop and report it.

**The `codex` review command**, for a `codex` row with the role `reviewer`:

```text
"<channel>" exec -m <model> --config model_reasoning_effort="<effort>" --sandbox read-only -C "<workspace>" - < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
```

The sandbox `read-only` lets the reviewer read and run commands that change nothing. Its findings are the text it writes to `<scratch file>`.

**The `claude` review command**, for a `claude` row with the role `reviewer`:

```text
cd "<workspace>" && "<channel>" -p --safe-mode --model <model> --effort <effort> --output-format json --permission-mode plan --tools "Read,Grep,Glob" --settings '{"advisorModel":"off"}' < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
```

Copy it whole, from `cd` to the last redirect: the run must start in the workspace. Claude Code loads the user's own setup (hooks, plugins, settings) unless these flags are used: that costs more, may run another model than the one asked for, and puts other text into the result. The last flag switches off the advisor of the user's own settings, which `--safe-mode` leaves on and which can start a second, dearer model. The three tools are reading tools: the run gets no tool that writes a file and none that runs a command, so it can change nothing. It can still read files outside the workspace. The run prints one JSON object: the findings are its `result` field, and its `modelUsage` names every model that ran.

A row that is `not available`, a `leader` row and a `fallback` row get an empty Command cell. An available `developer` row gets the command of `## A developer in a copy` (`claude`) or `## A Codex developer` (`codex`).

**The steps of a section that recommends reviewers.** Write these lines after `Steps:`, each on its own line, numbered from 1, in this order. Leave out a line whose condition in square brackets does not hold, and leave out the square brackets.

```text
Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of "<skill folder>/references/review-prompt.md", whole, then the work to review (for a code review the diff; for a plan review the plan's files, named by their paths inside the workspace). The absolute path of that file is <prompt file>, the same file for every reviewer.
[host antigravity] Before you request the first reviewer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each reviewer run starts outside the sandbox, so the client will ask you to approve each one."
[host antigravity] Request a run outside the sandbox from the client for each reviewer command, one request per run. A run the user did not approve is a failed run with the reason "the run outside the sandbox was not approved": it is not a clean review and not a missing client, and it is not started another way.
Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path, one file per reviewer), with the shell's longest time limit and not as a background job you leave behind. Do not report and do not finish before each command completed and you saw its output.
[two reviewers named by the Recommend line] Run them one after the other, each with its own request outside the sandbox, and keep each run's exit code and output apart: the second run starts after the first completed, whatever the first returned.
[codex named by the Recommend line] The findings of codex arrive as the text of its <scratch file>.
[claude named by the Recommend line] The findings of claude arrive in its <scratch file> as the `result` field of one JSON object. Compare the keys of its `modelUsage` with the model asked for, the one after `--model` in its command: a run on another model is a failed run with that reason.
A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none. A non-zero exit, an empty answer, an `is_error` that is true or an answer that is only an error message is a failed run, never a clean review.
Repair a failed run once, and only where this line says how. A rejected effort: run it once more at the next lower effort of low, medium, high, xhigh, max; when none is lower, make no retry. A rejected model: ask the user once which other model to use, and end your turn on that question: before the answer nothing more runs for that vendor and no fallback review starts; with the answer, run that vendor's command once more with the model the user named in place of the rejected one. Every other cause (a sign-in or network error, a run that was not approved, another model in `modelUsage`, an empty answer): no retry. Judge a repaired run by the line "A run counts as a review only when" above: a repaired run that counts is a review like any other. A run is reported as failed, with its reason, only when no repair applies, when its repair failed too, or when the user named no other model.
Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged, also when two reviewers report the same finding: the lines `Review: <job> by <vendor>`, `Writers: <writers>` and `Reviewer vendor: <vendor>`, then the reviewer's answer unchanged.
[Workflow review, or a plan review] When no reviewer's run counts and no question about a rejected model is open, do not stop: tell the user "No other vendor returned a review, so this is a fallback review by this session's own vendor.", then run the fallback review: <the fallback lines of your host, joined into this line>
[Workflow dev] <the line of `## A run that fails` for a dev workflow>
```

In a section of a dev workflow, put this line first: `Your own review as the leader is the review of this section, and it always runs. Hand it to mstack-receive-review with the lines Review: <job> by the leader, Writers: <writers> and Reviewer vendor: <the Leader line>.` When the section recommends `the leader's review` alone, it is the only line, numbered 1 like any first line.

**The steps of a developer section.** A `developer` section with one available row gets the steps of that vendor's part below, numbered from 1, each on its own line. With two available rows (only on the host `antigravity`), the first line is `Ask the user which vendor develops, claude or codex, and follow only the lines of that vendor.`, then the lines of `## A developer in a copy`, each starting with `If claude develops: `, then the lines of `## A Codex developer`, each starting with `If codex develops: `, all numbered in one list. On the host `antigravity` the two `[host antigravity]` lines of `## Antigravity` come first, after that question when there is one. Leave out a line whose condition in square brackets does not hold, and leave out the square brackets. A section whose `Recommend` line says `no developer here` keeps the `Steps` text of `references/vendor-rules.md`.

## Claude Code

The only reviewer this host can list is `codex`. Its command is the `codex` review command above. The fallback lines of this host are in `## The fallback review`.

The only developer this host can list is `codex`, through the OpenAI Codex plugin: `## A Codex developer`, the part for Claude Code.

## Codex

The only reviewer this host can list is `claude`. Its command is the `claude` review command above. Add this sentence to the line that runs the Command cell: `Run it as an approved command, because it needs the network and writes under the home folder.` The fallback lines of this host are in `## The fallback review`.

The only developer this host can list is `claude`: `## A developer in a copy`. Its line that runs the Command cell carries the same sentence about an approved command.

## Antigravity

This host can list `claude` and `codex`, each with its command above. The sandbox of the client does not show a program installed under the home folder, so every run of `claude -p` or `codex exec` runs outside it, and the client asks the user to approve each one: that is why the two lines marked `[host antigravity]` belong to every section with a reviewer command here. Keep three outcomes apart: a run that was approved and returned a review, a run that was approved and failed, and a run that was not approved. The last one is a failed run with the reason `the run outside the sandbox was not approved`, never a clean review and never a missing client. The session is told when a command completes; it does not report before that. The fallback lines of this host are in `## The fallback review`.

This host can list `claude` and `codex` as developers: `## A developer in a copy` and `## A Codex developer`, the part for Antigravity. The rule above holds for every developer run too, a fix round included: the steps of a developer section start with the two lines marked `[host antigravity]` below, and a developer run the user did not approve is a failed round with the reason `the run outside the sandbox was not approved`.

```text
[host antigravity] Before you request the first developer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each developer run starts outside the sandbox, so the client will ask you to approve each one."
[host antigravity] Request a run outside the sandbox from the client for each developer command, one request per run, fix rounds included. A run the user did not approve is a failed round with the reason "the run outside the sandbox was not approved": it is not started another way.
```

## Two reviewers

Two reviewer rows are available only on the host `antigravity`, and both run only when the `Recommend` line names both: in a dev workflow it names one. Both review the same work with the same prompt file. Each run outside the sandbox needs its own approval, so the caller runs them one after the other, each with its own request, keeps each run's exit code and output apart, and hands each answer over on its own, with its own three lines. It never merges two answers, and never drops a finding because the other reviewer reported it too: `mstack-receive-review` gets every finding with its source. When one of the two fails after its one repair, the caller reports that run as failed and the work counts as reviewed by one vendor.

## A run that fails

A failed run is never a clean review. It gets one repair, and only of a cause an agent can fix:

- A rejected effort runs once more at the next lower effort. The order is `low`, `medium`, `high`, `xhigh`, `max`, for both clients. With none lower the run counts as failed and no retry is made.
- A rejected model: the caller asks the user once for another model, and runs nothing more for that vendor, and no fallback review, before the answer. With the answer it runs that vendor's command once more, with the model the user named. A model the user chose earlier is no consent to another one. When the user names no other model, the run counts as failed.

A repaired run is judged like a first run: when it counts as a review, it goes to `mstack-receive-review` like any review. A run stays failed, and what follows below starts, only when no repair applies to its cause, when its repair failed too, or when the user named no other model.
- A sign-in or network error, a run outside the sandbox that the user did not approve, an empty answer, and a `claude` run whose `modelUsage` names another model than the one asked for: failed, with that reason, and no retry.

How a rejection shows. `codex` exits with another code than 0 and names the effort or the model on its error stream, which the command writes to `<scratch file>.err`. `claude` answers a model it does not know with the exit code 1 and a JSON object whose `is_error` is true, whose `modelUsage` is empty and whose `result` says there is an issue with the selected model. `claude` does not reject an effort it does not know: it prints a warning to its error stream and runs at its default effort, so read `<scratch file>.err` and report such a warning with the review.

What follows when no offered reviewer returned an answer depends on the workflow:

- A plan review, or a code review with `Workflow: review`: the fallback review runs, with a warning to the user. Nothing stops and nothing waits for the user.
- A code review with `Workflow: dev`: the leader's review stands. The line for the steps is: `When the reviewer's run does not count, your own review as the leader stands: report the failed run with its reason, and start no fallback review.`

## The fallback review

A fallback review is a fresh, read-only review by the leader's own vendor. Its row has the role `fallback` and an empty Command cell, and its record comes from the table of `references/vendor-rules.md`, like the record of any review row: the writers and the reviewer's vendor decide it, so a fallback by `claude` of work that `codex` wrote is `cross-vendor`. The steps of a section that recommends `a fallback review` are the fallback lines of the host, numbered from 1, each on its own line, and none left out. `<leader>` is the block's `Leader` line.

The block comes first, then the fallback lines: write the whole result block, and only after it run the first fallback line. This holds also when you answer as the calling skill in the same turn, and also when the fallback is the only review the section has.

Host `claude-code`:

```text
Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of "<skill folder>/references/review-prompt.md", whole, then the work to review.
Start one fresh subagent of this session with the `Agent` tool. Give it the path of the prompt file and tell it to read only and to change no file. It has none of this conversation, which is what makes the review fresh.
Hand its answer to `mstack-receive-review` with the lines `Review: <job>, fallback review`, `Writers: <writers>` and `Reviewer vendor: claude`, then the answer unchanged.
```

Host `antigravity`:

```text
Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of "<skill folder>/references/review-prompt.md", whole, then the work to review.
Start one read-only subagent of this same session with `invoke_subagent`, on the subagent tier that inherits this session's model. Give it the path of the prompt file and tell it to read only and to change no file. Never start a second Antigravity session for a review, and never start the Antigravity client from a command.
Hand its answer to `mstack-receive-review` with the lines `Review: <job>, fallback review`, `Writers: <writers>` and `Reviewer vendor: <leader>`, then the answer unchanged.
```

Host `codex`, when the group's `Models` line has no entry for `codex`:

```text
Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of "<skill folder>/references/review-prompt.md", whole, then the work to review.
This run names no model, so it runs on the model the client is configured with, which may differ from this session's model. Run it as an approved command, wait for it, and do not report before it completed: codex exec --sandbox read-only -C "<workspace>" - < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
Read the header at the top of <scratch file>.err, which names the run's model on a line `model: ` and its provider on a line `provider: `. Hand the answer to `mstack-receive-review` with the lines `Review: <job>, fallback review`, `Writers: <writers>` and `Reviewer vendor: codex` when the header says `provider: openai`, or `Reviewer vendor: unknown` when it names another provider or there is no header, then the answer unchanged.
```

Host `codex`, when the group's `Models` line has an entry for `codex`:

```text
Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of "<skill folder>/references/review-prompt.md", whole, then the work to review.
This run uses <model>, a separately chosen model that the caller's Models line named: when it is an expensive model, the caller's question for an expensive model covers this run too. Run it as an approved command, wait for it, and do not report before it completed: codex exec -m <model> --config model_reasoning_effort="<effort>" --sandbox read-only -C "<workspace>" - < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
Hand its answer to `mstack-receive-review` with the lines `Review: <job>, fallback review`, `Writers: <writers>` and `Reviewer vendor: codex`, then the answer unchanged.
```

A fallback run that fails is reported as failed, with its reason, and is not a clean review. The caller then says that the work has no review yet.

## A developer in a copy

A `claude` developer works in a copy that `dev-copy.mjs` makes outside the repository: the tracked files of the current commit and the run's plan files, in a Git repository with no remote and no push address, so a plain `git push` there fails. The copy is a precaution and nothing more: it is not a sandbox. The developer's command allows every shell command, so it can still read and write outside the copy and use the network, and a push to an address typed in full, with the user's credentials on this machine, is not prevented. That is why the brief forbids pushing and the leader reviews every diff before it reaches the checkout. Never run the command in the user's own checkout. A repository with submodules is refused: `dev-copy.mjs make` makes no copy of it, and no `claude` developer runs there.

**The `claude` developer command**, the Command cell of an available `claude` row with the role `developer`. It starts the client in the copy, with `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` pointed at the copy's empty configuration file and every other variable whose name starts with `GIT_` taken out:

```text
cd "<copy>" && env $(awk 'BEGIN{for(k in ENVIRON) if (k ~ /^GIT_/) printf "-u %s ", k}') GIT_CONFIG_GLOBAL="<gitConfig>" GIT_CONFIG_SYSTEM="<gitConfig>" "<channel>" -p --safe-mode --model <model> --effort <effort> --output-format json --permission-mode acceptEdits --allowedTools "Bash" --settings '{"advisorModel":"off"}' < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
```

Copy it whole, from `cd` to the last redirect, and fill only `<channel>`, `<model>` and `<effort>`: `<copy>`, `<gitConfig>`, `<prompt file>` and `<scratch file>` stay as they are, because the copy does not exist yet when you write the block. The flags are those of the `claude` review command, with two changes: `--permission-mode acceptEdits` lets the developer edit files and `--allowedTools "Bash"` lets it run shell commands, its tests and Git included, without a person. No other folder is added to the run. The command needs a POSIX shell with `env` and `awk`, so it does not run in a native Windows shell such as PowerShell or cmd; a Windows form does not exist yet. The run prints one JSON object: the developer's report is its `result` field, its `session_id` is the id a fix round resumes, and its `modelUsage` names every model that ran.

The steps, in this order. `<skill folder>` and `<workspace>` are filled like a command; the other names in angle brackets stay for the caller.

```text
When the work has a plan folder that Git tracks and that has uncommitted changes, commit those plan files, and only those, before anything else. When you may not commit, stop and ask the user. Other uncommitted changes in the checkout are not yours to commit: the next line stops on them.
Make the copy: node "<skill folder>/scripts/dev-copy.mjs" make --cwd "<workspace>" --plan "<plan folder>" (leave out --plan and its value when the work has no plan folder). When it exits 1, stop and report its message: no copy exists then, and no developer runs. A repository with submodules is refused this way. Otherwise keep the values it prints, copy, base, source, plan and gitConfig, outside the copy; they are <copy>, <base>, <source>, <plan> and <gitConfig> below.
Write the developer's brief into a new file outside the copy, with your file tool; its absolute path is <prompt file>. The brief names the plan files by their path <plan> inside the copy and says: work only in this folder; do not push, add no remote, run no git config, make no worktree or submodule, move or link nothing in .git, and do not edit the plan files; commit or leave changes as you like, both reach the leader.
Run the Command cell of the claude row as it is, with <prompt file> and a new file outside the copy as <scratch file>, both absolute paths, because the command changes into the copy first. Use the shell's longest time limit and do not leave it as a background job. Do not report and do not finish before the command completed and you saw its output.
The developer's report is the `result` field of the JSON object in <scratch file>. Keep its `session_id` as <session id> for a fix round. Compare the keys of its `modelUsage` with the model after `--model`: a run on another model, an `is_error` that is true or a non-zero exit is a failed round, never a finished one.
Check the copy after every round: node "<skill folder>/scripts/dev-copy.mjs" check --copy "<copy>". When it prints "ok":false, stop and report what it found to the user, and apply no diff without the user's decision.
Take the round's diff into a new file outside the copy: node "<skill folder>/scripts/dev-copy.mjs" diff --copy "<copy>" --base <base> --out "<patch file>" --plan "<plan>". It holds the developer's commits and its uncommitted and new files alike; its "files" list is what you compare with the files the task may change. Apply the patch file as diff wrote it, and never edit or cut it: a file you do not want is a finding for the next round, or a question to the user.
Round one: put the diff into the checkout with node "<skill folder>/scripts/dev-copy.mjs" apply --checkout "<workspace>" --source <source> --patch "<patch file>". Use no other way to put it there, and never fetch the developer's commits. Keep the patch file outside the copy: it is <previous patch> of the next round. When apply exits 1, stop and give the user its message word for word. A message that says the checkout MAY BE PARTLY CHANGED means that apply's last write failed: pass it on unchanged and tell the user to compare the checkout with git status. Every other message is a refusal before apply wrote anything, and the checkout is as it was.
Review the change in the checkout as the leader. Do not edit the applied files yourself between rounds: a fix goes back to the developer.
A fix round: write the findings into a new brief file outside the copy and run the Command cell again, with --resume <session id> added after --settings '{"advisorModel":"off"}', from the same copy, with a new <scratch file>. Then check and diff as above, into a new patch file, and put it in with node "<skill folder>/scripts/dev-copy.mjs" apply --checkout "<workspace>" --source <source> --patch "<patch file>" --previous "<previous patch>". When apply exits 1, stop, give the user apply's message word for word, end your message with the question what to do with this round, and put the patch in no other way. A message that says the checkout MAY BE PARTLY CHANGED means that apply's last write failed: pass it on unchanged and tell the user to compare the checkout with git status. Every other message is a refusal before apply wrote anything, and the checkout is as it was. When diff answers "no changes", write an empty file outside the copy and apply it as the patch, with --previous.
Commit the reviewed change in the checkout as the leader: apply never stages anything, so stage the files of the diff's "files" list yourself, new files included. Only after that commit: node "<skill folder>/scripts/dev-copy.mjs" remove --copy "<copy>".
```

## A Codex developer

A `codex` developer works in the user's checkout under Codex's own sandbox, `workspace-write`. On the host `antigravity` the command below sets network access off, so a push from it fails. On the host `claude-code` the OpenAI Codex plugin starts the run and nothing passes that setting: the vendor check read the Codex configuration files it names and found no line that turns network access on, but a profile or a setting managed in the cloud can still turn it on. Never turn network access on for a developer, not for a fix round either. The checkout must be clean before the first round, so that the round's change holds only the developer's work.

**On the host `antigravity`**, the Command cell of an available `codex` row with the role `developer`:

```text
"<channel>" exec -m <model> --config model_reasoning_effort="<effort>" --sandbox workspace-write -c sandbox_workspace_write.network_access=false -C "<workspace>" --json -o "<scratch file>" - < "<prompt file>" > "<scratch file>.jsonl" 2> "<scratch file>.err"
```

Its steps, in this order:

```text
Before the first round, run git -C "<workspace>" status --porcelain. When it prints anything, list those paths, ask the user what to do with them, and wait: the developer writes in this checkout, so earlier changes would mix into its change. Never stash, discard or commit them yourself. Then note the commit you start from: git -C "<workspace>" rev-parse HEAD.
Write the developer's brief into a new file in the scratch folder, with your file tool; its absolute path is <prompt file>. The brief says: do not commit and do not push; leave every change in the working tree.
Run the Command cell of the codex row as it is, with a new file in the scratch folder as <scratch file>. Use the shell's longest time limit and do not leave it as a background job. Do not report and do not finish before the command completed and you saw its output.
The developer's report is the text of <scratch file>. The first line of <scratch file>.jsonl is a thread.started event: keep its thread_id as <thread> for a fix round. A non-zero exit or an empty report is a failed round.
Record the tree it left: node "<skill folder>/scripts/codex-dev.mjs" snapshot --cwd "<workspace>". The round's change is git diff between the commit you started from and that tree, new files included.
A fix round: write the findings into a new brief file and resume the same thread, with the same sandbox, model and effort, from the workspace: cd "<workspace>" && "<channel>" exec --sandbox workspace-write -c sandbox_workspace_write.network_access=false resume <thread> -m <model> --config model_reasoning_effort="<effort>" --json -o "<scratch file>" - < "<prompt file>" > "<scratch file>.jsonl" 2> "<scratch file>.err". Then snapshot again.
Review the change as the leader, and commit it yourself.
```

**On the host `claude-code`**, through the OpenAI Codex plugin. Its row is available only when the vendor check said so and this session's agent types list `codex:codex-rescue` (`## Availability` of `SKILL.md`). The Command cell is the prompt of one call of that agent, filled with the model and the effort:

```text
--background --fresh --model <model> --effort <effort> Read the file <prompt file> in full and do exactly what it says.
```

Its steps, in this order:

```text
Before the first round, run git -C "<workspace>" status --porcelain. When it prints anything, list those paths, ask the user what to do with them, and wait: the developer writes in this checkout, so earlier changes would mix into its change. Never stash, discard or commit them yourself. Then note the commit you start from: git -C "<workspace>" rev-parse HEAD.
Decide <phase-id> before the brief: the plan's phase number, or the work item's ID when there is no plan. Put it in single quotes in every command. Write the developer's brief into a new file in the scratch folder, with your file tool; its absolute path is <prompt file>. Its first line is exactly Phase <phase-id>, and it asks for a report whose first line is the same. It says: do not commit and do not push.
Before the start, note the time and run node "<skill folder>/scripts/codex-dev.mjs" jobs --cwd "<workspace>". When a job is queued or running, wait on it with wait --cwd "<workspace>" before you start anything.
This session's working folder must be <workspace>, because the agent starts Codex in it: when it is another folder, stop and tell the user to start the session in <workspace>. Start the developer with one call of the agent codex:codex-rescue, whose prompt is the Command cell, exactly. Read the job id, <job-id>, from the agent's hand-back; when the hand-back holds none, run jobs --cwd "<workspace>" and take the one job started after the noted time.
Wait: node "<skill folder>/scripts/codex-dev.mjs" wait <job-id> --cwd "<workspace>", with the shell's longest time limit, and run it again for as long as it exits 3.
Take the result: node "<skill folder>/scripts/codex-dev.mjs" result <job-id> --phase '<phase-id>' --cwd "<workspace>". Accept it only when it exits 0: the job finished and its report names the phase. Keep its thread id as <thread>. Any other answer is a failed round, also when files changed.
Record the tree it left: node "<skill folder>/scripts/codex-dev.mjs" snapshot --cwd "<workspace>". The round's change is git diff between the commit you started from and that tree, new files included.
A fix round: write the findings into a new brief file in the scratch folder, whose first line is again Phase <phase-id>, and note the time. Make the same agent call with --resume in place of --fresh and the new brief's path in place of the first one. It starts a new job: read its id from the hand-back, or run jobs --cwd "<workspace>" and take the one job started after the noted time, and from now on that new id is <job-id>. Wait on it as above, then take its result with result <job-id> --phase '<phase-id>' --thread <thread> --cwd "<workspace>". The answer "wrong thread" is a failed round. Then snapshot again.
Review the change as the leader, and commit it yourself.
```
