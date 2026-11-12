# Product plan: Customer self-service portal

Status: Draft
Review: same-vendor, round 1, Ready
Source: conversation 2026-10-28

## Problem and evidence
Customers of the billing product have to write to support for every invoice copy and every address change. Support counted 1,140 such requests in the last quarter, about a third of all tickets.

## Who it is for
Finance contacts at customer companies, and the support team that answers them today.

## Outcome and measure
Customers get invoices and change their own details without writing to support. Measure: the share of support tickets about invoices and account details, today 34%.

## Out of scope
- Paying invoices online: a separate initiative with its own legal review.
- A mobile app: the finance contacts work at a desk.

## Fixed limits
- Live before the price change on 2027-03-01.

## Risks and assumptions
- Assumption: every customer has one named finance contact.
- Risk: customers keep writing to support out of habit.

## Epics

### Now

#### 1. Sign in for finance contacts
- Why here: nothing else can be reached without it
- Outcome: a finance contact can get into the portal with their work email
- Who it is for: finance contacts
- In and out: in, sign in and sign out; out, single sign-on with the customer's own identity system
- Measurable result: 80% of invited contacts sign in within a month
- Size: medium, it is the base for everything else
- Depends on: nothing
- Open questions for developers: none

#### 2. Invoices
- Why here: it is the largest group of support requests
- Outcome: a finance contact finds and downloads any invoice without help
- Who it is for: finance contacts
- In and out: in, list, search and download of invoices, and export of the list; out, paying an invoice
- Measurable result: 60% of invoice requests to support stop within three months of launch
- Size: large, it removes most of the support work
- Depends on: 1
- Open questions for developers: whether the billing system can produce invoice files older than two years

### Next

#### 3. Company details
- Why here: fewer requests than invoices, and it needs sign in
- Outcome: a finance contact changes the billing address and contact people themselves
- Who it is for: finance contacts
- In and out: in, billing address and contact people; out, changing the legal company name
- Measurable result: not measurable yet, address changes are not counted apart from other tickets today
- Size: small, it is a few fields
- Depends on: 1
- Open questions for developers: none

### Later

#### 4. Usage overview
- Why here: nobody asked for it yet; it is our own idea
- Outcome: a finance contact sees what the next invoice will contain
- Who it is for: finance contacts
- In and out: in, the current month's usage; out, forecasts
- Measurable result: fewer questions about invoice amounts, counted from support tags
- Size: medium, value is unproven
- Depends on: 2
- Open questions for developers: none
