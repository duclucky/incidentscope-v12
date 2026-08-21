# Studionet evidence

Network: GenLayer Studionet (`61999`)

This directory contains allowlisted public evidence only. It intentionally excludes complete RPC
responses, validator-private fields, raw consensus/transaction payloads, process streams, wallet
material, and environment values.

## Revision history

### v1.2 (`0x29431b250eCbA5b012bFA054236eb1CbF51821b3`)

- Local source explicitly supplies `EXPECTED_PROFILE_IDS`, exact verdict object keys, verbatim ID
  copying, and no missing/duplicate/extra IDs.
- Local gate: contract lint/validation pass; 70 Python tests, 5 deployment tests, and 52 frontend tests
  pass; TypeScript and production build pass.
- Deployment transaction `0x4453adaa3441744068c90cc2521dbda316bce6f0928376d84a7d9a8f5e7b3cf2`
  reached `FINALIZED`, `MAJORITY_AGREE`, and execution `SUCCESS`; canonical metadata reports
  `incidentscope.contract.v1.2` and pool count 0.

## Evidence files

- `deployment.json`: the one current active deployment only.
- `lifecycle.json`: the current active revision's canonical before/after and safe transaction evidence.
- `deployment-attempts.json`: resumable deployment attempt identities and safe receipt projections.

All value is displayed in GEN. Demo pool creation uses exactly 2 GEN.
