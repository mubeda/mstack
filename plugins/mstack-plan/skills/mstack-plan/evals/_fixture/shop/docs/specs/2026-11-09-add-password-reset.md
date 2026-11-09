# Password reset by email

Status: Approved 2026-11-09 (approved in chat by the user)
Size: full    Mode: quick    Type: feature
Source: conversation 2026-11-09 (the user's answers to an earlier question round)

## Problem

A shop customer who forgets their password has no way back into their account: the app
offers sign-in with a password and nothing else (app/auth.py has sign-in and sessions only).
Every forgotten password means a lost customer or a manual fix by staff.

## Goals

1. A customer who forgot their password can set a new one and sign in with it, using only
   access to their email inbox. Checked by the end-to-end scenario in R1, R3 and R5.
2. The reset flow does not let anyone learn whether an email address has an account.
   Checked by comparing the form's responses for known and unknown addresses (R2).
3. A reset locks out anyone who was using the old password. Checked by R6: every session
   that existed before the reset stops working.
4. The reset form cannot be used to flood an inbox. Checked by R8: a fourth email to the
   same address within an hour is never sent.

## Non-goals

- Admin-triggered resets (staff sending a reset for a customer). The user ruled them out
  for now.
- Reset by SMS, security questions or any channel other than email. The user chose email
  only.
- Changing the password while signed in. A different flow with different checks (it knows
  who the user is); not part of the forgotten-password problem.
- Emailing the customer a "your password was changed" notice after a reset (agent's call:
  not requested; easy to add later as its own requirement).
- Signing the customer in automatically after a reset (agent's call, see D5).
- Password strength rules beyond a minimum length (agent's call, see D6).
- Surviving an app restart: pending reset links are lost on restart, as sessions already are
  (see Constraints).

Anti-goals, which count as failure even if every requirement passes:

- Any observable difference (page text, status, redirect) between submitting an address with
  an account and one without.
- A reset link that still works for anyone after it was used, after 30 minutes, or after a
  newer link was sent.
- A reset after which an old session, including an attacker's, still works.

## Users and scenarios

1. As a customer who forgot my password, I want a link sent to my email, so that I can set a
   new password and sign in again.
2. As a customer whose link expired, I want to get a new link from the expired-link page,
   so that I do not have to find the reset form and type my address again.
3. As a customer who suspects someone else knows my password, I want a reset to end every
   session, so that the other person is signed out.
4. As the shop operator, I want the reset form to reveal nothing about which addresses have
   accounts and to send at most 3 emails per address per hour, so that it cannot be used to
   harvest customer addresses or to spam an inbox.

## Requirements

Terms used throughout. "Reset link": the single-use URL emailed to a customer. "Expired-link
page": the page shown for any reset link that cannot be used. "Neutral confirmation": the one
message the reset form shows after every well-formed submission, for example "If an account exists for
that address, we have sent a reset link to it." Email addresses are compared after trimming
spaces and lowercasing, as the shop already does when looking up users. A reset link is
"usable" while it is unused, less than 30 minutes old and the newest link for its account.

### R1. Send a reset link  [Must]

WHEN a visitor submits the reset form with an address that has an account and the address
is under the rate limit (R8), the shop SHALL send one email containing a reset link to that
address.

#### Scenario: known address gets a link
- GIVEN an account exists for ana@example.com and no reset email went to it in the last hour
- WHEN a visitor submits ana@example.com on the reset form
- THEN one email with a reset link is sent to ana@example.com
- AND the form shows the neutral confirmation

#### Scenario: address in different case and with spaces
- GIVEN an account exists for ana@example.com
- WHEN a visitor submits "  Ana@Example.com "
- THEN one email with a reset link is sent to ana@example.com

#### Scenario: unknown address gets nothing
- GIVEN no account exists for bob@example.com
- WHEN a visitor submits bob@example.com
- THEN the form shows the neutral confirmation, and no email is sent to bob@example.com

### R2. Reveal nothing about accounts  [Must]

The shop SHALL return the same page, status and message for every well-formed reset form
submission, whether or not the address has an account, is over the rate limit, or the email could not be
sent.

#### Scenario: known and unknown addresses look identical
- GIVEN an account exists for ana@example.com and none exists for bob@example.com
- WHEN a visitor submits each address once
- THEN both responses have the same status code and the same page text

#### Scenario: limit reached looks identical
- GIVEN 3 reset emails went to ana@example.com in the last hour
- WHEN a visitor submits ana@example.com
- THEN the response is the neutral confirmation, and it does not mention a limit or the
  account

### R3. Link opens the new-password form  [Must]

WHILE a reset link is usable, WHEN the link is opened, the shop SHALL show a form for
entering a new password.

#### Scenario: fresh link
- GIVEN a reset link sent 10 minutes ago and not used
- WHEN the customer opens it
- THEN the new-password form is shown

#### Scenario: opening twice before submitting
- GIVEN a reset link that was opened once but no new password was submitted
- WHEN the customer opens it again within 30 minutes
- THEN the new-password form is shown again (opening a link does not use it up)

### R4. Unusable links show the expired-link page  [Must]

IF a reset link has already been used, is 30 minutes old or older, has been replaced by a
newer link for the same account, or is not a link the shop issued, THEN the shop SHALL show
the expired-link page and SHALL NOT show the new-password form.

#### Scenario: used link
- GIVEN a reset link that was used to set a new password
- WHEN anyone opens it again
- THEN the expired-link page is shown, and the password cannot be changed through it

#### Scenario: link at 30 minutes
- GIVEN a reset link sent 30 minutes ago and not used
- WHEN the customer opens it
- THEN the expired-link page is shown

#### Scenario: link expires while the form is open
- GIVEN a customer opened a reset link 25 minutes after it was sent
- WHEN they submit a new password 31 minutes after it was sent
- THEN the expired-link page is shown, and the password is not changed

#### Scenario: replaced link
- GIVEN two reset links were sent to ana@example.com, the second one later
- WHEN the customer opens the first link
- THEN the expired-link page is shown

#### Scenario: made-up link
- GIVEN a reset URL whose token the shop never issued
- WHEN anyone opens it
- THEN the expired-link page is shown, and nothing on it names an account or address

### R5. Set the new password  [Must]

WHEN a customer submits a new password of at least 8 characters through a usable reset
link, the shop SHALL replace the account's password with the new one, mark the link as used, and show the sign-in
page with a message that the password was changed.

#### Scenario: successful reset
- GIVEN a usable reset link for ana@example.com
- WHEN the customer submits the new password "correct horse 42"
- THEN signing in with "correct horse 42" succeeds, and signing in with the old password
  fails

#### Scenario: link cannot be replayed
- GIVEN a reset completed through a link
- WHEN the same new-password form is submitted again with another password
- THEN the expired-link page is shown, and the password stays the one set first

### R6. End every session after a reset  [Must]

WHEN a password is changed through a reset link, the shop SHALL end every session that
belongs to that account, including any session in the browser that made the reset.

#### Scenario: other devices signed out
- GIVEN ana@example.com is signed in on two browsers
- WHEN a reset for ana@example.com completes
- THEN requests from both browsers are treated as signed out

#### Scenario: other accounts untouched
- GIVEN ana@example.com and carl@example.com are both signed in
- WHEN a reset for ana@example.com completes
- THEN carl@example.com is still signed in, and only ana@example.com's sessions ended

### R7. Request a new link from the expired-link page  [Must]

WHEN a visitor presses the send-a-new-link button on the expired-link page for a link the
shop issued in the past 24 hours, the shop SHALL send a new reset link to the address that link was sent to,
subject to the rate limit (R8), and show the neutral confirmation.

#### Scenario: expired link, new link sent
- GIVEN a reset link for ana@example.com expired, and fewer than 3 reset emails went to that
  address in the last hour
- WHEN the visitor presses the button
- THEN one new reset link is sent to ana@example.com, and the neutral confirmation is shown

#### Scenario: made-up or old link
- GIVEN the expired-link page was shown for a token the shop never issued, or issued more
  than 24 hours ago
- WHEN the visitor presses the button
- THEN the reset form is shown with an empty address field, and no email is sent

#### Scenario: limit reached
- GIVEN 3 reset emails went to ana@example.com in the last hour
- WHEN the visitor presses the button on an expired link for that address
- THEN the neutral confirmation is shown, and no email is sent

### R8. At most 3 reset emails per address per hour  [Must]

IF 3 reset emails have been sent to an address within the past 60 minutes, THEN the shop
SHALL send no further reset email to that address until the oldest of them is 60 minutes
old.

#### Scenario: fourth request within the hour
- GIVEN reset emails went to ana@example.com at 10:00, 10:10 and 10:20
- WHEN a fourth reset is requested for that address at 10:30
- THEN no email is sent, and the response is the neutral confirmation (R2)

#### Scenario: window slides
- GIVEN reset emails went to ana@example.com at 10:00, 10:10 and 10:20
- WHEN a reset is requested at 11:01
- THEN one email is sent

#### Scenario: case variants share one limit
- GIVEN 3 reset emails went to ana@example.com in the last hour
- WHEN a reset is requested for "ANA@example.com"
- THEN no email is sent

### R9. Email failure  [Should]

IF the reset email cannot be handed to the mail relay, THEN the shop SHALL log the failure
with the time and the reason, show the neutral confirmation, and not count the attempt
toward the rate limit.

#### Scenario: relay down
- GIVEN the mail relay refuses connections
- WHEN a visitor submits ana@example.com
- THEN the neutral confirmation is shown, a log line records the failed send, and the page
  shows no error that would reveal the account

### R10. Malformed address  [Must]

IF the address submitted on the reset form is empty or is not an email address, THEN the
shop SHALL show a message asking for a valid email address and SHALL NOT send any email.

#### Scenario: not an address
- GIVEN any state
- WHEN a visitor submits "not-an-email" or an empty field
- THEN the form shows the valid-address message, and no email is sent (the check does not
  depend on whether an account exists, so it reveals nothing)

### R11. New password too short  [Must]

IF a new password submitted through a usable reset link has fewer than 8 characters, THEN
the shop SHALL show the message "Use at least 8 characters", keep the old password and keep
the link usable.

#### Scenario: 7 characters
- GIVEN a usable reset link for ana@example.com
- WHEN the customer submits a 7-character password
- THEN the message "Use at least 8 characters" is shown, signing in with the old password
  still succeeds, and the link still opens the new-password form

#### Scenario: exactly 8 characters
- GIVEN a usable reset link
- WHEN the customer submits an 8-character password
- THEN the password is changed (R5)

## Constraints and assumptions

- Sessions already time out after 30 minutes (`SESSION_TIMEOUT_MINUTES = 30` in
  app/auth.py), the same length as the reset link lifetime.
- Sessions are held in the app's memory and keyed by token, each recording the account's
  email (app/auth.py), so ending all of one account's sessions is possible without a new
  store.
- Passwords are stored as PBKDF2-HMAC-SHA256 with 200,000 iterations and a per-user salt
  (app/auth.py). A password set by reset is stored the same way.
- Users are looked up by email after `strip().lower()` (app/users.py). The rate limit and
  the reset lookup use the same normalization (agent's call: otherwise case variants would
  each get 3 emails).
- Email goes through a single SMTP relay set by `SHOP_SMTP_HOST`, sender
  no-reply@shop.example (app/mailer.py).
- Users and sessions live in memory, so pending reset links and rate-limit counts are lost
  on restart (agent's call: matches how sessions behave today; a restart can only make a
  link stop working, never make an extra one work).
- Tests run with `python3 -m unittest discover -s app` (README.md).
- The repository has no web layer yet: no routes, pages or sign-in page, only the service
  functions in app/ (README.md calls it a web shop). The pages this spec names (reset form,
  new-password form, expired-link page, sign-in page) are described by behavior only; where
  they live is for the plan, after the user answers the open question below.
- The shop runs as a single process (agent's call: sessions are already per-process, so
  several processes would break sign-in today too). Single use, the race rule and the rate
  limit rely on it.

## Decisions

D1. Approach: an opaque random token stored server-side with its account, send time and
used flag. Alternatives considered: a stateless signed token (no storage, but "works once"
and "replaced by a newer link" both need server state anyway, and it adds a signing secret
the app does not have); a short numeric code typed into the app (not a link, which the user
asked for). Decided by: agent's call. Source: user answers on single use and expiry.

D2. Reset by email only, no admin-triggered resets for now. Decided by: user.

D3. Link lifetime 30 minutes, single use. Decided by: user.

D4. The reset form never reveals whether an address has an account (R2), which extends to
rate-limit and mail-failure responses. Decided by: user (the rule); agent's call (applying
it to the limit and failure cases, since a different message there would leak the same
fact).

D5. After a reset, every session of the account ends, and the customer is sent to sign in
rather than being signed in automatically. Alternatives considered: auto sign-in (one step
shorter, but turns a stolen inbox into an immediate session with no password typed).
Decided by: user (end all sessions); agent's call (no auto sign-in).

D6. New password must be at least 8 characters, with no other rules. The repository has no
password policy to follow. Alternatives considered: no minimum (allows a one-character
password); composition rules (NIST SP 800-63B advises against them). Decided by: agent's
call.

D7. Sending a new link invalidates every earlier unused link for that account. Alternatives
considered: all links stay valid until they expire (several live links in one inbox widen
the window for misuse). Decided by: agent's call.

D8. Opening a link does not use it up; a successful password change does. Alternatives
considered: consuming on open (mail scanners that prefetch links would burn them before the
customer clicks). Decided by: agent's call.

D9. Rate limit of 3 reset emails per address per sliding 60 minutes, counting emails
actually handed to the relay, including those sent from the expired-link page button.
Alternatives considered: a fixed clock hour (allows 6 emails across an hour boundary).
Decided by: user (3 per hour); agent's call (sliding window, what counts).

D10. The expired-link page button sends to the address the expired link was issued for. For
a token the shop never issued, the button opens the reset form instead. Decided by: user
(the button); agent's call (the made-up-token case, and keeping a record of each issued
link for 24 hours so the button works on a link up to a day old; older records are dropped
so memory stays bounded).

D12. The emailed link uses the shop's public address from configuration, and the shop
refuses to start sending reset emails when that address is not configured, rather than
falling back to localhost. Alternatives considered: a localhost default (production emails
whose links lead nowhere, while every test passes). Decided by: agent's call (raised by the
independent read).

