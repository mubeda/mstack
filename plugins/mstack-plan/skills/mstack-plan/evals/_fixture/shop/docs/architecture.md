# Architecture

- `app/users.py` holds user records in memory, keyed by the lowercased, trimmed email.
- `app/auth.py` signs users in and keeps sessions in the in-memory dict `_sessions` (token -> (email, created_at)). A restart signs everyone out; that is accepted.
- `app/mailer.py` is the only place that sends email. Every outgoing message goes through `send_email(to, subject, body)`. Tests patch `mailer.smtplib.SMTP` and never reach a relay.
- There is no web framework yet. Request handling is plain functions called by the tests; the HTTP layer is out of scope until a later spec.
- Time comes from `time.time()`. Code that depends on time takes a `now` parameter so tests can control it.
