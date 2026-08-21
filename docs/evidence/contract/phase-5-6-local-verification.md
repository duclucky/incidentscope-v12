# Phase 5-6 local verification

Date: 2026-08-21

Scope: local contract implementation, direct/adversarial tests, deployment receipt parser fixtures,
gltest fluent-call helpers, frontend regression tests, TypeScript, and production build. This is not
Studionet deployment or browser-wallet evidence.

## Contract gate

Command:

```text
set PYTHONUTF8=1&& .venv\Scripts\genvm-lint.exe check contracts/incidentscope.py
```

Observed output:

```text
Lint passed (3 checks)
Validation passed
Contract: IncidentScopeContract
Methods: 20 (11 view, 9 write)
```

The linter also reported that a newer runner is available. The project intentionally retains the
verified `py-genlayer:1jb45...` API/hash family pending an isolated migration spike, as required by the
workspace version-unit policy.

## Repository-wide local check

Command:

```text
npm run check
```

Observed output summary:

```text
Contract lint: PASS
Python test suite: 68 passed
Frontend test files: 15 passed
Frontend tests: 42 passed
TypeScript: PASS
Vite production build: 4658 modules transformed; built successfully
```

No test was skipped. Python coverage includes the nine write-method safety cards, semantic validator
replay, malformed/unavailable/contradictory evidence, exact entity-set settlement invariants,
deterministic 1 GEN three-way rounding, duplicate actions, value accounting, and `-1 / exact / +1`
transaction-time boundaries. Receipt fixtures cover raw Studio leader receipts and normalized SDK
receipts. Gltest helper tests prove fluent writes and bare-dict mock installation before nondeterminism.
