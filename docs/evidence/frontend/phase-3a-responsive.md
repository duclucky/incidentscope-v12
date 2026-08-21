# Phase 3A frontend and responsive evidence

Date: 2026-08-21

This is frontend-preview evidence only. It is not a contract deployment,
Studionet transaction, wallet write, validator decision, or canonical onchain
state claim.

## Public artifacts

- GitHub: https://github.com/duclucky/incidentscope
- Vercel alias: https://incidentscope.vercel.app
- First deployment ID: `dpl_FYL47q5QRCP7xiJF46J1Q3mZbfVL`
- First deployment state reported by Vercel CLI: `READY`

`git rev-parse HEAD` and `git ls-remote origin refs/heads/main` both reported:

```text
19b42a2c921b2f7261e174902859a21f9fe8412c
```

## Browser verification

The in-app Browser loaded the local build and the Vercel alias. At 375x812,
768x900, 1024x900, and 1440x1000:

- the H1 remained `Decide incident scope before credits move`;
- the hero image completed with a non-zero natural width;
- the explicit `Connect wallet` control remained reachable;
- `document.documentElement.scrollWidth > innerWidth` was `false`.

All eight direct routes loaded through the Vercel SPA rewrite with the expected
H1 and no horizontal overflow:

```text
/                     Decide incident scope before credits move
/pools                Credit pools
/pools/new            Create a credit pool
/pools/:poolId        Pool details
/dependencies         Your dependencies
/activity             Activity
/settings             Settings
/help                 Help and evidence model
```

Browser console evidence after route traversal:

```text
warning/error log count: 0
```

The wallet picker showed `No browser wallet detected` rather than selecting or
simulating a wallet. The Phase 3B mobile navigation audit additionally verified
that the `More` menu exposes both `Settings` and `Help` without overflow.

## Automated verification

Command: `npm test` from `frontend/`

```text
Test Files  15 passed (15)
Tests       42 passed (42)
```

Command: `npm run typecheck` from `frontend/`

```text
tsc -b --pretty false
exit code 0
```

Command: `npm run build` from `frontend/`

```text
4658 modules transformed
dist/assets/index-z3-ILNl-.css  45.79 kB | gzip 16.27 kB
dist/assets/index-BS72zkrc.js  442.42 kB | gzip 131.91 kB
built in 650ms
```

The accessibility suite runs axe on Home and Pools with the color-contrast rule
disabled only because jsdom cannot calculate rendered colors. Token contrast was
verified separately:

```text
light foreground/background=19.28:1
light muted/background=7.24:1
light accent/background=5.67:1
light CTA text/accent=5.93:1
dark foreground/background=17.09:1
dark muted/background=9.10:1
dark accent/background=6.53:1
dark CTA text/accent=6.54:1
```

## Public-repository hygiene

The pre-push scans reported:

```text
SECRET_SCAN_FILES=0
FORBIDDEN_TRACKED=0
FORBIDDEN_UI_MATCHES=0
```

The ignored local `frontend/.env.local` and `.vercel/` link metadata were not
committed.
