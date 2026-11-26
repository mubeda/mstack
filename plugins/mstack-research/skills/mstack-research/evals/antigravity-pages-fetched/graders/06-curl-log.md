---
type: llm
focus: outcome
weight: 1
---

Read in the self-test from the case's `bin/curl-calls.log`: it holds at least two lines, no two lines name the same address, and every line holds this option list in this order, with only the number in the file name and the address differing: `--disable --silent --fail --globoff --proto =https --location --max-redirs 0 --max-filesize 5000000 --max-time 30 --output <scratch folder>/page-<n>.html --write-out %{http_code} --url <address>`. No line holds `--show-error`. The scratch folder lies outside the case's workspace, and it no longer exists when the session has ended.
