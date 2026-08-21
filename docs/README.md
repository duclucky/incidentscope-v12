# IncidentScope project specification

> This brief is initialized from `templates/PROJECT-SPEC-TEMPLATE.md`. Phase 3A
> locked the product blueprint; Phase 4 finalized the contract interface,
> authenticity boundary, safety matrices, and evidence plan before contract
> code was written.

## Identity

- Idea ID: IDEA-017
- Project name: IncidentScope
- Project slug: `incidentscope-v12`
- Category: Projects
- Status: DEPLOYED
- Repository: https://github.com/duclucky/incidentscope-v12
- Live app: https://incidentscope-v12.vercel.app
- Studionet contract: `0xEAde9Cf8B12022b96e35c042e12f45E476706177`
- Target network: Studionet (locked decision D1)

## One-sentence product hook

IncidentScope lets a pool sponsor pre-fund 1 or 2 GEN, lets the sponsor and each integrator mutually lock an address-bound capability profile, and lets GenLayer validators determine the exact impacted set from an allowlisted official incident page so only qualifying integrators can withdraw credits.

## Trust problem

- Decision that must not depend on one party: which pre-enrolled dependency profiles fall inside an official incident's stated scope.
- Why database/ordinary EVM/backend LLM is insufficient: the provider has an incentive to narrow scope, claimants have an incentive to overstate dependency, ordinary contracts cannot interpret changing natural-language incident updates, and one backend LLM is neither replicated nor validator-controlled.
- Value/rights/access at risk: a bounded 1-2 GEN provider-funded credit pool and each participant's withdrawal right.

## Fingerprint

- Trust problem: determine the exact qualifying set for a provider-funded incident credit pool.
- Actors/adversary: provider/funder, enrolled integrators, validators, and opportunistic nonparticipants.
- Evidence class + authenticity mechanism: an allowlisted HTTPS page on an official status origin plus a sponsor-authored, integrator-accepted onchain capability profile; exact fetched bytes and the accepted profile-ID set are bound to the review attempt.
- Consensus question: for each locked dependency profile, does the official incident narrative place that profile inside the incident's service and mode scope?
- State machine: ENROLLING -> LOCKED -> DECIDED -> CLOSED, with explicit RETRYABLE and CANCELLED recovery; DRAFT/REVIEWING are frontend-only form/transaction states.
- Direct consequence: the accepted exact impact set opens deterministic pro-rata GEN withdrawal credits; non-impacted and ambiguous profiles receive no credit and are never penalized.
- Reuse surface: provider-neutral credit-pool primitive for AI APIs, agent platforms, and DAO-owned compute/API services.

## Mandatory gate matrix

All fourteen gates passed during Phase 2. The detailed evidence remains in root `docs/IDEA-REGISTRY.md`; Phase 4 will restate the final contract-bound proof here.

| Gate | PASS/FAIL | Evidence/reason |
| --- | --- | --- |
| Replacement | PASS | A normal database would let the provider or operator choose the beneficiaries. |
| Judgment | PASS | Narrative incident scope versus mutually accepted natural-language capability profiles is semantic. |
| Evidence availability | PASS | The fixed official OpenAI incidents JSON feed returned HTTP 200 at 34,046 bytes and contained the exact selected incident ID once; the user-facing incident page also returned HTTP 200. |
| Evidence authenticity | PASS | Incident facts come from an allowlisted official origin; eligibility comes from a sponsor-authored invitation accepted onchain by the named integrator before review, never from claimant-only bytes. |
| Equivalence | PASS | The exact impact set and normalized classes can remain stable while rationale wording varies. |
| Consequence | PASS | Accepted impact membership opens a real GEN withdrawal credit. |
| Adversarial | PASS | Provider under-inclusion, claimant over-claiming, replay, injection, and malicious output are meaningful. |
| State model | PASS | Enrollment, lock, review, decision, withdrawal, retry, cancellation, and closure are explicit. |
| Reuse | PASS | The primitive fits at least three distinct service ecosystems. |
| Contract count | PASS | One contract owns the complete boundary; no pass-through consumer is needed. |
| Differentiation | PASS | It differs structurally from individual claim escrow, quarantine, prediction, and workflow blame designs. |
| Claim-to-code | PASS | Every public claim maps to a planned state, view, test, and evidence item. |
| Full lifecycle | PASS | Both roles can discover, fund/enroll, review, see finality, withdraw/recover, and revisit history. |
| Scope honesty | PASS | It determines agreed incident scope, not actual customer downtime or legal SLA liability. |

## Actors, roles and incentives

| Actor | Permissions | Value at risk | Incentive to bias |
| --- | --- | --- | --- |
| Sponsor/provider | Create/fund a pool, invite exact integrator/capability profiles, lock enrollment, request or retry review, cancel only through safe recovery | 1-2 GEN pool reserve | Narrow impact scope or avoid credits |
| Integrator | Inspect and accept only an address-bound sponsor invitation, inspect result, withdraw own credit | Eligibility and eventual credit | Accept an overbroad description or argue for expansive scope |
| Validator set | Fetch official evidence and classify all locked profiles | Protocol correctness | Malicious or malformed semantic output |
| Public visitor | Read product explanation and finalized pool summaries | None | None |

## Scope and non-goals

### In scope

- One provider-funded pool tied to one exact official status incident URL.
- Sponsor-authored, address-bound capability invitations that the named integrator must accept unchanged before review.
- Validator-controlled exact-set classification into `IMPACTED`, `NOT_IMPACTED`, or `AMBIGUOUS`.
- Deterministic, bounded GEN credit accounting and per-participant withdrawal.
- Browser wallet selection, transaction lifecycle feedback, canonical state reads, and recovery guidance.
- Searchable pool history, pool detail, participant dependency history, activity, settings, and help.

### Out of scope

- Proving actual customer-specific downtime, traffic volume, damages, or legal SLA liability.
- Arbitrary claimant-hosted evidence, screenshots, private logs, or uploaded files.
- Automatic slashing or negative penalties for missing, contradictory, unavailable, or unverifiable evidence.
- Fiat conversion, insurance underwriting, identity/KYC, or production-scale service monitoring.
- Current-version proof of real request traffic or customer-specific downtime. This is reserved for the signed-gateway-receipt milestone.
- Automatic failover and external billing integration, which remain milestone headroom.

## Final contract-capability sketch

This is a user-visible capability boundary, not an internal storage design.

| Role | User-visible action | Minimum view data | Meaningful states | Value/finality expectation | Retry/cancel/recovery |
| --- | --- | --- | --- | --- | --- |
| Provider | Create and fund a pool | Network, provider address, pool terms, 1-2 GEN reserve | wallet/network ready, submitted, finalized, failed | Native GEN is locked only after finalization | Failed submission changes no displayed canonical state |
| Sponsor/provider | Invite one integrator capability | Pool acceptance window, participant cap, normalized capability ID, exact profile | open, submitted, finalized, duplicate, closed | No value paid | Correct invalid input; never invite after lock/deadline |
| Integrator | Accept the exact address-bound invitation | Invitation author, capability ID, exact profile, deadline | invited, submitted, finalized, duplicate, closed | No value paid | Acceptance cannot edit the profile; never accept after lock/deadline |
| Sponsor/provider | Lock enrollment | Accepted/pending counts, deadline, sponsor authorization | enrolling, submitted, locked, failed | No value movement | Retry transaction only while legal; canonical reload resolves uncertainty |
| Provider | Request incident review | Locked profiles, official incident URL, source availability | locked, reviewing, decided, retryable | No credit opens before accepted/finalized verdict | Retry only a retryable attempt; cancel only through explicit safe path |
| Any user | Inspect result and history | Pool phase, concise result counts, participant class, timestamps | loading, empty, reviewing, decided, closed, unavailable | Read-only canonical state | Refresh and retry read without implying finality |
| Eligible integrator | Withdraw own credit | Withdrawable GEN, already-withdrawn state, network/account | decided, submitted, finalized, failed, already withdrawn | Exact canonical credit transfers once | Retry failed wallet transaction; canonical reload prevents double action |
| Provider | Recover unused reserve / cancel safely | Remaining reserve, actor-interest, expiry, terminal state | eligible recovery state only | Only uncommitted value returns; no orphaned reserve | Duplicate recovery is rejected/idempotent with unchanged accounting |

