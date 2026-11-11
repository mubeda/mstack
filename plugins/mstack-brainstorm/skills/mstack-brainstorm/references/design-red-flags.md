# Design red flags

Read this when the brief is for software, before you ask the user to approve it. Check the picked approach against each flag below. A flag is a cost, not a veto: when you find one, record it in the brief under `## Tradeoffs accepted` (when the user accepts the cost, or it is plainly worth it) or under `## Open questions` (when the user has to weigh it). Skip this file for a subject that is not software.

| Flag | What it means | How to spot it in a brief |
|---|---|---|
| A thin wrapper | A part whose interface is about as large as what it hides, so callers still have to learn the inside | Callers must call several of its operations in a row to do one job, or its options name its internal steps |
| One decision in many places | Several parts depend on the same internal choice (a format, a rule, a protocol detail), so changing it means editing all of them | The same format or rule is described for more than one component |
| Split by order of steps | Parts are cut by when they run (read, check, change, save) instead of what they know, so each repeats the same rules | The approach lists stages that each handle the same data and its rules |
| A pass-along layer | A layer that hands the same input to the next layer unchanged and adds nothing | A component whose only job in the brief is to call another one |
| Two writers of one thing | More than one part writes the same stored state or keeps its own copy, so their rules drift apart | Two components both create or update the same record or setting |
| Two routes to one result | The design offers two or more routes to the same result, and every way keeps gaining users | The brief keeps an old path "for now" beside the new one, with no date to remove it |
| Reachable insides | Callers can reach a part's internals directly, so the internals become part of its interface | The brief lets other code read or change a component's private data |
| Lists kept in step by hand | The same set of items is written out in several places, so each addition needs an edit in each of them | The brief adds an item to one list and a matching entry to another |

For each flag you record, write one line: the flag, where it shows in the approach, and the cost.
