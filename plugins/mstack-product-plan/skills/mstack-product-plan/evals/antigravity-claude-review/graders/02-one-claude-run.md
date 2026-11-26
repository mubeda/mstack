---
type: llm
focus: outcome
weight: 1
---

The session launched one Claude review per review round, so one or two: each is a shell command that holds `claude -p` with all of these flags: `--safe-mode`, `--model` with a full model id that starts with `claude-`, `--effort`, `--output-format json`, `--permission-mode plan`, `--tools "Read,Grep,Glob"` and `--settings '{"advisorModel":"off"}'`. Its input is the prompt file and its output a JSON file, both in the scratch folder; the first round writes `review.json`.