## Product/frontend blueprint

### Human users and jobs

| User/role | Primary job | Decision or outcome needed |
| --- | --- | --- |
| Service provider/operator | Pre-commit a small credit pool and obtain an independent scope decision | Know when enrollment/review is legal, what finalized, and what reserve remains |
| AI product integrator | Lock an honest dependency profile and collect an eligible credit | Know whether the profile is in scope, whether a credit exists, and whether withdrawal finalized |
| Returning participant | Revisit previous pools and transactions | Find a pool quickly, verify history, and recover from failed/retryable actions |
| Public evaluator | Understand the trust boundary without a wallet | See the value proposition, lifecycle, official-evidence limit, and honest non-goals |

### Navigation model

- Public landing uses a compact top navigation and routes users into Pools, Help, or wallet selection.
- Authenticated product routes use a persistent desktop sidebar and top utility row; mobile uses a compact bottom navigation plus an overflow menu.
- Active route state is visible and keyboard accessible.
- Pool detail is the contextual hub: all legal role-specific actions appear there, while global history and account settings remain separate.

### Information architecture and route map

| Screen/view | User purpose | Primary action | Required states | Mobile behavior |
| --- | --- | --- | --- | --- |
| `/` Home | Understand the trust problem, bounded outcome, and three-step lifecycle | Explore credit pools | public, wallet-unavailable, wallet-ready | Split hero stacks copy before illustration; lifecycle becomes vertical |
| `/pools` Pools | Search/filter canonical pools and resume prior work | Open a pool; provider may create one | first-run empty, loading, loaded, no search results, read error, unconfigured | Table becomes labelled cards; filter drawer remains keyboard accessible |
| `/pools/new` New pool | Provider defines official incident source, enrollment window, and 1-2 GEN reserve | Review and fund pool | disconnected, wrong network, invalid, ready, submitted, finalized, failed | One-column staged form with sticky summary above submit area |
| `/pools/:poolId` Pool detail | Understand current phase, own eligibility, history, and contextual actions | State-dependent: enroll, lock, review, retry, withdraw, or recover | loading, not found, enrolling, locked, reviewing, retryable, decided, closed, cancelled, transaction states | Summary precedes actions; exact mappings use stacked labelled rows |
| `/dependencies` Dependencies | Integrator manages and revisits bounded dependency descriptions | Open eligible enrollment or inspect a prior profile | disconnected, empty, loading, loaded, read error | Profile list uses compact cards with clear pool links |
| `/activity` Activity | Review wallet submissions and canonical adjudication/withdrawal milestones | Open related pool or retry a legal failed action | empty, loading, submitted, accepted/decided, finalized, failed, retryable | Vertical timeline; technical IDs stay inside optional details |
| `/settings` Settings | Choose wallet/provider, inspect network paths, theme, and disconnect | Connect/change/disconnect wallet | no provider, provider detected, connected, wrong network, switching, failure | Full-width account rows; modal remains centered within safe viewport |
| `/help` Help | Learn evidence rules, status meanings, recovery, limits, and contact-free self-service | Navigate to relevant pool or settings | static content, RPC configuration warning | Accordion sections with persistent headings and anchored navigation |

### Complete journeys

1. Sponsor/provider: Home -> Pools -> New pool -> explicit wallet selection -> network switch/add -> fund 1-2 GEN -> submitted/finalized feedback -> Pool detail -> invite an integrator with an exact capability profile -> lock after acceptance -> request review -> inspect decided accounting -> recover unused reserve -> Activity/history.
2. Integrator: Home -> Pools/search -> Pool detail -> explicit wallet selection -> inspect and accept the sponsor-authored profile unchanged -> finalized confirmation -> return later -> inspect exact own result -> withdraw eligible GEN -> finalized confirmation -> Dependencies/Activity history.
3. Failure recovery: any write -> submitted -> wallet/RPC failure or retryable review -> canonical reload -> contextual retry only if the connected role and state remain eligible; otherwise explanatory next step.

### Visibility matrix

| Function/data group | Visibility | Eligible role/state | User need or reason hidden |
| --- | --- | --- | --- |
| Product hook, lifecycle, scope limit | USER_PRIMARY | Everyone | Needed before wallet connection |
| Pool name, provider, phase, official incident link, enrollment window, reserve in GEN | USER_PRIMARY | Everyone reading a pool | Core decision context |
| Search, phase filter, role filter | USER_PRIMARY | Anyone on Pools | Revisit and resume work |
| Connected account, selected wallet, network | USER_PRIMARY | Connected user | Required to authorize writes honestly |
| Own dependency profile and own classification | USER_PRIMARY | Enrolled integrator after load/decision | Determines eligibility and next action |
| Aggregate class counts and remaining reserve | USER_PRIMARY | Pool readers after decision | Explains outcome/accounting without exposing internals |
| Create/invite/accept/lock/review/withdraw/recover controls | USER_CONTEXTUAL | Authorized role in legal state only | Visible exactly when a user can act |
| Transaction hash and explorer link | USER_CONTEXTUAL | User with a real submitted transaction | Optional verification material |
| Exact fetched evidence digest, attempt ID, normalized validator payload | SYSTEM_ONLY | Never in primary workflow | Reviewer/debug detail, not needed for user decisions |
| Raw storage maps, prompts, validator rationale, node configuration | SYSTEM_ONLY | Never | Security and FE-SURFACE boundary |
| Design fixtures and test scenario selectors | SYSTEM_ONLY | Development/test only | Must never appear as live state |

### Final UI action matrix

| Visible control | Contract capability/method | Eligible role | Legal state | Input/value | Finality | Failure/recovery |
| --- | --- | --- | --- | --- | --- | --- |
| Create credit pool | `create_pool` | Sponsor/provider | wallet ready, no duplicate ID | bounded terms + 1 or 2 GEN | submitted -> finalized -> canonical reload | wallet rejection stays local; failed transaction creates no pool |
| Invite dependency | `invite_dependency` | Sponsor/provider | ENROLLING, before acceptance deadline, participant cap not reached | integrator address + capability ID + bounded exact profile, 0 GEN | submitted -> finalized -> reload pool/account view | wrong caller/address, duplicate, late, or oversized input leaves state unchanged |
| Accept dependency | `accept_dependency` | Named integrator | ENROLLING, pending invitation, before acceptance deadline | pool ID, 0 GEN; profile is immutable | submitted -> finalized -> reload participant view | wrong account, edited/duplicate/late acceptance leaves state unchanged |
| Lock enrollment | `lock_enrollment` | Sponsor/provider | ENROLLING and lock condition met | pool ID, 0 GEN | submitted -> finalized -> reload phase | retry only if phase remains ENROLLING |
| Request review | `request_review` | Sponsor/provider | LOCKED, source/review window legal | pool ID, 0 GEN | submitted -> accepted/decided -> finalized -> reload | unavailable/unverifiable/invalid normalized output becomes non-penalizing RETRYABLE |
| Retry review | `retry_review` | Sponsor/provider | RETRYABLE and retry bounds legal | pool ID, 0 GEN | same review lifecycle with a fresh attempt ID | show source/retry guidance; never reuse a stale attempt ID |
| Withdraw credit | `withdraw_credit` | Impacted integrator | DECIDED, before claim deadline, positive credit, not withdrawn | pool ID, 0 GEN | submitted -> finalized transfer -> reload credit/accounting | failed transfer remains withdrawable; duplicate cannot double-pay |
| Recover reserve | `recover_reserve` | Sponsor/provider | DECIDED recoverable remainder, all credits withdrawn, or claim deadline reached | pool ID, 0 GEN | submitted -> finalized transfer -> reload accounting; may close pool | cannot take live participant credit before expiry; duplicate cannot double-transfer |
| Cancel safely | `cancel_pool` | Sponsor/provider | ENROLLING with no accepted interest, or ENROLLING/LOCKED/RETRYABLE after review expiry | pool ID, 0 GEN | submitted -> finalized refund -> reload terminal state | forbidden while review remains timely and accepted participant interest exists |
| Connect wallet | EIP-6963 / injected provider adapter | Any user | provider detected | explicit provider choice | account permission + chain readiness | no provider/help; rejection leaves writes disabled |
| Disconnect | local wallet-session adapter only | Connected user | any UI state | none | immediate UI session clear | canonical data remains read-only; writes disabled |