D11. No email is sent for an address without an account. Alternatives considered: an email
saying "no account here" (lets anyone send mail to arbitrary addresses through the shop).
Decided by: agent's call.

## Risks

- Response timing differs between known addresses (email sent) and unknown ones (nothing
  sent), which can reveal accounts despite identical pages -> send the email outside the
  request, or pad the response, so both paths take about the same time; check in the plan.
- Reset tokens leak through logs or the Referer header -> never log the full token, and keep
  the new-password page free of third-party resources.
- Rate-limit counts are in memory and reset on restart -> accepted; a restart is rare and
  allows at most 3 more emails per address.
- The mail relay is slow -> covered by the timing mitigation above; R9 covers a hard failure.

## Verification

Unit tests under the existing command, `python3 -m unittest discover -s app`, with the
clock and the mailer replaced by test doubles.

- R1: submit known, case-variant and unknown addresses; assert on emails captured by the
  mailer double.
- R2: compare status and body for known, unknown, rate-limited and mail-failure submissions;
  they must be identical.
- R3, R4: advance the test clock to 29:59 and 30:00; reuse a used link; issue two links and
  open the first; open an invented token.
- R5: after a reset, sign-in with the new password succeeds and with the old one fails; a
  second submission on the same link is refused.
- R6: create several sessions for two accounts, reset one, and check which tokens still
  resolve to a user.
