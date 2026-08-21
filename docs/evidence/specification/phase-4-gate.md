# Phase 4 specification gate

Date: 2026-08-21

Category is locked to `Projects`. The project status changed from `SELECTED` to
`BUILDING` only after the full specification and frontend-interface correction
passed the checks below.

## Authenticity correction

The provisional claimant-authored enrollment path was rejected before contract
implementation because wallet authentication alone would not make a
claimant-authored profile sufficient for a GEN consequence. The final path is:

1. the sponsor authors an exact address-bound capability profile;
2. the named integrator accepts it unchanged in a separate onchain write;
3. validators fetch the fixed official OpenAI incidents JSON feed and select
   the immutable incident ID;
4. only the complete validated `IMPACTED` set can initialize credits.

Missing either onchain attestation or any source/settlement invariant is
non-penalizing and cannot move value.

## Source probe

Read-only probe output:

```text
200 34046 https://status.openai.com/api/v2/incidents.json application/json
200 116191 https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV text/html; charset=utf-8
MATCHES=1
id=01KZSC0T66YTVM57N5T79SV8ZV
status=resolved
incident_updates=5
components=1
```

The contract policy fetches the bounded JSON feed rather than the larger HTML
page. The user-facing page remains the immutable incident link.

## Machine-readable specification audit

```text
WRITE_METHODS_EXPECTED=9
create_pool exact_safety_rows=1 exact_interface_entries=1
invite_dependency exact_safety_rows=1 exact_interface_entries=1
accept_dependency exact_safety_rows=1 exact_interface_entries=1
lock_enrollment exact_safety_rows=1 exact_interface_entries=1
request_review exact_safety_rows=1 exact_interface_entries=1
retry_review exact_safety_rows=1 exact_interface_entries=1
withdraw_credit exact_safety_rows=1 exact_interface_entries=1
recover_reserve exact_safety_rows=1 exact_interface_entries=1
cancel_pool exact_safety_rows=1 exact_interface_entries=1
GATES_EXPECTED=14
all 14 gates pass_rows=1
FRONTEND_LIFECYCLE_ROWS=11
CLAIM_ROWS=9
BAD_CLAIM_ROWS=0
PLACEHOLDERS=0
```

Required sections reported present: state model, write-method safety matrix,
frontend lifecycle coverage, evidence policy, fact authentication, fetched
content verification, consensus design, settlement invariants, consequence and
accounting, reusable interface, threat model, test plan, claim-to-code,
deployment/evidence plan, Definition of Done, honest limitations, and kill
criteria.

## Frontend-interface verification

The FE-PRESERVE correction added sponsor invitation, named-integrator
acceptance, contextual cancellation/recovery, canonical available-action
handling, and removed frontend-only `DRAFT`/`REVIEWING` values from the
canonical pool enum. The visual system and route structure did not change.

```text
npm test
Test Files  15 passed (15)
Tests       42 passed (42)

npm run typecheck
tsc -b --pretty false
exit code 0

npm run build
4658 modules transformed
dist/assets/index-B1caphf6.css 46.38 kB | gzip 16.36 kB
dist/assets/index-kGzvEg2c.js 449.75 kB | gzip 133.41 kB
built in 561ms

FORBIDDEN_UI_MATCHES=0
```

Contract implementation, real adapter writes, Studionet receipts, and browser
wallet lifecycle evidence remain pending by design and are not claimed here.