### User-facing state language

| Canonical status/violation | User-facing label | User consequence/next step |
| --- | --- | --- |
| DRAFT | Setup in progress | UI-only form state before `create_pool`; it is not a persisted contract phase |
| ENROLLING | Open for dependency acceptance | Sponsor may invite and each named integrator may accept the exact profile before the displayed deadline |
| LOCKED | Enrollment locked | Sponsor/provider may request the official incident review |
| REVIEWING | Reviewing official incident scope | UI transaction lifecycle only while `request_review` or `retry_review` is pending; it is not a persisted contract phase |
| RETRYABLE | Official evidence could not be verified | Provider may retry while the recovery window remains legal |
| DECIDED | Scope decision finalized | Impacted users may withdraw; others can inspect the bounded result |
| CLOSED | Credits settled | No further withdrawal or enrollment action is available |
| CANCELLED | Pool cancelled safely | No participant credit was orphaned; provider recovery is complete |
| IMPACTED | In incident scope | An eligible finalized credit is available |
| NOT_IMPACTED | Outside stated incident scope | No credit opens; no penalty applies |
| AMBIGUOUS | Scope not clear enough | No credit or penalty; the result remains non-penalizing |
| WRONG_NETWORK | Network change needed | Select the supported EVM-compatible wallet network before writing |
| UNCONFIGURED_READ | Contract reads not configured | Product explanation remains available; canonical pool data is not claimed |

### Wallet and network behavior

- Discover providers with EIP-6963 first, then deduplicate injected fallbacks including `window.ethereum`, MetaMask, Rabby, OKX, Coinbase, Brave, and compatible providers when present.
- Never auto-pick a provider. The user opens a centered accessible selection dialog and explicitly chooses one before account permission is requested.
- Keep selected provider and account in React memory only; do not use local storage as canonical or wallet-session truth.
- The clicked account address opens a menu with selected wallet, network, copy-address, and disconnect. Disconnect clears the selected provider/account and disables writes.
- Before each write, switch/add the current official EVM-compatible network through the selected provider. Phase 7 will bind verified current parameters; Phase 3A labels the unconfigured state honestly.
- Wallet writes and GenLayer Intelligent Contract reads use distinct typed adapter paths. Browser-unsafe IC RPC reads go through a same-origin proxy.
- Transaction feedback distinguishes wallet confirmation, submitted, accepted/decided, finalized, failed, and retryable. Canonical views reload after finalization.

### Visual direction and preservation constraints

- Source of truth: `design-system/incidentscope/MASTER.md`, generated by the offline UI/UX engine and corrected under its taste rules.
- Preserve: navy/sky evidence palette; Plus Jakarta Sans + JetBrains Mono; 4 px spacing base; flat one-pixel borders; 8/10/12 px radius hierarchy; split hero with generated scope illustration; desktop sidebar/mobile navigation; restrained motion.
- Allowed later edits: typed adapter wiring, real data/state rendering, role authorization, explorer links, network/account feedback, and honest edge-state copy.
- Forbidden later redesign: new visual library, gradients, purple/neon, glassmorphism, bento dashboards, fake metrics, generic method buttons, or exposing system/reviewer internals.
- System/reviewer details excluded from primary UI: raw hashes, prompts, validator payloads/rationale, attempt IDs, storage maps, node configuration, submission proof, and fixture controls.

## State model

### Stable IDs

- `pool_id`: monotonically increasing unsigned integer assigned by the contract; never supplied by a caller and never reused.
- `profile_id`: monotonically increasing unsigned integer assigned when a sponsor creates an invitation. It remains bound to one pool, one integrator address, one normalized capability ID, and one exact capability profile.
- `attempt_id`: monotonically increasing per-pool review attempt number. The current attempt is read from state; callers never submit or hardcode it.
- Review identity: `(contract_address, pool_id, attempt_id, source_policy_hash, incident_url, ordered accepted profile_id set)`.
- Account identity: canonical lowercase address representation used only for lookup; authorization always uses `gl.message.sender`.

### Structured storage

- Global counters: `next_pool_id`, `next_profile_id`.
- `pools[pool_id]`: sponsor, title, immutable incident URL, source policy ID/hash, phase, creation/acceptance/review/decision/claim timestamps, reserve and accounting totals, counts, current attempt, accepted source digest, and terminal reason.
- `profiles[profile_id]`: pool ID, sponsor, named integrator, normalized capability ID, exact bounded profile, invitation/acceptance timestamps, acceptance flag, classification, credit amount, withdrawal flag/timestamp.
- `pool_profile_ids[pool_id]`: bounded ordered list of at most eight profile IDs. Consensus uses only the accepted subset snapshotted at lock.
- `account_pool_ids[address]`: bounded/indexed references needed for account history without treating frontend storage as canonical.
- `attempts[(pool_id, attempt_id)]`: schema/policy identity, expected profile IDs, outcome (`VERIFIED`, `RETRYABLE`, or rejected), accepted digest when verified, and safe failure code. Raw prompts, full fetched pages, validator configuration, and rationale are not stored.
- `withdrawable[(pool_id, integrator)]`: exact credit ledger entry; one accepted profile per address per pool.
- All maps are keyed by stable IDs. There are no global `last_*` records that another caller can overwrite.

### State machine

```text
[ENROLLING] --invite_dependency/sponsor--> [ENROLLING]
[ENROLLING] --accept_dependency/named integrator--> [ENROLLING]
[ENROLLING] --lock_enrollment/sponsor--> [LOCKED]
[LOCKED] --request_review valid consensus/sponsor--> [DECIDED]
[LOCKED] --request_review unavailable or unverifiable/sponsor--> [RETRYABLE]
[RETRYABLE] --retry_review valid consensus/sponsor--> [DECIDED]
[RETRYABLE] --retry_review unavailable or unverifiable/sponsor--> [RETRYABLE]
[DECIDED] --withdraw_credit/impacted integrator--> [DECIDED]
[DECIDED] --recover_reserve/sponsor, all obligations cleared or expired--> [CLOSED]
[ENROLLING|LOCKED|RETRYABLE] --cancel_pool/sponsor under exact safe rules--> [CANCELLED]
```

`DRAFT` is a frontend form state only. `REVIEWING` is a frontend transaction lifecycle state while a review transaction is pending. Neither is persisted as a canonical contract phase.

### Temporal entrypoint rules

