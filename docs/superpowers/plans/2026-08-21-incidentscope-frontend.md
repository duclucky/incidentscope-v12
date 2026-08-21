# IncidentScope Phase 3A frontend implementation plan

> Execute inline in this task. Follow TDD: add one focused failing test, run it and observe the expected failure, implement the smallest production change, then rerun that test before moving on.

**Goal:** Build the complete eight-route Vite/React frontend against an honest typed adapter boundary while preserving the locked UI/UX system.

**Architecture:** React Router provides route-level composition inside `AppShell`. Context providers own the typed contract adapter, wallet discovery/session, theme, and transaction notices. Pages consume user-shaped adapter results; the production default adapter exposes truthful unconfigured states and never fixtures.

**Stack:** Vite, React, TypeScript, React Router, Radix Dialog/Dropdown primitives, Phosphor icons, Plus Jakarta Sans, JetBrains Mono, Vitest, Testing Library, user-event, jest-dom, and axe-core.

---

## Task 1: Scaffold and test harness

**Files:** `frontend/package.json`, `frontend/tsconfig*.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/src/test/setup.ts`, `frontend/src/main.tsx`.

1. Add the package/tooling manifests and test setup.
2. Add a smoke test that imports the future application and fails because it is missing.
3. Run the targeted test and record the expected failure.
4. Add the minimum `main.tsx`/application entry to make the smoke import resolvable.
5. Run the targeted test again.

## Task 2: Typed domain and honest adapter boundary

**Files:** `frontend/src/domain/types.ts`, `frontend/src/adapters/contract.ts`, `frontend/src/adapters/unconfiguredContract.ts`, `frontend/src/adapters/ContractAdapterProvider.tsx`, tests beside adapters.

1. Test that unconfigured reads return `UNCONFIGURED`, never pool fixtures, balances, or transaction IDs.
2. Observe the failure.
3. Implement bounded raw enums plus user-shaped pool, participant, activity, transaction, and result types.
4. Implement the adapter interface and honest default.
5. Pass the focused tests and typecheck.

## Task 3: Wallet discovery and session controls

**Files:** `frontend/src/wallet/*`, `frontend/src/components/WalletPickerDialog.tsx`, `frontend/src/components/AccountMenu.tsx`, tests.

1. Test EIP-6963 discovery, injected fallback deduplication, no auto-selection, account request only after selection, and disconnect clearing memory state.
2. Observe failures before each behavior.
3. Implement provider descriptors, discovery, wallet context, centered Radix dialog, and account dropdown.
4. Keep unsupported/unconfigured chain writes disabled and explicit.

## Task 4: Tokens, shell, and navigation

**Files:** `frontend/src/styles/*`, `frontend/src/components/AppShell.tsx`, `frontend/src/components/BrandMark.tsx`, route tests.

1. Test all eight named routes and persistent navigation links.
2. Observe failure.
3. Implement self-hosted fonts, theme tokens, skip link, desktop sidebar, top utility row, mobile navigation, active route, and focus styles.
4. Verify route tests at desktop and narrow viewport assumptions.

## Task 5: Public Home and Help

**Files:** `frontend/src/pages/HomePage.tsx`, `frontend/src/pages/HelpPage.tsx`, tests.

1. Test the bounded product hook, official-source limitation, lifecycle, non-goals, primary CTA, and hero alt text.
2. Observe failure.
3. Implement the split hero using `/incidentscope-scope-hero.png`, concise evidence lifecycle, and help accordions.
4. Run accessibility checks for landmarks/headings/links.

## Task 6: Pools history and creation

**Files:** `frontend/src/pages/PoolsPage.tsx`, `frontend/src/pages/NewPoolPage.tsx`, pool components, tests.

1. Test honest empty/unconfigured/read-error results, search/filter behavior, and responsive labelled-list alternative.
2. Test that pool creation accepts only 1 or 2 GEN and remains disabled without wallet/network/adapter configuration.
3. Observe failures.
4. Implement the pages and staged review summary without fake fees, gas, balances, hashes, or finality.

## Task 7: Pool detail and contextual actions

**Files:** `frontend/src/pages/PoolDetailPage.tsx`, `frontend/src/components/pool/*`, tests.

1. Test each canonical user label and role/state action visibility.
2. Test loading, not found, reviewing, retryable, decided, closed, cancelled, submitted, finalized, and failed treatments.
3. Observe failures.
4. Implement state summary, participant outcome, official incident link, contextual actions, accounting summary, and optional technical transaction details.

## Task 8: Dependencies, Activity, and Settings

**Files:** `frontend/src/pages/DependenciesPage.tsx`, `ActivityPage.tsx`, `SettingsPage.tsx`, tests.

1. Test first-run/read-error/history states, lifecycle labels, network path honesty, and disconnect.
2. Observe failures.
3. Implement the three pages with no fixture data in production.

## Task 9: Transaction notices and error boundary

**Files:** `frontend/src/transactions/*`, `frontend/src/components/AppErrorBoundary.tsx`, tests.

1. Test `aria-live` announcements for submitted, accepted/decided, finalized, failed, and retryable.
2. Test that errors never become success and that a canonical reload is requested after finalization.
3. Implement minimal lifecycle/recovery plumbing behind the adapter.

## Task 10: Phase 3A verification

1. Run the full frontend test suite.
2. Run TypeScript with no emit.
3. Run the production Vite build.
4. Scan production source for `localStorage`, private-key patterns, fake hashes/balances/finality, lorem, emojis, purple/gradient/glass defaults, and leaked fixtures.
5. Inspect the route map against the brief and record exact command output.
6. Run the UI skill preflight at 375, 768, 1024, and 1440 px in a browser-like environment; fix failures without redesign.
7. Commit the verified Phase 3A baseline, then immediately enter Phase 3B self-review.
