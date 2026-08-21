# Phase 7 wallet and contract adapter verification

Date: 2026-08-21

Scope: local frontend implementation and automated verification. This evidence does not claim a
deployed contract, a browser-wallet transaction, or Studionet lifecycle finality.

## Wallet-provider acceptance

The frontend:

- discovers EVM providers through EIP-6963 and injected fallbacks for `window.ethereum`, OKX, Rabby,
  MetaMask, Coinbase, Brave, and compatible multi-provider injectors;
- opens a centered picker and requests accounts only after the user chooses a provider;
- switches or adds official Studionet chain `61999` (`0xf22f`) on that selected provider;
- exposes the connected address as an account-menu trigger with Disconnect;
- clears the selected provider and account on disconnect, which disables contract writes.

## RPC and lifecycle separation

Canonical Intelligent Contract reads use the same-origin `/genlayer-rpc` path. Local Vite and Vercel
route that path to the official Studionet IC RPC endpoint. Wallet writes use the selected EIP-1193
provider and never reuse the proxy read client. All nine public write methods have a frontend client
wrapper. The adapter reports submitted, accepted/decided, finalized, failed, and retryable states and
triggers canonical reads only at finalized/retryable boundaries.

## Red/green additions

Targeted command after adding the lifecycle coverage:

```text
npx vitest run src/components/pool/PoolDetailComponents.test.tsx src/transactions/TransactionProvider.test.tsx src/adapters/genlayerContract.test.ts
```

Observed output:

```text
Test Files  3 passed (3)
Tests       18 passed (18)
```

The added regression proves that canonical `RECOVER` remains actionable as “Close settled pool” when
the recoverable balance is 0 GEN, that `RETRYABLE` triggers canonical reload, and that all eight
post-creation actions map to their exact contract entrypoints. Pool creation is verified separately
with a 2 GEN value and the `create_pool` entrypoint.

## Repository-wide gate

Command:

```text
npm run check
```

Observed output:

```text
Lint passed (3 checks)
Validation passed
Contract: IncidentScopeContract
Methods: 20 (11 view, 9 write)
Python tests: 68 passed
Frontend test files: 17 passed
Frontend tests: 52 passed
TypeScript: PASS
Vite production build: 5108 modules transformed; built successfully
```

The Vite bundle-size advisory is non-blocking. Responsive screenshots, deployed address wiring, and
real transaction finality remain later phase gates.

## Browser-local same-origin proof

The in-app browser reloaded `http://127.0.0.1:5173/settings`, then issued a read-only JSON-RPC
`eth_chainId` request from the page origin to `/genlayer-rpc`.

Observed browser result:

```text
URL: http://127.0.0.1:5173/genlayer-rpc
HTTP status: 200
Response: {"jsonrpc":"2.0","result":"0xf22f","id":7}
DevTools network event: Network.responseReceived (Fetch)
Relevant loadingFailed / Failed to fetch / CORS errors: 0
```

This proves the configured local IC read route is browser-safe. It does not claim that a contract view
was read before a deployed address was configured.
