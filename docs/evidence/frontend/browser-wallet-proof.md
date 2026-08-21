# Browser wallet proof

Date: 2026-08-21

This file records public browser-wallet evidence only. It does not contain private keys,
wallet exports, raw RPC traces, browser cookies, local storage, passwords, or extension
internals.

## Environment

- Browser: user Chrome with OKX Wallet extension.
- Live app: https://incidentscope-v12.vercel.app
- Contract: `0xEAde9Cf8B12022b96e35c042e12f45E476706177`
- Network: Studionet, chain ID `61999` / `0xf22f`

## Wallet UI evidence

Chrome tab state after the user connected the wallet:

```text
url=https://incidentscope-v12.vercel.app/pools/new
connectedWalletButton=0xc495...8272
accountMenu=Connected with OKX Wallet / Copy address / Disconnect
```

The wallet picker and account/logout screenshots were supplied by the user during
manual wallet interaction. The browser tab showed the wallet-write controls only
after a wallet was connected.

## Browser transaction lifecycle evidence

The live app showed the following stages for the browser-submitted transaction:

```text
Submitted
Wallet submitted the transaction; consensus is pending.

Accepted - finality pending
Consensus accepted the transaction; finality is pending.
```

The app then displayed:

```text
Failed
The finalized transaction did not execute successfully.
```

Root-cause investigation found this was a frontend receipt-shape handling bug, not
a failed pool creation. The deployed contract canonical state showed the browser
wallet had created `pool-2`.

## Canonical state proof

Command:

```text
node --input-type=module -e "import { createClient } from 'genlayer-js'; import { studionet } from 'genlayer-js/chains'; const client=createClient({chain: studionet}); const address='0xEAde9Cf8B12022b96e35c042e12f45E476706177'; const count=Number(await client.readContract({address,functionName:'get_pool_count',args:[]})); const pools=[]; for (let i=Math.max(1,count-5); i<=count; i++){ const id='pool-'+i; const raw=await client.readContract({address,functionName:'get_pool',args:[id]}); pools.push({id,pool:JSON.parse(raw)}); } console.log(JSON.stringify({count,pools},null,2));"
```

Allowlisted output:

```text
count=2
pool-2.title=Browser wallet proof pool
pool-2.phase=ENROLLING
pool-2.reserve_gen=1
pool-2.sponsor=0xc495ef51618d03267a1f227afe5b27b38c748272
pool-2.incident_url=https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV
```

Live Chrome UI canonical read after the frontend fix and reload:

```text
url=https://incidentscope-v12.vercel.app/pools
Browser wallet proof pool
pool-2
Open for dependency acceptance
1 GEN
```

## Frontend fix

The failed UI state was caused by frontend logic that accepted only the normalized
`txExecutionResultName === FINISHED_WITH_RETURN` receipt shape. Studio browser
receipts can also expose successful finality as `execution_result: SUCCESS` with
`resultName: MAJORITY_AGREE`, matching the repository's deployment/lifecycle
receipt parser.

Fix commit:

```text
1b9c7a0 Handle Studio success receipt shape in frontend
```

Verification:

```text
npm run check
70 Python tests passed
5 deployment tests passed
53 frontend tests passed
frontend typecheck passed
frontend production build passed
```