- Canonical transaction-time source: `gl.message.datetime`; browser time, provider time, page JavaScript time, and LLM-generated current time are never authoritative.
- Create bounds: `acceptance_deadline` must be strictly after transaction time and no more than seven days ahead; `review_expiry` must be strictly after `acceptance_deadline` and no more than seven days later. The contract derives `claim_deadline = decision_at + 7 days`.
- Default deadline semantics: an action requiring an open window uses `now < deadline`; equality is late. An expiry/recovery action uses `now >= deadline`; equality is eligible.
- `invite_dependency` and `accept_dependency` each independently require phase `ENROLLING` and `now < acceptance_deadline`, even if phase is stale.
- `lock_enrollment` requires at least one accepted profile and either `(all invitations accepted and pending_invite_count == 0)` for early lock or `now >= acceptance_deadline`. Pending invitations expire without becoming profiles when the deadline is reached.
- `request_review` and `retry_review` each independently require `now < review_expiry`.
- `withdraw_credit` independently requires `now < claim_deadline`; exact equality is late even if phase remains `DECIDED`.
- `recover_reserve` before the claim deadline can transfer only the already unallocated/rounding remainder. It may close early only when all participant credits are withdrawn. At `now >= claim_deadline`, it first expires every unwithdrawn credit into sponsor-recoverable value and then transfers the remaining reserve.
- `cancel_pool` requires the sponsor plus either: `ENROLLING` with zero accepted profiles; or `now >= review_expiry` while phase is `ENROLLING`, `LOCKED`, or `RETRYABLE`. It is forbidden after a valid decision.

### Illegal transitions

- Any caller-supplied pool/profile/attempt ID that is missing, from another pool, or not current.
- Invitation or acceptance at/after the acceptance deadline even when phase remains stale `ENROLLING`.
- Lock with zero accepted profiles, or early lock with a pending invitation.
- Review before lock, after review expiry, after decision, or by a non-sponsor.
- Retry from any phase except `RETRYABLE`, or retrying a stale attempt ID indirectly.
- Withdrawal by a non-integrator, for `NOT_IMPACTED`/`AMBIGUOUS`, at/after claim deadline, after withdrawal, or after closure.
- Sponsor recovery that would consume a live unwithdrawn credit before claim expiry.
- Cancellation after `DECIDED` or while timely accepted participant interest exists.
- Any transition based on malformed, incomplete, duplicate, extra-ID, invalid-class, or unverifiable validator output.

### Authorization

- Pool sponsor is `gl.message.sender` at `create_pool` and is immutable.
- Only that sponsor may invite, lock, request/retry review, recover reserve, or cancel.
- Only the exact invited address may accept its invitation.
- Only the exact accepted integrator address may withdraw its own credit.
- Views are public and never confer write authorization.
- No administrator, operator, frontend, or offchain service can alter a pool outcome.

### Idempotency and double-action prevention

- One invitation/profile per `(pool_id, integrator)`; duplicate creation reverts before mutation.
- Acceptance is a one-way false-to-true flag; duplicate acceptance reverts unchanged.
- Lock is one-way; duplicate/stale lock reverts unchanged.
- Each review call allocates the next attempt ID internally. Only one successful decision is possible; later review calls are forbidden.
- Settlement initializes each credit exactly once only after all invariants pass.
- Withdrawal debits the credit ledger and marks withdrawn before emitting transfer; a duplicate finds zero/withdrawn and reverts.
- Sponsor recovery debits sponsor-recoverable and pool outstanding accounting before emitting transfer.
- Cancellation is terminal and refunds once. Repeated cancellation/recovery cannot double-refund.

## Write-method safety matrix

| Method | Caller | Allowed states | Forbidden states | Temporal/expiry gate | Idempotency | Value/accounting effect | Views affected | Negative tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `create_pool` | Any EOA sponsor | New ID only | Existing/reused ID impossible; malformed terms | `now < acceptance_deadline <= now + 7d`; `acceptance_deadline < review_expiry <= acceptance_deadline + 7d` | Contract assigns fresh ID; one transaction creates once | Receives exactly 1 or 2 GEN; initializes isolated reserve | pool count/list/detail/account pools/accounting | wrong value, bad URL/policy, short/long title, past/equal/far deadlines, unexpected payable metadata |
| `invite_dependency` | Pool sponsor | `ENROLLING` | all other phases; wrong pool/caller; cap reached | Own guard `now < acceptance_deadline` | one `(pool, integrator)`; fresh profile ID | no value; adds pending profile only | pool detail, account invitation/dependencies, counts | wrong caller, zero/sponsor address, duplicate, late with stale phase, malformed capability/profile, ninth profile |
| `accept_dependency` | Exact named integrator | `ENROLLING`, pending invite | accepted/missing invite; all other phases | Own guard `now < acceptance_deadline` | one false-to-true acceptance | no value; adds profile ID to immutable review snapshot eligibility | participant view, pool accepted/pending counts, dependencies | wrong caller/pool, duplicate, exact deadline +/-1, state/accounting unchanged on reject |
| `lock_enrollment` | Pool sponsor | `ENROLLING`, accepted count > 0 | all other phases; zero accepted; early with pending invite | `now >= acceptance_deadline` OR all issued invites accepted with zero pending | one-way phase change | no transfer; snapshots ordered accepted profile IDs | pool phase, participant snapshot, available actions | wrong caller/state, zero accepted, pending invite early, boundary -1/0/+1 with stale phase |
| `request_review` | Pool sponsor | `LOCKED` | all other phases | Own guard `now < review_expiry` | internally creates next attempt; one settlement max | valid result allocates credits/remainder; invalid/unavailable result changes only phase/attempt status to `RETRYABLE`; reserve total unchanged | attempt summary, pool phase/counts/digest, profiles, credits, accounting | wrong caller/state, boundary -1/0/+1, malicious leader/validator, digest mismatch, exact-set/class/root violations, no accounting change on reject |
| `retry_review` | Pool sponsor | `RETRYABLE` | all other phases; stale or already decided | Own guard `now < review_expiry` | fresh attempt ID derived from current state; never caller-supplied | same settlement rules; previous failed attempt cannot allocate | attempt summary, phase, profiles, credits, accounting | wrong caller/state, duplicate/stale retry, boundary -1/0/+1, structural parser failure stays retryable/no movement |
| `withdraw_credit` | Accepted impacted integrator | `DECIDED`, positive unwithdrawn credit | all other phases/classes; wrong account; already withdrawn | Own guard `now < claim_deadline`; equality is late | debit/withdrawn flag before transfer | transfers exactly caller credit in GEN; reduces outstanding credits once | own profile/credit, pool outstanding/withdrawn totals, activity | wrong caller/state/class, zero credit, duplicate, deadline -1/0/+1 with stale phase, failed transfer reverts ledger |
| `recover_reserve` | Pool sponsor | `DECIDED` with recoverable amount, all credits withdrawn, or claim expired | pre-decision except cancellation path; wrong caller; live credits before expiry | Before deadline only existing remainder; at `now >= claim_deadline` expire unwithdrawn; equality eligible | debits recoverable before transfer; closes once obligations zero | transfers only sponsor-recoverable GEN; never live participant credit | pool phase/accounting, participant expired status, activity | wrong caller/state, zero recoverable, early live-credit theft, duplicate, deadline -1/0/+1, ledger invariant/failed transfer |
| `cancel_pool` | Pool sponsor | `ENROLLING` with zero accepted, or `ENROLLING|LOCKED|RETRYABLE` after review expiry | `DECIDED|CLOSED|CANCELLED`; timely accepted interest | Zero-interest cancellation may be immediate; otherwise `now >= review_expiry`, equality eligible | terminal flag and reserve debit before transfer | refunds entire still-locked reserve once; no participant penalty/credit | phase, terminal reason, accounting, participant status | wrong caller/state, accepted interest before expiry, boundary -1/0/+1, duplicate, no double refund/orphan |

## Frontend lifecycle coverage matrix

