# IncidentScope v1.2 submission audit

This file contains public, allowlisted submission evidence only. It excludes private keys,
environment values, raw RPC traces, validator node configuration, and wallet material.

## Submission identity

- Project: IncidentScope
- Category: Projects
- Repository: https://github.com/duclucky/incidentscope-v12
- Live app: https://incidentscope-v12.vercel.app
- Studionet contract: `0xEAde9Cf8B12022b96e35c042e12f45E476706177`
- Explorer: https://explorer-studio.genlayer.com/address/0xEAde9Cf8B12022b96e35c042e12f45E476706177

## Studionet deployment proof

Command:

```text
npm run studionet:deploy
```

Allowlisted output:

```text
Result: SUCCESS
contractAddress=0xEAde9Cf8B12022b96e35c042e12f45E476706177
deployTx=0xa8790193a2ced11618f62f6b0038b71e7317f7094c95d8b8b915251bb5e71386
deployStatus=FINALIZED consensus=MAJORITY_AGREE execution=SUCCESS
sourceCommit=5e890d9f2cfa1c9fd7c34a1a11b499ed252e4d5a
sourceSha256=b32ecf099d927d99ea56e3a4bf7ca42071fb46cb4f12d25576e8a3b88e399a63
metadata=incidentscope.contract.v1.2
```

Source files:

- `docs/evidence/studionet/deployment.json`
- `docs/evidence/studionet/deployment-attempts.json`

## Studionet lifecycle proof

Command:

```text
npm run studionet:lifecycle
```

Allowlisted output:

```text
Result: SUCCESS
poolId=pool-1
phase=CLOSED
lifecycleTxCount=7
createValueGEN=2
profileClass=IMPACTED accepted=True withdrawn=True
participantWithdrawnGEN=2
participantOutstandingGEN=0
sponsorRecoverableGEN=0
accountingInvariant=True
```

Source file:

- `docs/evidence/studionet/lifecycle.json`

## Local verification proof

Command:

```text
npm run check
```

Observed public summary:

```text
genvm-lint check passed for contracts/incidentscope.py
70 Python direct-mode tests passed
5 deployment parser/idempotency tests passed
52 frontend tests passed
frontend TypeScript check passed
frontend production build passed
```

## CI proof

Command:

```text
gh run view 32476855945 --repo duclucky/incidentscope-v12 --json status,conclusion,headSha,url
```

Observed output:

```json
{
  "status": "completed",
  "conclusion": "success",
  "headSha": "a9f9d22667c75d9e2991560d2ee4527b4d9c4e6b",
  "url": "https://github.com/duclucky/incidentscope-v12/actions/runs/32476855945"
}
```

## Production frontend/RPC proof

Commands:

```text
Invoke-WebRequest -Uri "https://incidentscope-v12.vercel.app" -UseBasicParsing
Invoke-WebRequest -Uri "https://incidentscope-v12.vercel.app/genlayer-rpc" -Method POST -ContentType "application/json" -Body "{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":91}"
```

Observed output:

```text
siteStatus=200
rpcStatus=200
rpcBody={"jsonrpc":"2.0","result":"0xf22f","id":91}
liveBundleContainsContractAddress=True
```

## Browser wallet proof

Source file:

- `docs/evidence/frontend/browser-wallet-proof.md`

Observed public result:

```text
Chrome + OKX Wallet connected as 0xc495...8272
Browser wallet transaction reached Submitted and Accepted - finality pending in the live UI
Canonical state then showed pool-2 created by 0xc495ef51618d03267a1f227afe5b27b38c748272
pool-2 title=Browser wallet proof pool
pool-2 phase=ENROLLING
pool-2 reserve=1 GEN
Live /pools page showed Browser wallet proof pool / pool-2 / Open for dependency acceptance / 1 GEN
```

## Pre-submission gate proof

Command:

```text
pwsh -ExecutionPolicy Bypass -File "D:\Genlayer Project\tools\genlayer-grading-bot\genlayer-precheck.ps1" -Project "D:\Genlayer Project\incidentscope-v12-clean" -Category projects -RepoUrl "https://github.com/duclucky/incidentscope-v12" -ExplorerUrl "https://explorer-studio.genlayer.com/address/0xEAde9Cf8B12022b96e35c042e12f45E476706177"
```

Latest gate result will be refreshed before final submission.

Observed output after adding this audit file:

```text
Summary: 0 BLOCKER, 4 WARN, 3 auto-verified OK
npm run check: PASS
git root OK
no internal/secret files tracked: OK
VERDICT: GATE OK - address MISSING items + confirm the manual (!) criteria, then submit
Project IncidentScope -Category projects: NO BLOCKER
WARN=4 AUTO=3
gradeEstimate=19/20
```

The remaining four WARN items are review warnings, not blockers:

- Payability metadata static detector warning for the method that reads `gl.message.value`.
- Project-specific contract class name `IncidentScopeContract` instead of literal `Contract`.
- Duplicate static detector warning that `_evaluate_official_incident` reads `self.profiles`.
- Same duplicate `_evaluate_official_incident` storage-read warning repeated by the checker.
