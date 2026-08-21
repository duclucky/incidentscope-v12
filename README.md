# IncidentScope

IncidentScope lets service providers pre-fund a bounded GEN credit pool, then uses GenLayer validators to decide which mutually accepted dependency profiles fall inside an official incident notice before any credit can be withdrawn.

## Submission status

- Category: Projects
- Status: deployed and submission-ready
- Public repository: <https://github.com/duclucky/incidentscope-v12>
- Live app: <https://incidentscope-v12.vercel.app>
- Studionet contract: `0xEAde9Cf8B12022b96e35c042e12f45E476706177`
- Contract explorer: <https://explorer-studio.genlayer.com/address/0xEAde9Cf8B12022b96e35c042e12f45E476706177>
- CI checks: <https://github.com/duclucky/incidentscope-v12/actions/workflows/check.yml>
- Copy-ready submission packet: [`docs/SUBMISSION-PACKET.md`](docs/SUBMISSION-PACKET.md)

## Why GenLayer is required

The sponsor has an incentive to narrow incident scope, and integrators have an incentive to overstate dependency impact. A normal database, EVM-only contract, or backend LLM would let one operator decide the beneficiary set. IncidentScope puts the semantic decision inside the Intelligent Contract: validators independently fetch the allowlisted official status page, classify every locked profile exactly once, and the contract derives the credit allocation from the validator-controlled result.

## What validators inspect

- Official evidence source: <https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV>
- Source policy: `OPENAI_STATUS_V1`
- Locked participant inputs: sponsor-authored, integrator-accepted, address-bound dependency profiles
- Consensus question: whether each locked capability profile falls inside the official incident's stated service and mode scope
- Invalid, unavailable, contradictory, or unverifiable evidence is non-penalizing and retryable; it does not move credits.

## Finalized consequence

The accepted exact impact set opens deterministic GEN withdrawal credits. Non-impacted or ambiguous profiles receive no credit and no penalty. Accounting is tracked in GEN, not wei/base units, with explicit withdrawal/recovery paths so reserve value is not orphaned.

## Verified evidence

- Contract source: one `gl.Contract` subclass, `IncidentScopeContract`, in [`contracts/incidentscope.py`](contracts/incidentscope.py)
- Local verification: `npm run check`
  - `genvm-lint check` passed
  - 70 Python direct-mode tests passed
  - 5 deployment parser/idempotency tests passed
  - 53 frontend tests passed
  - frontend TypeScript and production build passed
- Studionet deployment: [`docs/evidence/studionet/deployment.json`](docs/evidence/studionet/deployment.json)
- Studionet lifecycle: [`docs/evidence/studionet/lifecycle.json`](docs/evidence/studionet/lifecycle.json)
- Submission audit: [`docs/evidence/studionet/submission-audit.md`](docs/evidence/studionet/submission-audit.md)
- Browser wallet proof: [`docs/evidence/frontend/browser-wallet-proof.md`](docs/evidence/frontend/browser-wallet-proof.md)
- Frontend responsive proof: [`docs/evidence/frontend/phase-3a-responsive.md`](docs/evidence/frontend/phase-3a-responsive.md)

## Live lifecycle summary

- Deployment result: `Result: SUCCESS`
- Contract address: `0xEAde9Cf8B12022b96e35c042e12f45E476706177`
- Consequential lifecycle: created a 2 GEN pool, invited and accepted an integrator profile, locked enrollment, finalized a validator review, classified the profile as `IMPACTED`, withdrew 2 GEN to the integrator, recovered/closed with zero outstanding accounting.
- Browser wallet proof: Chrome + OKX Wallet created `pool-2` with `1 GEN`; canonical state showed `Browser wallet proof pool / pool-2 / Open for dependency acceptance / 1 GEN`.

## Frontend

The production app uses a browser EVM wallet provider layer, prefers EIP-6963 discovery with injected-provider fallbacks, displays a centered wallet picker, keeps wallet writes separate from GenLayer IC reads, routes IC reads through `/genlayer-rpc`, shows submitted/accepted/finalized/failed/retry states, and reloads canonical contract state after finality.

## Run locally

```bash
npm install
cd frontend
npm install
cp .env.example .env
npm run build
```

Set `VITE_CONTRACT_ADDRESS=0xEAde9Cf8B12022b96e35c042e12f45E476706177` in `frontend/.env` for the deployed Studionet contract.

## Full specification

The detailed product, contract, threat model, write-method safety matrix, claim-to-code matrix, and milestone headroom are in [`docs/README.md`](docs/README.md).

## Honest limitations

- The current source policy is limited to the allowlisted OpenAI status incident origin/path.
- The contract decides agreed incident scope, not actual customer-specific downtime, damages, legal SLA liability, or traffic volume.
- Browser proof covers wallet connection, transaction submission/acceptance/finality handling, and canonical state reload for pool creation; the full invite/accept/review/withdraw journey was proven by Studionet scripts and canonical evidence.
- External adoption, billing integration, failover automation, and signed gateway usage receipts remain milestone headroom.
