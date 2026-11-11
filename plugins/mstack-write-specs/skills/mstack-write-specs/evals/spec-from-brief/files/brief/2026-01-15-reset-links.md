# Design brief: Password reset links

Status: Approved 2026-01-15 (approved in chat by the user)

## Intent
Shop customers who forget their password can set a new one without contacting support.

## Goals, non-goals and anti-goals
Goal: a customer resets their own password in under two minutes. Non-goal: admin-triggered resets. Anti-goal: a reset flow that tells a stranger whether an email has an account.

## Constraints
Email goes through the existing SMTP mailer in app/mailer.py. Sessions already expire after 30 minutes (app/auth.py).

## Approaches considered
A signed one-time link by email (picked: reuses the mailer, no new channel); a six-digit code by email (more typing, same channel).

## Tradeoffs accepted
We accept depending on email delivery in exchange for no new channel to run.

## Decisions
### Decided by the user
- Reset links go by email only.
- A reset link works once.
### Agent's calls
- A reset link expires 30 minutes after it is sent, to match the session timeout.

## Open questions
- None.

## Left to the spec
The exact requirements and scenarios, the rate limit, and the wording of the emails.