- R7: press the button for expired, used, replaced and invented tokens, under and at the
  limit.
- R8: send at 0, 10 and 20 minutes, request at 30 and at 61 minutes, with case variants.
- R9: make the mailer double raise; assert the neutral page, a log line and an unchanged
  rate-limit count.
- R10: submit empty and malformed addresses; assert the message and no captured email.
- R11: submit 7- and 8-character passwords; check the old password and the link afterwards.

Input classes no scenario covers, and their expected behavior:

- A reset requested while the account is signed in: allowed, same flow; R6 ends that session
  too.
- Two new-password submissions racing on the same link: at most one succeeds; the other gets
  the expired-link page.
- A very long address or password (over 254 or 1,024 characters): rejected with the format
  or length message, nothing sent or stored.
- New password equal to the old one: accepted; sessions still end.

## Open questions

- Where do the reset pages live? The repository has no web layer, so either the pages
  belong to a front end outside this repository, or this work must also add a minimal web
  layer (and choose how). Owner: the user. Can wait because: the requirements describe
  observable behavior that is the same either way; the answer changes the plan's size and
  test seam, not what the spec requires. It must be answered before the plan is written.

## Appendix: interview record

Questions answered in an earlier round, before this draft. The recommendation given in that
round was not recorded here.

- 2026-11-09 Q: Which channels can deliver a reset? / Decision: email only.
- 2026-11-09 Q: How many times does a link work? / Decision: once.
- 2026-11-09 Q: How long does a link live? / Decision: 30 minutes after it is sent.
- 2026-11-09 Q: May the reset form reveal whether an address has an account? / Decision: no.
- 2026-11-09 Q: What happens to sessions after a reset? / Decision: every session of that
  account ends.
