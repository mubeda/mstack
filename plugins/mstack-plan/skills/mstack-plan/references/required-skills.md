# Required skills and the preflight

Read this at the start of section 0 of SKILL.md, before any question or other work, and again in Preflight, after the script ran. Its rules bind.

## The five shared skills

For each of `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review`, `mstack-research` and `mstack-vendors`:

1. It is in this session's skill list (as `<name>` or `<plugin>:<name>`): continue.
2. It is not in the list, but `scripts/check-required-skills.sh` (Preflight) reports it `ok` on disk: it was installed after this session started. Say that a new session is needed, and stop.
3. Otherwise it is not installed. Print this and stop, with nothing else done:

   ```text
   mstack-plan needs <name>, which is not installed.
   Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install <name>@mstack
   Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add <name>@mstack
   Antigravity: agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<name>
   Skills CLI:  npx skills add mubeda/mstack --skill <name> -g -a <claude-code|codex|antigravity> -y
   Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
   Then start a new session.
   ```

## What the preflight found

If `node` or `git` is missing (a `MISSING` line), tell the user and stop until it is installed, because no fallback replaces them. A `MISSING` shared skill that is already in this session's skill list is loaded and does not stop the run; otherwise handle it by "The five shared skills" above. Availability of other vendors' clients is checked by `mstack-vendors` at Phase 7, not here.

For any other missing item, the user runs `mstack-setup`: it installs the missing skills, plugins and command-line tools at user scope after one yes, and lists what it cannot install (`node`, `git`, logins) as steps for the user.
