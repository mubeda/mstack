# codegraph

codegraph keeps a local index of a repository's symbols and their callers. When it is installed, the skill refreshes the index before it reads code and uses it to find code. When it is not, the skill reads code exactly as before. The skill never installs codegraph; `mstack-setup` does.

Run these steps once, at the point the skill's own file names, in the folder the user works in. A lane or a subagent never runs them: in a workflow, the coordinator runs them once in its own checkout before lanes start.

## Refresh the index

1. Run `codegraph --version`. If it fails, codegraph is missing: go to "When codegraph is missing or fails".
2. From the project root (the repository root, from `git rev-parse --show-toplevel`, or the working folder when it is not a Git repository), run `codegraph status -j` and read the `initialized` field of its JSON. Do not use the exit code: it is 0 whether or not an index exists. If the command fails or prints no JSON with that field, go to "When codegraph is missing or fails".
3. If `initialized` is `true`, say "Updating the code index" and run `codegraph sync`.
4. If `initialized` is `false`, say "Building the code index" and run `codegraph init -y`. It asks no question with `-y`.
5. Wait for the command to end before reading any code. Both commands print `Done` on success and leave no process behind.
6. If the command exits non-zero, go to "When codegraph is missing or fails".

## Use the index

Locate code with the index first, then read the files it points to:

- `codegraph query <name>`: find a symbol by name.
- `codegraph explore <words>`: the symbols and source for an area.
- `codegraph context <task>`: the relevant symbols for a task description.
- `codegraph callers <symbol>` and `codegraph callees <symbol>`: who calls what.
- `codegraph impact <symbol>`: what a change to the symbol affects.

When the session lists codegraph tools (from its MCP server), you may use them instead of the commands; they answer the same questions. When a query returns nothing useful, fall back to text search for that question.

## When codegraph is missing or fails

Continue the work with text search and file reads, as the skill did before. Never stop the skill for this and never install codegraph. Put one line in the skill's report:

- Missing: "codegraph is not installed, so code was located by text search. `mstack-setup` installs it."
- Failing: "The codegraph index could not be refreshed (`<last line of the error>`), so code was located by text search."

## The index folder in Git

The index lives in `.codegraph/` at the project root. It holds its own ignore file but still shows as one untracked folder.

1. Skip this section when the folder is not a Git repository. Otherwise run `git status --short`. If `.codegraph/` is not listed, there is nothing to do.
2. If it is listed and you can ask the user, offer once: "Hide `.codegraph/` from Git status for this clone only? It adds one line to the local exclude list and changes no tracked file."
3. On yes, append the line `.codegraph/` to the file that `git rev-parse --git-path info/exclude` prints. Use that command, not `.git/info/exclude`, because in a worktree `.git` is a file. Check with `git status --short` that the folder is gone, and with `git diff` that nothing changed.
4. On no, or where you cannot ask (a called run, a lane), add nothing to any exclude list or ignore file, and note in the report that `.codegraph/` is untracked.
