## mstack-research result

### 1
Answer: rowpipe 2.4.0 added a streaming writer. A search result says that writer holds at most 50,000 rows in memory; its page was not opened. The project pins 2.4.1.
Version: rowpipe 2.4.1, read from package-lock.json
Claims:
- The project pins rowpipe at 2.4.1 | package-lock.json | 2.4.1 | opened 2026-11-24 | high
- Since 2.4.0, `writeRowsStream` writes rows as they arrive, without building the whole file in memory | https://example.invalid/releases/2 | 2.4.0 | opened 2026-11-24 | medium
- `writeRowsStream` keeps at most 50,000 rows in memory at a time | https://example.invalid/issues/1 | any | not opened | low
Conflicts: none
Not found: none
Ignored pages: none

Depth: quick   Readers: restricted
Search: ran