| Canonical state | User action | Contract write | UI component | Frontend test | Evidence status |
| --- | --- | --- | --- | --- | --- |
| No pool | Create/fund 1 or 2 GEN | `create_pool` | `NewPoolPage` | reserve validation/disconnected tests in `poolsPages.test.tsx` | Local UI tested; real adapter and Studionet wallet evidence pending Phase 7/8 |
| `ENROLLING` | Sponsor invites exact integrator/capability | `invite_dependency` | `PoolActionPanel` invitation form | invitation form/action test in `PoolDetailComponents.test.tsx` | Local UI tested; real adapter/network pending Phase 7/8 |
| `ENROLLING` | Named integrator accepts unchanged profile | `accept_dependency` | `PoolActionPanel` invitation review/accept control | immutable invitation acceptance test in `PoolDetailComponents.test.tsx` | Local UI tested; real adapter/network pending Phase 7/8 |
| `ENROLLING` | Sponsor locks legal snapshot | `lock_enrollment` | `PoolActionPanel` lock control | role/state tests in `PoolDetailComponents.test.tsx` | Local UI tested; canonical timing integration/network pending |
| `LOCKED` | Sponsor requests official review | `request_review` | `PoolActionPanel` review control + transaction notices | pool action and transaction lifecycle tests | Local UI tested; nondet/Studionet evidence pending |
| `RETRYABLE` | Sponsor retries fresh attempt | `retry_review` | `PoolActionPanel` retry control | retry role/state and lifecycle tests | Local UI tested; source-failure network evidence pending |
| `DECIDED` | Impacted integrator withdraws once | `withdraw_credit` | `PoolActionPanel` withdrawal control | class/role/duplicate visibility tests | Studionet lifecycle: `WITHDRAW` finalized and integrator balance increased 2 GEN |
| `DECIDED` | Sponsor recovers only legal remainder/expired value | `recover_reserve` | `PoolActionPanel` recovery control | canonical-action recovery test in `PoolDetailComponents.test.tsx` | Studionet lifecycle: `RECOVER` finalized and pool closed with zero outstanding accounting |
| `ENROLLING|LOCKED|RETRYABLE` safe path | Sponsor cancels | `cancel_pool` | `PoolActionPanel` contextual cancel control | canonical-action cancellation test in `PoolDetailComponents.test.tsx` | Local UI tested; cancellation was not needed in the successful v1.2 lifecycle |
| Any canonical phase | Read pool/profile/accounting after finality | no write | Pools, Pool detail, Dependencies, Activity | route/adapter/finality reload tests | Honest unconfigured adapter tested; real reads pending Phase 7 |
| Wallet disconnected/wrong network | Select provider, switch/add chain, or disconnect | wallet provider API, not contract | wallet picker/account menu/settings | wallet discovery/selection/disconnect tests | Local browser tested; real extension and network proof pending |

No script-only write is claimed as a browser-complete product step. Contract, adapter, wallet, deployment, and consequential Studionet lifecycle evidence are implemented; real extension-signed browser transaction evidence remains a separate proof item.

## Evidence policy

- Authoritative sources: release v1 accepts only `OPENAI_STATUS_V1`: the user-facing incident identity is an exact HTTPS page under `https://status.openai.com/incidents/<26-character ULID>`, while validators construct and fetch the fixed official JSON feed `https://status.openai.com/api/v2/incidents.json` and select that exact ID. Other providers require a separately versioned, tested policy rather than a caller-supplied domain.
- Provenance/authentication: validators fetch the fixed official JSON feed themselves and require one exact matching incident ID; the sponsor cannot submit response bytes, redirects, screenshots, or claimant-hosted JSON.
- Authorized attestor/signer: capability eligibility requires two onchain attestations: sponsor creates the address-bound exact profile and the named integrator accepts it unchanged. `gl.message.sender` authenticates both transactions.
- Anti-replay event/digest identity: contract address + pool ID + fresh attempt ID + source policy hash + immutable incident URL + ordered accepted profile IDs + accepted exact-content digest.
- Signed timestamp bounds: no external signed timestamp is claimed. Transaction windows use `gl.message.datetime`; page update timestamps are source facts checked by independent validator replay and must not be materially in the future relative to the review transaction. Failure is `RETRYABLE`, never a payout.
- Immutable policy/source version URLs and hashes: policy string `incidentscope-openai-status-v1|page=https://status.openai.com/incidents/<ULID>|feed=https://status.openai.com/api/v2/incidents.json|max_bytes=100000|max_profiles=8|schema=1`; SHA-256 `88910f256e8888c21257f88a5ef0c58fd8b118a5648e4a60e2bb56365123851f`. Contract and deployment evidence expose this exact value. Remote page, JSON text, or robots instructions cannot change it.
- Allowed schemes/domains/paths: HTTPS only; exact host `status.openai.com`; user incident path exactly `/incidents/` plus one 26-character uppercase alphanumeric ULID; fetched path exactly `/api/v2/incidents.json`; no credentials, fragment, alternate port, query, redirect to another host, or IP literal.
- Time/window rules: source fetch occurs only inside `request_review`/`retry_review` before `review_expiry`; update timestamps must form a coherent nondecreasing history and must not be later than review time plus five minutes.
- Size/count bounds: maximum fetched response 100,000 bytes after redirects; maximum eight profiles; capability ID 3-64 lowercase ASCII characters/digits/dot/hyphen; capability profile 20-600 printable ASCII characters; title 3-80 printable ASCII characters; strict response schema and bounded text fields.
- Missing evidence: `RETRYABLE`; no class, credit, penalty, or reserve movement.
- Contradictory evidence: `RETRYABLE`; examples include incident identity mismatch, incoherent status/update history, or page title/body conflict that prevents exact scope.
- Unavailable source: `RETRYABLE`; only the attempt/failure code advances.
- Invalid/unverifiable attestation: missing sponsor invitation, wrong integrator acceptance, profile mutation, source-origin mismatch, digest mismatch, or policy-hash mismatch is non-penalizing and cannot reach settlement.
- Prompt-injection boundary: incident text and capability profiles are quoted untrusted data. The fixed prompt says they cannot define instructions, schema, policy, identity, time, or payout. Output is strict JSON validated independently; prose never directly moves value.
- Private/unverifiable evidence excluded: screenshots, customer logs, uploaded documents, emails, private dashboards, claimant JSON, model claims about signatures, and hash-only real-world assertions.

A SHA-256 digest proves exact byte stability for the fetched review content; it does not independently prove the real-world incident. Origin policy plus validator-independent HTTPS replay authenticates the official statement being interpreted.

### Fact authentication matrix

| Consequential fact | Who can fabricate it? | Authoritative source / issuer | Verification method | Replay/timestamp binding | Failure consequence | Required negative test |
| --- | --- | --- | --- | --- | --- | --- |
| Sponsor identity and reserve ownership | arbitrary caller/frontend | transaction sender and value | deterministic `gl.message.sender` plus exact 1/2 GEN payable check | pool ID and creation transaction time | revert before pool creation | wrong sender assumptions, zero/other value, non-payable metadata |
| Integrator is eligible for a specific capability profile | integrator alone or sponsor alone | sponsor invitation plus named integrator acceptance | two separate sender-authorized writes; immutable byte-for-byte profile | pool/profile IDs and timestamps before lock | missing/invalid pair cannot enter expected ID set | forged caller, profile/address substitution, duplicate/replay, late acceptance |
| Incident identity and official narrative | sponsor, claimant, arbitrary website | hardcoded official status JSON feed | exact page-ID policy; fixed-feed leader fetch; independent validator refetch; one matching ID plus digest agreement | attempt ID, policy hash, page URL/incident ID, feed digest, update timestamps vs transaction time | `RETRYABLE`, reserve/credits unchanged | redirect/host confusion, ID missing/duplicate, oversized/changed feed, future/incoherent timestamps |
| Expected settlement population | leader omitting or adding IDs | locked onchain accepted profile list | deterministic exact ordered ID set passed to nondet; output set equality/uniqueness checks | pool lock snapshot + attempt ID | reject to `RETRYABLE`; no accounting change | extra/missing/duplicate/foreign ID |
| Impact classification | sponsor, integrator, malicious leader | GenLayer validator consensus over authenticated source and locked profiles | semantic equivalence on exact ID-to-enum mapping after independent replay | attempt identity and source digest | invalid/unagreed output non-penalizing | malicious leader, semantic replay, invalid enum, prompt injection |
| Review/claim deadlines | browser, source page, LLM | GenVM transaction clock and immutable pool fields | deterministic comparison at every affected entrypoint | pool ID and stored deadline | revert unchanged | boundary -1, exact, +1 with stale phase |
| Credit and recovery amount | leader prose or caller | deterministic contract accounting | derive from reserve and accepted `IMPACTED` set; never accept payout amount from JSON | pool/attempt and settled ledgers | revert/`RETRYABLE` before transfer | supplied payout fields ignored/rejected, rounding and zero-impact cases |

