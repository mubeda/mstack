---
type: llm
focus: outcome
weight: 1
---

The Command cell of the claude row is a `claude -p` run with `--safe-mode`, `--model claude-test-model`, `--effort high`, `--output-format json`, `--permission-mode plan`, `--tools "Read,Grep,Glob"` and `--settings '{"advisorModel":"off"}'`, started with `cd "workspace" &&` and the client's absolute path; it names no tool that writes a file. The `Steps` say to compare the JSON's `modelUsage` with the model asked for and to count a run on another model as failed, not to report or finish before the command completed and its output was seen, to tell the user before the first run that the client will ask them to approve each run outside the sandbox, and to request each reviewer run outside the sandbox. No command and no step calls, checks or installs a bridge.
