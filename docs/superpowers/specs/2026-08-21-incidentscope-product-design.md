# IncidentScope product design

## Context

IncidentScope is a Projects-track GenLayer application for two human roles: a sponsor that pre-funds a small incident credit pool and an integrator that accepts a sponsor-authored, address-bound capability profile unchanged. Validators interpret the exact incident selected from the fixed official status feed and decide the exact impacted set. The UI must make that bounded trust boundary understandable without exposing validator or storage internals.

## Design decision

Build a complete route-based application around a contextual pool-detail hub rather than a dashboard or method console. Public understanding, pool discovery, pool creation, participant history, activity, account settings, and help each get a dedicated route. The product begins behind a typed adapter whose honest default is unconfigured/empty; Phase 7 replaces only that adapter with real `genlayer-js` behavior.

## Users and journeys

The provider journey is Home -> Pools -> Create pool -> explicit wallet selection -> 1-2 GEN submission -> Pool detail -> lock enrollment -> review -> inspect finalized accounting -> recover unused reserve -> Activity.

The integrator journey is Home -> Pools -> Pool detail -> explicit wallet selection -> inspect and accept the exact sponsor invitation -> revisit -> inspect own finalized result -> withdraw eligible GEN -> Dependencies/Activity.

Both journeys distinguish wallet approval, submitted, accepted/decided, finalized, failed, and retryable states. A screen never claims chain data when reads are unconfigured.

## Information architecture

- `/`: value proposition, bounded trust model, lifecycle, limits, route into Pools.
- `/pools`: canonical search/filter/history with first-run and read-error states.
- `/pools/new`: provider workflow for bounded terms and exactly 1 or 2 GEN.
- `/pools/:poolId`: contextual state/actions and the main cross-role lifecycle.
- `/dependencies`: connected participant's profile history.
- `/activity`: transaction and canonical lifecycle history.
- `/settings`: wallet, network paths, theme, provider selection, disconnect.
- `/help`: evidence model, state labels, recovery, and honest limitations.

Desktop uses a persistent sidebar and compact top utility row. Mobile uses a bottom navigation for primary routes and an overflow menu for support pages. Pool detail remains the only place for pool-specific writes.

## Visual system

The offline design engine returned an operations pattern and a navy/sky palette. Taste rules override its Calistoga/Inter, gradient, glass, bento, card-shadow, and pulsing-dot suggestions.

- Design Read: trust-first B2B operations with premium utilitarian/editorial structure.
- Dials: variance 4, motion 3, density 5.
- Type: Plus Jakarta Sans Variable and JetBrains Mono.
- Color: off-white/navy surfaces with sky blue as the single accent; coherent light and dark themes.
- Shape: 8 px controls, 10 px panels, 12 px dialogs; pills only for tags/status.
- Depth: one-pixel borders; modal-only shadow.
- Motion: 160-220 ms opacity/translate feedback, disabled under reduced motion.
- Image: one generated technical-paper hero illustration showing bounded incident scope, with no text, people, dashboards, gradients, logos, or fake data.

The implementation source of truth is `design-system/incidentscope/MASTER.md`.

## Component model

- `AppShell`: route-aware sidebar, top utility row, mobile bottom navigation, skip link.
- `WalletProvider`: in-memory provider/account state and EIP-6963/injected discovery.
- `WalletPickerDialog` and `AccountMenu`: explicit choice and explicit disconnect.
- `ContractAdapterProvider`: typed read/write boundary with an honest unconfigured adapter.
- `TransactionNotice`: lifecycle state with `aria-live` announcements.
- `PageState`: loading, empty, error, and retry patterns.
- `PoolSummary`, `PoolStatus`, `PoolActionPanel`, `PoolHistory`: user-language pool detail.
- Page components for all eight routes, loaded by React Router.

## Data and honesty boundary

The adapter exposes user-shaped models, while retaining raw canonical enums in typed fields. Phase 4 adds canonical available-action flags plus mutually authenticated invitation/acceptance data; it removes frontend-only form/transaction states from the canonical pool enum. No local storage, fixture file, deployment JSON, or hardcoded transaction hash is canonical. Development scenarios may exist only in test builders and isolated modules that are never imported by production routes.

Until a contract address and RPC path are configured, reads return a typed `UNCONFIGURED` result and writes are disabled with a truthful setup explanation. Wallet discovery is real browser behavior in Phase 3A; chain parameters and transaction calls become active only after current values are verified in Phase 7.

## Accessibility and responsive behavior

- Semantic landmarks, a skip link, visible focus, correctly labelled inputs, dialog focus management, and `aria-live` transaction/error announcements.
- Minimum 44 px interactive targets.
- Pool mappings render as tables on wide screens and labelled rows on narrow screens.
- The hero stacks at mobile widths; fixed navigation reserves layout space.
- Every route has purposeful loading, empty, error, and success/finality treatment where applicable.

## Error and recovery model

- Wallet absence: offer provider guidance and keep read-only content usable.
- Wallet rejection: remain disconnected; never infer a signature.
- Wrong network: show a network-change requirement; writes remain disabled.
- Read error: retain the route and offer a canonical reload.
- Failed write: show the actual failure and retain legal retry only after re-reading canonical state.
- Retryable review: explain that official evidence was not verifiable and no credit or penalty moved.
- Unknown finality: show pending state and refresh; never relabel it as success.

## Testing strategy

Use Vitest, Testing Library, `user-event`, `jest-dom`, and `axe-core`/`vitest-axe` where stable. Tests precede production components. They cover route reachability, persistent navigation, honest unconfigured states, role/state contextual controls, wallet provider selection/disconnect, GEN-only validation, transaction labels, keyboard interaction, and key accessibility rules. Production build and TypeScript are separate gates.

## Accepted assumptions

- The provisional capability names may change in Phase 4; user actions and state semantics must not.
- Phase 3A has no live contract address, so an unconfigured adapter is the only honest production default.
- The user explicitly required continuous inline execution with no handoff, which serves as approval to proceed from this design into the test-first implementation plan.