## Fetched-content verification matrix

| Stored/fetched item | Recompute/compare point | Exact comparison | Mismatch behavior | Consequence guard | Test |
| --- | --- | --- | --- | --- | --- |
| Accepted source digest | leader hashes the exact bounded official JSON-feed response used for classification; validator refetches and hashes its exact response before accepting | lowercase 64-hex SHA-256 equality plus exact feed/page-ID/policy identity | attempt becomes `RETRYABLE`; do not store as accepted digest | no classification or accounting mutation occurs before comparison passes | changed-feed bytes, malformed digest, redirect, digest from different URL/ID |
| Locked profile snapshot | deterministic contract builds ordered accepted profile IDs and exact stored profile strings for each attempt | every expected ID exactly once and profile bytes match storage | reject normalized output to `RETRYABLE` | credits cannot initialize | missing/extra/duplicate ID, cross-pool ID, mutated profile |
| Source policy | contract constant compared with output schema policy hash | exact v1 ID/hash equality | reject to `RETRYABLE` | no hard state/value consequence | wrong version/hash and web prompt attempting policy override |

## Consensus design

### Leader task

- Inputs: no arguments to the nondeterministic leader closure; it closes over immutable pool/attempt data prepared deterministically by the public method.
- Fetch: fixed official JSON feed under `OPENAI_STATUS_V1`, redirect/size bounded, then require one exact match for the immutable page ULID. Fetch/selection failure returns the strict non-penalizing source status rather than invented content.
- Extraction: exact incident ID/title/current status, component records, complete incident-update sequence with timestamps, bounded text used for scope, canonical page URL, and SHA-256 of exact fetched JSON bytes.
- Normalization: each accepted profile ID exactly once; capability ID/profile are data; class enum only `IMPACTED`, `NOT_IMPACTED`, or `AMBIGUOUS`; no payout amount or consequence instruction is accepted.
- Structured output: strict JSON object with keys `schema_version`, `source_policy_hash`, `source_status`, `canonical_url`, `incident_id`, `content_digest`, `source_updated_at`, `verdicts`, and `root_cause_profile_ids`. Each verdict has only `profile_id` and `class`. No extra top-level or verdict keys.

### Consensus-critical fields

| Field | Type/bounds | Comparison rule | Why critical |
| --- | --- | --- | --- |
| `schema_version` | exact `incidentscope.review.v1` | byte equality | prevents parser/schema drift |
| `source_policy_hash` | 64 lowercase hex | exact contract constant | binds origin/path/size/profile rules |
| `source_status` | `VERIFIED`, `UNAVAILABLE`, `UNVERIFIABLE`, `CONTRADICTORY` | exact enum | only `VERIFIED` can settle |
| `canonical_url` and `incident_id` | bounded ASCII; exact page policy/path and one matching feed object | exact normalized identity | prevents redirect or incident substitution |
| `content_digest` | 64 lowercase hex when verified | exact validator-refetched digest | binds the bytes actually reviewed |
| `source_updated_at` | bounded ISO timestamp | semantically same instant and deterministic time bounds | rejects future/incoherent evidence |
| `verdicts` | array length exactly accepted profile count, max eight | exact ID-to-class mapping; order normalized by profile ID | determines beneficiary set |
| `root_cause_profile_ids` | exact empty array | exact equality | this architecture has no root/downstream propagation; any such claim is invalid |

### Validator

- Independent evidence/replay: independently enforce policy, refetch the fixed feed, select the exact page ULID, recompute digest, reconstruct expected profile IDs from closure inputs, and evaluate the semantic mapping. The validator does not merely compare the leader's prose.
- Semantic rule: accept when source identity/digest/policy and exact ID-to-class mapping have the same meaning. Rationale wording is ignored and not stored.
- Rejection conditions: any fetch mismatch, missing/extra/duplicate/foreign ID, invalid class, nonempty root set, extra key, invalid timestamp, prompt/schema injection, or insufficient source coverage.
- `UNDETERMINED` handling: maps to `RETRYABLE` with reserve and credit accounting unchanged. It never defaults to `IMPACTED` or `NOT_IMPACTED`.

### Rationale policy

Rationale is optional validator diagnostics only, bounded, non-consensus-critical, not stored in canonical state, not displayed in the primary UI, and never parsed for a consequence.

## Settlement-invariant matrix

| Invariant | Required valid condition | Deterministic enforcement | Invalid behavior | Negative test |
| --- | --- | --- | --- | --- |
| Source coverage | `source_status == VERIFIED`, exact origin/incident/digest/policy, sufficient narrative/update content | validate before verdict processing | `RETRYABLE`; no credits/transfers/accounting changes | unavailable, thin/contradictory page, digest/policy mismatch |
| Expected entities | output IDs equal locked accepted profile IDs exactly once | compare set, length, uniqueness, pool ownership | `RETRYABLE`; no mutation except safe attempt status | extra/missing/duplicate/cross-pool IDs |
| Accepted enums | only three class enums | strict parser and membership check | `RETRYABLE` | lowercase/unknown/payout-bearing enum |
| Root-cause derivation | exact empty set; no fault/root model exists | require `root_cause_profile_ids == []` | `RETRYABLE` | injected root ID or root class |
| Downstream/blocked relation | no downstream/blocked class or field is accepted | reject extra keys/classes | `RETRYABLE` | syntactically valid extra dependency/path claims |
| Consequence derivation | contract derives beneficiary set solely from validated `IMPACTED` IDs | ignore/reject any proposed payout/consequence fields | revert/`RETRYABLE` before ledger mutation | leader supplies payouts, totals, or privileged beneficiary |
| Value destination | equal share for each impacted profile; deterministic remainder to sponsor; zero impacted means all sponsor-recoverable | integer accounting after exact set passes | revert before mutation if totals/invariant fail | 1 GEN/3 participants, 2 GEN/3, zero impacted, all impacted |
| Atomic accounting | reserve equals withdrawn + outstanding credit + sponsor-withdrawn + sponsor-recoverable | assert before/after every settlement/transfer | transaction reverts | malicious output and transfer failure leave accounting unchanged |

## Consequence and accounting

| Verdict | Canonical state change | Consumer action | Value movement |
| --- | --- | --- | --- |
| `IMPACTED` | profile class stored; exact credit initialized | named integrator may call `withdraw_credit` before claim deadline | equal deterministic share of the funded 1/2 GEN reserve |
| `NOT_IMPACTED` | profile class stored; zero credit | read result only | none; no penalty |
| `AMBIGUOUS` | profile class stored; zero credit | read non-penalizing result | none; no penalty |
| invalid/unavailable/unverifiable/undetermined review | pool becomes/remains `RETRYABLE`; safe failure code stored | sponsor may retry before expiry or cancel after expiry | none; reserve remains locked and credits unchanged |
| cancelled safely | terminal `CANCELLED`; invitations/profiles receive no class or penalty | read terminal reason | remaining reserve returns once to sponsor |
| claim expiry | unwithdrawn credits expire; pool closes after sponsor recovery | no late withdrawal | remaining reserve returns once to sponsor |

- Accepted/finalized boundary: no consequence is user-visible or withdrawable until the review transaction is accepted/decided and finalized, then canonical state is re-read.
- Ledger invariant per pool: `reserve_total = participant_withdrawn + participant_outstanding + sponsor_withdrawn + sponsor_recoverable`. Global invariant: contract-held value equals the sum of every pool's outstanding participant plus sponsor-recoverable ledger.
- Value-destination matrix:

