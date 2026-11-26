---
type: llm
focus: trace
weight: 1
---

The reply names the session's own subagent tool, `invoke_subagent`, as the method of the comparison test, with one subagent per run and the skill's path given only to the run with the skill; and it either starts the two runs that way (or writes the two calls it would make), or says the subagent tool cannot be used and hands the prompt and the two setups to the user. A reply that hands the runs to the user without naming the subagent route fails.