- 2026-11-09 Q: Can admins trigger resets? / Decision: no, not for now.
- 2026-11-09 Q: What does the expired-link page offer? / Decision: a button that sends a new
  link.
- 2026-11-09 Q: How many reset emails per address? / Decision: at most 3 per address per
  hour.
- 2026-11-09 Evidence: app/auth.py / Decision: sessions time out after 30 minutes and are
  in-memory, keyed by token with the account email; ending all of an account's sessions
  needs no new store.
- 2026-11-09 Evidence: app/auth.py / Decision: passwords use PBKDF2-HMAC-SHA256, 200,000
  iterations, per-user salt; reset reuses it.
- 2026-11-09 Evidence: app/users.py / Decision: addresses are normalized with trim and
  lowercase; the rate limit uses the same rule.
- 2026-11-09 Evidence: app/mailer.py / Decision: one SMTP relay; failure handled by R9.
- 2026-11-09 Evidence: no docs/ folder, spec convention or agent instructions in the repo /
  Decision: spec written to docs/specs/ (process call).
- 2026-11-09 Agent's calls without a question (user unavailable during drafting): D1, D4
  extension, D5 no auto sign-in, D6, D7, D8, D9 window, D10 invented-token case, D11, D12, R9,
  R10 wording, no password-changed notice, single process, 24-hour link records. All listed for the user at approval.