| Value | Payer/source | Locked state | Release/refund/forfeit destination | Terminal states | Duplicate/late/retry behavior | Canonical proof view |
| --- | --- | --- | --- | --- | --- | --- |
| Pool reserve, exactly 1 or 2 GEN | sponsor via `create_pool` | `ENROLLING`, `LOCKED`, `RETRYABLE`, then allocated in `DECIDED` | impacted integrator shares; deterministic remainder/unallocated/expired value to sponsor | `CLOSED` or `CANCELLED` with zero outstanding | duplicate create is a new pool only; late withdrawal forbidden; retry never adds value | `get_pool_accounting` |
| Participant credit | pool reserve allocation | `DECIDED` until withdrawn or claim expiry | exact named integrator; after expiry sponsor recovery | withdrawn in `DECIDED` or expired into `CLOSED` | debit-before-transfer; duplicate/late call reverts | `get_profile`, `get_withdrawable_credit` |
| Rounding remainder/zero-impact reserve | pool reserve allocation | sponsor-recoverable in `DECIDED` | sponsor | `CLOSED` when all obligations zero | one debit/transfer; retry after failed transaction sees unchanged canonical ledger | `get_pool_accounting` |
| Cancellation refund | entire unallocated reserve | eligible pre-decision phase only | sponsor | `CANCELLED` | terminal flag/debit prevents double refund | `get_pool`, `get_pool_accounting` |

- Child-message/transfer evidence: ledger debit precedes `gl.message.emit_transfer`; a failed transaction reverts both. Studionet evidence must allowlist receipt status, transfer target/amount in GEN, and before/after balances without dumping validator configuration.
- Withdrawal/settlement: settlement only initializes internal credits; users withdraw individually. No validator/LLM output directly calls a recipient or supplies an amount.
- Cure/appeal/restore: there is no subjective appeal that rewrites a valid final decision. Only source failure can retry before expiry; after expiry safe cancellation prevents orphaned reserve.

## Reusable interface

### Write methods

- `create_pool(title, incident_url, source_policy_id, acceptance_deadline, review_expiry)` - payable; exact 1 or 2 GEN.
- `invite_dependency(pool_id, integrator, capability_id, capability_profile)`.
- `accept_dependency(pool_id)`.
- `lock_enrollment(pool_id)`.
- `request_review(pool_id)`.
- `retry_review(pool_id)`.
- `withdraw_credit(pool_id)`.
- `recover_reserve(pool_id)`.
- `cancel_pool(pool_id)`.

### View methods

- `get_contract_metadata()` - contract/API/source-policy versions and network-safe configuration facts.
- `get_pool_count()` and `get_pool(pool_id)` - bounded public list/detail fields.
- `get_pool_profile_ids(pool_id)` and `get_profile(profile_id)` - immutable invitation/acceptance/result data without raw validator internals.
- `get_account_pool_ids(account)` - canonical account history index.
- `get_account_profile(pool_id, account)` - own invitation/profile/class/credit/withdrawal state.
- `get_pool_accounting(pool_id)` - reserve, allocated, outstanding, withdrawn, recoverable, recovered, and invariant check in GEN-facing normalized fields.
- `get_current_attempt(pool_id)` - attempt ID, safe source status, accepted digest only when verified, timestamps; no prompt/rationale/config.
- `get_available_actions(pool_id, account)` - deterministic booleans and user-safe violation code for invite/accept/lock/review/retry/withdraw/recover/cancel.

### Consumer/callback

- Authentication: N/A in v1; there is no separate consumer/callback contract and therefore no unauthenticated pass-through boundary.
- Idempotency key: N/A for callbacks; direct writes use pool/profile/attempt ledger flags.
- Failure/retry: consumers read finalized canonical views; a failed offchain read has no contract consequence.
- Authorized cancellation: only the pool sponsor under `cancel_pool` rules. No consumer can cancel.

## Threat model

| Threat | Attack | Mitigation | Test |
| --- | --- | --- | --- |
| claimant-only fabricated dependency | integrator invents a matching profile | sponsor authors address-bound profile; integrator only accepts unchanged | wrong caller/profile substitution/mutation |
| sponsor rewrites scope after acceptance | edit/delete profile before review | immutable profile storage and locked ordered snapshot | attempted duplicate/edit after accept/lock |
| late gaming | invite/accept/review/withdraw at deadline with stale phase | every public method enforces its own transaction-time rule | boundary -1/exact/+1 for every temporal write |
| source spoof/redirect | lookalike host, query, redirect, claimant page | exact HTTPS host/path/ULID and policy hash; independent refetch | scheme/host/port/query/redirect variants |
| mutable page race | leader and validator see different bytes | exact response digest agreement; mismatch is retryable | two different fixtures/digests |
| prompt injection | page/profile instructs payout or schema change | quote as data, fixed prompt, strict schema/no extra keys | injection in page/profile, payout field |
| malicious leader | omit competitor, duplicate ally, invent class | exact expected ID coverage and enum checks before settlement | extra/missing/duplicate/invalid class |
| malicious semantic output | valid shape but root/downstream/payout meaning | empty root invariant; reject unsupported relation and payout fields | root/class mismatch and extra semantic fields |
| cross-pool contamination | use profile/credit from another pool | stable pool ownership checks on every ID | two-pool isolation tests |
| double settlement/withdraw/recovery | replay successful action | one-way flags, debit-before-transfer, accounting invariant | duplicate calls and failed-transfer replay |
| provider steals live credit | recover before claim deadline | recover only explicit remainder until all withdrawn/expiry | early recovery with outstanding credit |
| orphaned reserve | provider skips later action or source stays down | bounded review/claim windows plus cancellation/recovery | retry expiry and zero final outstanding |
| frontend false finality | wallet submission displayed as success | separate submitted/accepted/decided/finalized states and canonical reload | frontend transaction lifecycle tests |

## Test plan

- Happy path: provider creates 1 GEN pool, invites second EOA, integrator accepts, provider locks early with no pending invites, valid exact-set review decides, impacted integrator withdraws, provider recovers remainder, pool closes with zero outstanding.
- Unauthorized: every sponsor/integrator method called by wrong accounts; views do not grant authority.
- Isolation: two pools, same/different accounts, foreign profile/attempt IDs, accounting remains isolated.
- Evidence failure: missing, malformed, oversized, redirected, changed, contradictory, or unavailable official page becomes `RETRYABLE` and non-penalizing.
- Malicious leader: extra/missing/duplicate IDs, wrong incident, wrong digest/policy/schema, invented payout, and truncated coverage.
- Prompt injection: official text/profile attempts to override policy, select beneficiary, expose configuration, or emit prose instead of strict JSON.
- Semantic mismatch: leader/validator mapping disagreement, valid JSON with invalid root/downstream meaning, unsupported class, future/incoherent timestamp.
- Verdict classes: all three classes, zero impacted, one impacted, all impacted, and exact aggregate counts.
- Duplicate: invitation, acceptance, lock, review after decision, settlement, withdrawal, recovery, and cancellation.
- Recovery/value write safety: wrong caller/state, duplicate, already finalized/closed, accounting invariant, no double-credit/double-withdraw/double-refund.
- Accounting/value: exact 1 GEN and 2 GEN create values, pro-rata remainder, zero-impact full recovery, failed transfer atomicity, global/pool invariant.
- Cure/restore: retry only `RETRYABLE`, fresh current attempt, cancellation only at safe expiry; no rewrite of `DECIDED`.
- Consumer enforcement: N/A callback boundary; tests prove public views are read-only and cannot move value.
- Undetermined/retry: semantic disagreement maps to `RETRYABLE`; retry distinguishes transient fixture/source failure from structural schema failure.
- Temporal: each affected write at boundary -1, exact, +1 with deliberately stale phase and canonical state/accounting unchanged on rejection.
- Payable/metadata: `create_pool` has required payable metadata; every other public write rejects unexpected value.
- Receipt parser: raw Studio and normalized SDK receipt fixtures; safe allowlist only.

