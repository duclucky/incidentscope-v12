# IncidentScope submission packet

Use this for the GenLayer Portal Builders / Projects submission.

## Recommended category

Projects

## Title

IncidentScope — Validator-scoped incident credit pools

## Notes / Description

Character count: 579

```text
IncidentScope is a GenLayer Projects dApp for incident-scope credit pools. Providers pre-fund a bounded reserve, integrators lock dependency profiles, and validators classify those profiles against an official incident page before credits become withdrawable. The contract makes the semantic beneficiary decision validator-controlled and enforces deterministic GEN accounting. Evidence includes a deployed Studionet contract, a completed lifecycle, browser wallet proof through OKX Wallet, 70 direct tests, 5 deployment parser tests, 53 frontend tests, CI, and Vercel production.
```

## Evidence

- Repository: https://github.com/duclucky/incidentscope-v12
- Live app: https://incidentscope-v12.vercel.app
- Primary contract explorer: https://explorer-studio.genlayer.com/address/0xEAde9Cf8B12022b96e35c042e12f45E476706177
- Consumer/integration explorer: N/A; one contract owns the complete Projects boundary.
- Lifecycle evidence: https://github.com/duclucky/incidentscope-v12/blob/main/docs/evidence/studionet/lifecycle.json
- Submission audit: https://github.com/duclucky/incidentscope-v12/blob/main/docs/evidence/studionet/submission-audit.md
- Browser wallet proof: https://github.com/duclucky/incidentscope-v12/blob/main/docs/evidence/frontend/browser-wallet-proof.md
- Successful CI: https://github.com/duclucky/incidentscope-v12/actions/workflows/check.yml

## Verified facts

- Contracts: 1
- Contract name: `IncidentScopeContract`
- Contract file: `contracts/incidentscope.py`
- Public methods: 20 total, 11 view and 9 write
- Network: Studionet
- Contract address: `0xEAde9Cf8B12022b96e35c042e12f45E476706177`
- Local verification: `npm run check` passed
- Direct tests: 70 Python tests passed
- Deployment/parser tests: 5 tests passed
- Frontend tests: 53 tests passed
- CI: public `check` workflow passes on `main`; use the latest successful run from the workflow link above.
- Production frontend: Vercel HTTP 200; live bundle contains the receipt-shape fix; `/genlayer-rpc` returns chain ID `0xf22f`

## Lifecycle summary

The Studionet lifecycle created a 2 GEN pool, invited and accepted one integrator dependency profile, locked enrollment, requested validator review of the official incident page, finalized a `VERIFIED` decision, classified the accepted profile as `IMPACTED`, withdrew 2 GEN to the integrator, and closed with participant outstanding 0 GEN, sponsor recoverable 0 GEN, and accounting invariant true.

Browser proof additionally shows Chrome + OKX Wallet created `pool-2` with a 1 GEN reserve. Canonical state read after finality showed `Browser wallet proof pool`, `pool-2`, `Open for dependency acceptance`, `1 GEN`.

## What validators inspect

Validators inspect the allowlisted official incident source and the locked, mutually accepted dependency profiles. The semantic question is whether each accepted capability profile falls inside the incident's stated service and mode scope. The contract validates exact profile coverage and derives the credit consequence from the accepted exact impact set.

## Honest limitations / pending

- Current source policy is limited to the allowlisted OpenAI status incident origin/path.
- The contract decides agreed incident scope, not actual customer downtime, traffic, damages, legal liability, or SLA entitlement.
- Browser proof covers wallet connection, submitted/accepted/finality handling, and canonical state reload for pool creation. The full invite/accept/review/withdraw lifecycle is proven by Studionet scripts and canonical evidence.
- External adoption, billing integration, failover automation, and signed gateway usage receipts are future milestone headroom.

## Why Projects

IncidentScope is a full product, not only a standalone primitive. It includes a deployed Intelligent Contract, a wallet-enabled frontend, canonical contract reads, browser wallet write proof, transaction lifecycle handling, Vercel production, CI, and Studionet lifecycle evidence. The user-facing product lets providers and integrators create, inspect, and act on incident credit pools while GenLayer controls the semantic beneficiary decision.

## Short report

**Project name:** IncidentScope

**Description:** IncidentScope uses GenLayer validators to decide official incident scope before releasing funded GEN credits to impacted integrators.

**GitHub (public):** https://github.com/duclucky/incidentscope-v12

**Live app:** https://incidentscope-v12.vercel.app

**Contract (studionet):** 0xEAde9Cf8B12022b96e35c042e12f45E476706177
