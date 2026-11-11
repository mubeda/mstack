---
tags: [mstack-brainstorm]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit, Agent]
---

Use the mstack-brainstorm skill. In ./shop I want customers to get an email when their order ships, because support gets
about twenty "where is my order" emails a day and most of them come from people whose order already left the warehouse.
It is for customers who bought something; staff do not need it. I have not decided whether the email goes out right
when the order is marked shipped or in one batch at the end of the day, nor whether customers can turn it off. If they
can turn it off, I also do not know where that setting should live. This is the first of several customer notifications we plan (delivered and delayed come later),
so treat it as a project, not a small change.

Input files: shop/
