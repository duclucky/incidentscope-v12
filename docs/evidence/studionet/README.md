# Studionet evidence

Network: GenLayer Studionet (`61999`)

This directory contains allowlisted public evidence only. It intentionally excludes complete RPC
responses, validator-private fields, raw consensus/transaction payloads, process streams, wallet
material, and environment values.

## Revision history

### v1.2 (`0xEAde9Cf8B12022b96e35c042e12f45E476706177`)

- Local source explicitly supplies `EXPECTED_PROFILE_IDS`, exact verdict object keys, verbatim ID
  copying, and no missing/duplicate/extra IDs.
- Local gate: contract lint/validation pass; 70 Python tests, 5 deployment tests, and 52 frontend tests
  pass; TypeScript and production build pass.
- Deployment transaction `0xa8790193a2ced11618f62f6b0038b71e7317f7094c95d8b8b915251bb5e71386`
  reached `FINALIZED`, `MAJORITY_AGREE`, and execution `SUCCESS`; canonical metadata reports
  `incidentscope.contract.v1.2`.
- The 2 GEN lifecycle created `pool-1`, invited and accepted one integrator profile, locked
  enrollment, finalized a `VERIFIED` review, paid 2 GEN to the impacted integrator, and closed
  with participant outstanding 0 GEN, sponsor recoverable 0 GEN, and accounting invariant true.

## Evidence files

- `deployment.json`: the one current active deployment only.
- `lifecycle.json`: the current active revision's canonical before/after and safe transaction evidence.
- `deployment-attempts.json`: resumable deployment attempt identities and safe receipt projections.

All value is displayed in GEN. Demo pool creation uses exactly 2 GEN.
