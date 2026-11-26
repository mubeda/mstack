## mstack-research result

### 1
Answer: rowpipe 2.4.0 changed how writeRows ends a file. A search result names a bug in 2.4.1 that drops the last row; its page was not opened. The project pins 2.4.1.
Version: rowpipe 2.4.1, read from package-lock.json
Claims:
- The project pins rowpipe at 2.4.1 | package-lock.json | 2.4.1 | opened 2026-11-24 | high
- Since 2.4.0, writeRows no longer writes a line ending after the last row unless `finalNewline` is set | https://example.invalid/releases/2 | 2.4.0 | opened 2026-11-24 | medium
- rowpipe 2.4.1 drops the last row of every file, fixed in 2.4.2 | https://example.invalid/issues/1 | any | not opened | low
Conflicts: none
Not found: none
Ignored pages: none

Depth: quick   Readers: restricted
Search: ran