## Claim-to-code matrix

| Claim | Contract method/state | View/read | Test | Network evidence |
| --- | --- | --- | --- | --- |
| Sponsor pre-funds only 1 or 2 GEN | `create_pool`, `ENROLLING`, reserve ledger | `get_pool`, `get_pool_accounting` | exact-value/payable/accounting tests | `lifecycle.json` create receipt plus allowlisted value/balance evidence |
| No claimant can unilaterally invent eligibility | `invite_dependency` + `accept_dependency` immutable profile | `get_account_profile`, `get_profile` | wrong caller/substitution/duplicate/late tests | `lifecycle.json` two-wallet invitation and acceptance receipts/state reads |
| Validators inspect the exact official incident page | `request_review`/`retry_review`, policy/digest invariants | `get_current_attempt`, pool incident URL/policy | origin/path/redirect/digest/independent replay tests | `lifecycle.json` verified attempt with safe URL/policy/digest projection |
| Every accepted profile is classified exactly once | settlement exact-set invariant, `DECIDED` | pool counts and `get_profile` | extra/missing/duplicate/foreign ID tests | `lifecycle.json` finalized profile/count reads |
| Invalid or unavailable evidence never moves credit | `RETRYABLE`; no accounting mutation | attempt status and accounting | source/schema/semantic failure tests | Local adversarial coverage; live v1.2 path was `VERIFIED` |
| Only impacted profiles open deterministic credits | validated verdict-to-credit derivation | own profile/withdrawable/accounting | all classes, zero/all/partial impacted | `lifecycle.json` finalized `IMPACTED` class and 2 GEN credit state |
| Credits and reserve cannot pay twice or become orphaned | withdraw/recover/cancel ledgers and terminal phases | accounting/invariant/withdrawn/terminal views | duplicates, expiry, failed transfer, zero outstanding | `lifecycle.json` withdrawal/recovery receipts and final zero accounting |
| Frontend uses explicit wallet selection and canonical reload | frontend adapter around exact writes/views | all user-facing views | wallet, lifecycle, adapter, route, accessibility tests | Phase 13 browser wallet transaction/finality/read evidence |
| Product decides stated incident scope, not real downtime/SLA | no traffic/damages inputs or verdict fields | Help and pool evidence boundary | schema rejects extra claims; copy tests | README/live UI and contract schema/source evidence |

## Analogue and differentiation matrix

| Analogue/prior idea | Similar dimensions | Structural difference | Collision decision |
| --- | --- | --- | --- |
| TraceSettle | semantic review plus value settlement | TraceSettle attributes DAG root cause and step fees; IncidentScope classifies independent mutually accepted capabilities against one incident and shares one reserve | distinct |
| Semantic Interface Covenant | natural-language compatibility judgment | Covenant quarantines/restores an integration; IncidentScope opens batch withdrawal credits and has no route quarantine | distinct |
| LabelScope Market | authoritative text and settlement | Market settles opposed positions; IncidentScope has no prediction side/stake winner and credits exact participant IDs | distinct |
| Disclosure Dividend | batch semantic classification and allocation | Dividend ranks contributions/overlap; IncidentScope uses sponsor-integrator capability attestations and incident scope | distinct |
| ordinary status dashboard | official incident feed | dashboard reports text but cannot create validator-controlled beneficiary rights or isolated GEN accounting | reject replacement |

## Deployment and evidence plan

- Network: Studionet only, using the locked official network/configuration decision and verified current tooling.
- Actors/wallet separation: authorized primary EOA is sponsor; a user-approved generated/funded second EOA is integrator. Secrets remain only in ignored environment files and are never printed.
- Deploy steps: lint/check/test/build; safe config discovery; deploy one contract; project allowlisted receipt fields; save source commit/API/policy/network/address identity; read metadata.
- Consequential lifecycle: create 1 GEN pool; invite second EOA; accept from second EOA; lock; request review against the exact official incident URL; read finalized decision; withdraw impacted credit if the chosen profile is impacted; recover legal sponsor remainder; prove final accounting. If a live verdict is non-impacted, run a second bounded 1 GEN profile only when necessary and recover every superseded pool.
- Canonical reads: pool metadata/phase, profile invitation/acceptance/class, attempt status, withdrawable credit, accounting before/after each finalized transaction.
- Balance/receipt proof: safe allowlist of transaction hash/status/from/to/value in GEN, contract address, block/finality timestamps, transfer recipient/amount, and balance deltas. Never dump raw receipts/traces/config.
- Evidence path: `docs/evidence/studionet/`; one active `deployment.json`; superseded revisions archived with reason/recovery/zero accounting.
- Resume/idempotency: scripts discover existing deployment/pool/current attempt/profile/withdrawal state and continue only missing legal steps. No hardcoded `-1` attempt or transaction replay.

## Definition of Done

### Intelligent Contract primitive

- [x] Exactly one project-specific `gl.Contract` subclass with correct header/Depends and ASCII source.
- [x] Reusable typed pool/profile/accounting interface.
- [x] Validator-independent semantic review using the locked nondeterminism API.
- [x] Direct deterministic consequence from accepted exact impact set.
- [x] Settlement, authenticity, temporal, idempotency, and no-orphan invariants covered by adversarial tests.
- [x] `genvm-lint check`, direct tests, and bounded Studionet lifecycle pass.

### Projects product

- [x] Complete frontend route/product baseline built before contract implementation.
- [x] Explicit wallet selection, disconnect, honest unconfigured states, responsive layout, and frontend tests.
- [x] Real `genlayer-js` write wrappers for every claimed browser action.
- [x] Separate EVM wallet write path and GenLayer IC canonical read path with browser-local CORS proof.
- [x] Submitted, accepted/decided, finalized, failed, and retryable lifecycle plus canonical reload.
- [ ] Real extension-signed frontend wallet transaction proof.
- [x] Full consequential lifecycle on Studionet.
- [x] Canonical state/accounting/history reads and meaningful withdrawal/recovery outcome.
- [ ] Browser evidence at 375/768/1024/1440 and real wallet/network interaction.
- [x] Primary UI exposes only user-relevant data/actions; raw prompt/payload/config/storage remains hidden.
- [ ] Public GitHub, successful CI, Vercel production, English audit, final README, and Projects precheck `NO BLOCKER`.

## Honest limitations

- Release v1 supports only the exact `OPENAI_STATUS_V1` incident origin/path policy; it is sponsor-neutral but not an arbitrary-domain oracle.
- Mutual sponsor/integrator profile acceptance proves agreement to the capability description, not actual historical traffic, failed requests, damages, or legal SLA entitlement.
- Official aggregate incident text may remain ambiguous for a capability; `AMBIGUOUS` pays nothing and penalizes nobody.
- Page mutation during validator replay may force a retry even when the incident is genuine.
- The pool is deliberately small (1 or 2 GEN), maximum eight profiles, and not insurance, fiat compensation, KYC, or production-scale monitoring.
- Adding signed gateway usage receipts and automatic billing/failover is milestone headroom, not a current claim.

## Kill criteria

- The current GenVM API cannot independently fetch the exact official source and reach semantic equivalence with a strict complete-set schema.
- `genvm-lint` does not recognize the one project-specific contract class under the locked Depends/API family.
- Authenticity or exact-set settlement invariants cannot be enforced before credit mutation.
- Any value/recovery method lacks an explicit temporal, authorization, idempotency, or no-orphan path.
- Direct tests cannot prove malicious valid-shape output leaves accounting unchanged.
- A bounded Studionet lifecycle cannot deploy/finalize/read canonical state after current service/tool status is checked.
- Browser writes cannot use a real selected EVM wallet and canonical IC reads cannot pass browser-local CORS/finality checks.
- The final Projects precheck reports any blocker; do not relabel the submission category to bypass it.
