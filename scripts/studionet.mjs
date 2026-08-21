import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  ExecutionResult,
  TransactionStatus,
  transactionResultNumberToName,
  transactionsStatusNumberToName,
} from "genlayer-js/types";


const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = join(PROJECT_ROOT, "contracts", "incidentscope.py");
const EVIDENCE_DIR = join(PROJECT_ROOT, "docs", "evidence", "studionet");
const DEPLOYMENT_PATH = join(EVIDENCE_DIR, "deployment.json");
const DEPLOYMENT_ATTEMPTS_PATH = join(EVIDENCE_DIR, "deployment-attempts.json");
const LIFECYCLE_PATH = join(EVIDENCE_DIR, "lifecycle.json");
const ARCHIVE_DIR = join(EVIDENCE_DIR, "archive");
const RPC_URL = "https://studio.genlayer.com/api";
const EXPLORER_URL = "https://explorer-studio.genlayer.com";
const INCIDENT_URL = "https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV";
const SOURCE_POLICY_ID = "OPENAI_STATUS_V1";
const GEN = 10n ** 18n;
const IDENTITY_KEYS = ["network", "chainId", "sourceCommit", "sourceSha256", "depends", "deployer"];


function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}


function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}


function parseEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}


function loadAuthorizedEnvironment() {
  parseEnvFile(join(PROJECT_ROOT, ".env"));
  parseEnvFile(join(PROJECT_ROOT, "..", ".env"));
  for (const name of ["STUDIONET_PRIVATE_KEY", "STUDIONET_INTEGRATOR_PRIVATE_KEY"]) {
    if (!process.env[name]) throw new Error(`Required authorized variable ${name} is missing.`);
  }
}


function privateKey(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Required authorized variable ${name} is missing.`);
  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  if (!/^0x[a-fA-F0-9]{64}$/u.test(normalized)) throw new Error(`Authorized variable ${name} is malformed.`);
  return normalized;
}


function contractAddressFromReceipt(receipt) {
  const candidates = [
    receipt?.data?.contract_address,
    receipt?.data?.contractAddress,
    receipt?.txDataDecoded?.contractAddress,
  ];
  return candidates.find((value) => typeof value === "string" && /^0x[a-fA-F0-9]{40}$/u.test(value));
}


function leaderExecution(receipt) {
  const direct = receipt?.execution_result;
  if (direct !== undefined) return direct;
  const leaders = receipt?.consensus_data?.leader_receipt;
  return Array.isArray(leaders) && leaders[0] ? leaders[0].execution_result : undefined;
}


function receiptStatus(receipt) {
  return receipt?.statusName
    ?? receipt?.status_name
    ?? transactionsStatusNumberToName?.[receipt?.status]
    ?? receipt?.status
    ?? null;
}


function consensusResult(receipt) {
  return receipt?.resultName
    ?? receipt?.result_name
    ?? transactionResultNumberToName?.[receipt?.result]
    ?? null;
}


function executionResult(receipt) {
  const normalized = receipt?.txExecutionResultName ?? receipt?.executionResultName;
  if (normalized) return normalized;
  const raw = leaderExecution(receipt);
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") return raw.result ?? raw.name ?? raw.status ?? null;
  return null;
}


export function safeReceiptProjection(receipt, label, fallbackHash) {
  return {
    label,
    transactionHash: receipt?.hash ?? fallbackHash ?? null,
    status: receiptStatus(receipt),
    txExecutionResult: executionResult(receipt),
    consensusResult: consensusResult(receipt),
    contractAddress: contractAddressFromReceipt(receipt) ?? null,
  };
}


export function deploymentDecision(existing, current) {
  if (!existing) return "DEPLOY";
  const identical = IDENTITY_KEYS.every((key) => existing[key] === current[key]);
  if (identical && existing.result === "SUCCESS" && existing.contractAddress) return "RESUME";
  return "REFUSE";
}


export function supersessionDecision(existing, lifecycleEvidence, current) {
  if (!existing || !lifecycleEvidence) return "REFUSE_MISSING_EVIDENCE";
  if (existing.sourceSha256 === current.sourceSha256) return "REFUSE_IDENTICAL_SOURCE";
  const canonical = lifecycleEvidence.finalCanonicalState ?? lifecycleEvidence.lastCanonicalState;
  const safeRecovery = lifecycleEvidence.contractAddress === existing.contractAddress
    && canonical?.pool?.phase === "RETRYABLE"
    && canonical?.attempt?.failure_code === "SOURCE_CONTRADICTORY"
    && canonical?.accounting?.invariant_holds === true
    && canonical?.accounting?.participant_outstanding_gen === "0"
    && Number(canonical?.accounting?.sponsor_recoverable_gen) > 0;
  const alreadyRecovered = lifecycleEvidence.contractAddress === existing.contractAddress
    && ["CANCELLED", "CLOSED"].includes(canonical?.pool?.phase)
    && canonical?.accounting?.invariant_holds === true
    && canonical?.accounting?.participant_outstanding_gen === "0"
    && canonical?.accounting?.sponsor_recoverable_gen === "0";
  if (alreadyRecovered) return "ARCHIVE_RECOVERED";
  return safeRecovery ? "ARCHIVE_PENDING_RECOVERY" : "REFUSE_UNSAFE_STATE";
}


export function selectNextLifecycleAction(state) {
  if (!state) return "CREATE_POOL";
  if (state.phase === "ENROLLING") {
    if (!state.hasIntegratorProfile && state.acceptedCount === 0 && state.pendingCount === 0) return "INVITE";
    if (state.hasIntegratorProfile && !state.integratorAccepted && state.pendingCount === 1) return "ACCEPT";
    if (state.hasIntegratorProfile && state.integratorAccepted && state.acceptedCount === 1 && state.pendingCount === 0) return "LOCK";
    return "STOP_INCONSISTENT";
  }
  if (state.phase === "LOCKED") return "REVIEW";
  if (state.phase === "RETRYABLE") {
    if (!state.retryTransient) return "STOP_STRUCTURAL_RETRY";
    return state.retryExhausted ? "STOP_RETRY_EXHAUSTED" : "RETRY";
  }
  if (state.phase === "DECIDED") {
    if (state.withdrawAvailable) return "WITHDRAW";
    if (state.recoverAvailable) return "RECOVER";
    return "STOP_PENDING_SETTLEMENT";
  }
  if (state.phase === "CLOSED") return "COMPLETE";
  return "STOP_UNSUPPORTED_PHASE";
}


function formatGen(wei) {
  const amount = BigInt(wei);
  const sign = amount < 0n ? "-" : "";
  const absolute = amount < 0n ? -amount : amount;
  const whole = absolute / GEN;
  const remainder = absolute % GEN;
  if (remainder === 0n) return `${sign}${whole}`;
  return `${sign}${whole}.${remainder.toString().padStart(18, "0").replace(/0+$/u, "")}`;
}


function parseGen(value) {
  const text = String(value);
  const negative = text.startsWith("-");
  const unsigned = negative ? text.slice(1) : text;
  const [whole, fraction = ""] = unsigned.split(".");
  const wei = BigInt(whole || "0") * GEN + BigInt(fraction.padEnd(18, "0").slice(0, 18) || "0");
  return negative ? -wei : wei;
}


function currentIdentity(deployer) {
  const source = readFileSync(CONTRACT_PATH);
  const firstLine = source.toString("utf8").split(/\r?\n/u, 1)[0];
  const depends = JSON.parse(firstLine.slice(1).trim()).Depends;
  return {
    network: "studionet",
    chainId: 61999,
    rpc: RPC_URL,
    sourceCommit: execFileSync(
      "git",
      ["log", "-1", "--format=%H", "--", "contracts/incidentscope.py"],
      { cwd: PROJECT_ROOT, encoding: "utf8" },
    ).trim(),
    sourceSha256: createHash("sha256").update(source).digest("hex"),
    depends,
    deployer,
  };
}


async function chainId() {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
  });
  if (!response.ok) throw new Error("Studionet RPC health check failed.");
  const body = await response.json();
  if (body.result !== "0xf22f") throw new Error("Studionet RPC returned an unexpected chain ID.");
  return 61999;
}


function roleClients() {
  loadAuthorizedEnvironment();
  const sponsorAccount = createAccount(privateKey("STUDIONET_PRIVATE_KEY"));
  const integratorAccount = createAccount(privateKey("STUDIONET_INTEGRATOR_PRIVATE_KEY"));
  return {
    readClient: createClient({ chain: studionet }),
    sponsorAccount,
    integratorAccount,
    sponsorClient: createClient({ chain: studionet, account: sponsorAccount }),
    integratorClient: createClient({ chain: studionet, account: integratorAccount }),
  };
}


async function balance(client, address) {
  return client.getBalance({ address });
}


export function isSuccessfulFinalizedReceipt(receipt) {
  const finalized = receiptStatus(receipt) === TransactionStatus.FINALIZED;
  const execution = executionResult(receipt);
  if (!finalized) return false;
  if (execution === ExecutionResult.FINISHED_WITH_RETURN) return true;
  return execution === "SUCCESS" && consensusResult(receipt) === "MAJORITY_AGREE";
}


async function waitForAcceptedAndFinalized(client, hash, label, onAccepted) {
  const accepted = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    retries: 200,
    interval: 3_000,
  });
  await onAccepted?.(accepted);
  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 400,
    interval: 3_000,
  });
  const finalized = await client.getTransaction({ hash });
  if (!isSuccessfulFinalizedReceipt(finalized)) {
    const safe = safeReceiptProjection(finalized, label, hash);
    throw new Error(`${label} finalized without successful execution (${safe.status}/${safe.txExecutionResult}).`);
  }
  return { accepted, finalized };
}


async function readView(client, address, functionName, args = []) {
  const value = await client.readContract({ address, functionName, args });
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}


async function deploymentInspection(clients) {
  const existing = readJson(DEPLOYMENT_PATH, undefined);
  const identity = currentIdentity(clients.sponsorAccount.address);
  const result = {
    observedAt: new Date().toISOString(),
    network: "studionet",
    chainId: await chainId(),
    sponsor: clients.sponsorAccount.address,
    sponsorBalanceGEN: formatGen(await balance(clients.readClient, clients.sponsorAccount.address)),
    integrator: clients.integratorAccount.address,
    integratorBalanceGEN: formatGen(await balance(clients.readClient, clients.integratorAccount.address)),
    deploymentDecision: deploymentDecision(existing, identity),
    deployment: existing ? {
      result: existing.result,
      contractAddress: existing.contractAddress,
      transactionHash: existing.transactionHash,
      sourceCommit: existing.sourceCommit,
      sourceSha256: existing.sourceSha256,
    } : null,
  };
  if (existing?.contractAddress) {
    const code = await clients.readClient.getContractCode(existing.contractAddress);
    result.deployedCodePresent = typeof code === "string" && code.length > 2;
    result.contractMetadata = await readView(clients.readClient, existing.contractAddress, "get_contract_metadata");
    result.poolCount = Number(await readView(clients.readClient, existing.contractAddress, "get_pool_count"));
  }
  return { existing, identity, result };
}


async function inspect() {
  const clients = roleClients();
  const { result } = await deploymentInspection(clients);
  console.log(JSON.stringify(result, null, 2));
}


function attemptsFile() {
  return readJson(DEPLOYMENT_ATTEMPTS_PATH, { network: "studionet", attempts: [] });
}


function updateAttempt(hash, patch) {
  const file = attemptsFile();
  const index = file.attempts.findIndex((attempt) => attempt.transactionHash === hash);
  if (index < 0) file.attempts.push({ transactionHash: hash, ...patch });
  else file.attempts[index] = { ...file.attempts[index], ...patch };
  writeJson(DEPLOYMENT_ATTEMPTS_PATH, file);
}


async function finalizeDeployment(clients, identity, hash) {
  let acceptedReceipt;
  const { finalized } = await waitForAcceptedAndFinalized(
    clients.sponsorClient,
    hash,
    "deploy",
    async (accepted) => {
      acceptedReceipt = accepted;
      updateAttempt(hash, {
        status: "ACCEPTED",
        acceptedAt: new Date().toISOString(),
        receipt: safeReceiptProjection(accepted, "deploy", hash),
      });
    },
  );
  const contractAddress = contractAddressFromReceipt(finalized) ?? contractAddressFromReceipt(acceptedReceipt);
  if (!contractAddress) throw new Error("Successful deployment receipt did not expose a contract address.");
  const code = await clients.readClient.getContractCode(contractAddress);
  if (typeof code !== "string" || code.length <= 2) throw new Error("Deployed contract code could not be verified.");
  const metadata = await readView(clients.readClient, contractAddress, "get_contract_metadata");
  if (metadata?.contract_name !== "IncidentScopeContract") throw new Error("Deployed contract metadata mismatch.");

  const deployment = {
    ...identity,
    result: "SUCCESS",
    contractAddress,
    transactionHash: hash,
    transactionExplorer: `${EXPLORER_URL}/tx/${hash}`,
    contractExplorer: `${EXPLORER_URL}/address/${contractAddress}`,
    finalizedAt: new Date().toISOString(),
    receipt: safeReceiptProjection(finalized, "deploy", hash),
    contractMetadata: metadata,
  };
  updateAttempt(hash, {
    status: "FINALIZED",
    result: "SUCCESS",
    finalizedAt: deployment.finalizedAt,
    contractAddress,
    receipt: deployment.receipt,
  });
  writeJson(DEPLOYMENT_PATH, deployment);
  console.log(JSON.stringify({
    Result: "SUCCESS",
    contractAddress,
    transactionHash: hash,
    explorer: deployment.contractExplorer,
  }, null, 2));
  return deployment;
}


async function deploy() {
  const clients = roleClients();
  const { existing, identity, result } = await deploymentInspection(clients);
  console.log(JSON.stringify({ inspect: result }, null, 2));
  const decision = deploymentDecision(existing, identity);
  if (decision === "RESUME") {
    console.log(JSON.stringify({ Result: "SUCCESS", resumed: true, contractAddress: existing.contractAddress }, null, 2));
    return;
  }
  if (decision === "REFUSE") throw new Error("Existing deployment identity differs; archive and recover it before deploying a revision.");

  const attempts = attemptsFile();
  const pending = [...attempts.attempts].reverse().find((attempt) =>
    attempt.sourceSha256 === identity.sourceSha256 && ["SUBMITTED", "ACCEPTED"].includes(attempt.status),
  );
  if (pending) {
    await finalizeDeployment(clients, identity, pending.transactionHash);
    return;
  }

  await clients.sponsorClient.initializeConsensusSmartContract();
  const balanceBefore = await balance(clients.readClient, clients.sponsorAccount.address);
  const hash = await clients.sponsorClient.deployContract({
    code: new Uint8Array(readFileSync(CONTRACT_PATH)),
    args: [],
  });
  updateAttempt(hash, {
    ...identity,
    status: "SUBMITTED",
    submittedAt: new Date().toISOString(),
    balanceBeforeGEN: formatGen(balanceBefore),
  });
  console.log(JSON.stringify({ stage: "SUBMITTED", label: "deploy", transactionHash: hash }, null, 2));
  await finalizeDeployment(clients, identity, hash);
}


function archivePaths(contractAddress) {
  return {
    deployment: join(ARCHIVE_DIR, `${contractAddress}-deployment.json`),
    lifecycle: join(ARCHIVE_DIR, `${contractAddress}-lifecycle.json`),
  };
}


async function supersede() {
  const clients = roleClients();
  await chainId();
  const existing = readJson(DEPLOYMENT_PATH, undefined);
  const lifecycleEvidence = readJson(LIFECYCLE_PATH, undefined);
  const current = currentIdentity(clients.sponsorAccount.address);
  const decision = supersessionDecision(existing, lifecycleEvidence, current);
  if (!["ARCHIVE_PENDING_RECOVERY", "ARCHIVE_RECOVERED"].includes(decision)) {
    throw new Error(`Supersession stopped at ${decision}.`);
  }
  const paths = archivePaths(existing.contractAddress);
  if (existsSync(paths.deployment) || existsSync(paths.lifecycle)) {
    throw new Error("Superseded revision archive already exists; inspect it instead of overwriting.");
  }
  const canonical = lifecycleEvidence.finalCanonicalState ?? lifecycleEvidence.lastCanonicalState;
  const reviewExpiry = Number(canonical.pool.review_expiry);
  const archivedAt = new Date().toISOString();
  const recovered = decision === "ARCHIVE_RECOVERED";
  const archivedDeployment = {
    ...existing,
    active: false,
    revisionStatus: recovered ? "SUPERSEDED_RECOVERED" : "SUPERSEDED_PENDING_RECOVERY",
    supersededAt: archivedAt,
    supersededReason: "LIVE_SOURCE_UPDATE_ORDER_INCOMPATIBILITY",
    supersededBySourceSha256: current.sourceSha256,
    recovery: {
      status: recovered ? "RECOVERED" : "PENDING_TIME_GATE",
      method: "cancel_pool",
      poolId: lifecycleEvidence.poolId,
      notBefore: new Date(reviewExpiry * 1_000).toISOString(),
      recoverableGEN: canonical.accounting.sponsor_recoverable_gen,
      participantOutstandingGEN: canonical.accounting.participant_outstanding_gen,
      invariantHolds: canonical.accounting.invariant_holds,
    },
  };
  writeJson(paths.deployment, archivedDeployment);
  writeJson(paths.lifecycle, {
    ...lifecycleEvidence,
    status: "SUPERSEDED_PENDING_RECOVERY",
    archivedAt,
    active: false,
  });
  if (!existsSync(paths.deployment) || !existsSync(paths.lifecycle)) {
    throw new Error("Archive verification failed; active files were preserved.");
  }
  unlinkSync(DEPLOYMENT_PATH);
  unlinkSync(LIFECYCLE_PATH);
  console.log(JSON.stringify({
    Result: "SUCCESS",
    archivedContractAddress: existing.contractAddress,
    status: archivedDeployment.revisionStatus,
    recoveryNotBefore: archivedDeployment.recovery.notBefore,
    activeDeploymentCleared: true,
  }, null, 2));
}


function pendingArchiveAddress(requestedAddress) {
  if (requestedAddress) {
    if (!/^0x[a-fA-F0-9]{40}$/u.test(requestedAddress)) throw new Error("Recovery address is malformed.");
    return requestedAddress;
  }
  if (!existsSync(ARCHIVE_DIR)) throw new Error("No superseded revision archive exists.");
  const candidates = readdirSync(ARCHIVE_DIR)
    .filter((name) => name.endsWith("-deployment.json"))
    .map((name) => name.slice(0, -"-deployment.json".length))
    .filter((address) => readJson(archivePaths(address).deployment, {}).revisionStatus === "SUPERSEDED_PENDING_RECOVERY");
  if (candidates.length !== 1) throw new Error("Specify the one superseded contract address to recover.");
  return candidates[0];
}


async function recoverSuperseded(requestedAddress) {
  const clients = roleClients();
  await chainId();
  const address = pendingArchiveAddress(requestedAddress);
  const paths = archivePaths(address);
  const archivedDeployment = readJson(paths.deployment, undefined);
  const archivedLifecycle = readJson(paths.lifecycle, undefined);
  if (!archivedDeployment || !archivedLifecycle) throw new Error("Superseded recovery evidence is incomplete.");
  if (archivedDeployment.revisionStatus !== "SUPERSEDED_PENDING_RECOVERY") {
    if (archivedDeployment.revisionStatus === "SUPERSEDED_RECOVERED") {
      console.log(JSON.stringify({ Result: "SUCCESS", resumed: true, contractAddress: address, recoveryStatus: "RECOVERED" }, null, 2));
      return;
    }
    throw new Error("Superseded revision is not in a recoverable status.");
  }
  const notBefore = Date.parse(archivedDeployment.recovery.notBefore);
  if (Date.now() < notBefore) {
    console.log(JSON.stringify({
      Result: "PENDING_TIME_GATE",
      contractAddress: address,
      poolId: archivedDeployment.recovery.poolId,
      recoverableGEN: archivedDeployment.recovery.recoverableGEN,
      notBefore: archivedDeployment.recovery.notBefore,
    }, null, 2));
    throw new Error("Superseded reserve cannot be cancelled before its canonical review expiry.");
  }

  const poolId = archivedDeployment.recovery.poolId;
  const before = await poolState(clients, address, poolId);
  let pending = archivedLifecycle.pendingRecoveryTransaction;
  if (!pending) {
    if (!before.cancelAvailable) throw new Error("Canonical state does not permit superseded pool cancellation.");
    await clients.sponsorClient.initializeConsensusSmartContract();
    const balanceBefore = await balance(clients.readClient, clients.sponsorAccount.address);
    const hash = await clients.sponsorClient.writeContract({
      address,
      functionName: "cancel_pool",
      args: [poolId],
      value: 0n,
    });
    pending = {
      action: "CANCEL_SUPERSEDED_POOL",
      actor: "sponsor",
      publicAddress: clients.sponsorAccount.address,
      transactionHash: hash,
      submittedAt: new Date().toISOString(),
      valueGEN: "0",
      balanceBeforeGEN: formatGen(balanceBefore),
      canonicalBefore: before.canonical,
    };
    archivedLifecycle.pendingRecoveryTransaction = pending;
    writeJson(paths.lifecycle, archivedLifecycle);
    console.log(JSON.stringify({ stage: "SUBMITTED", action: pending.action, transactionHash: hash }, null, 2));
  }
  let acceptedAt = pending.acceptedAt;
  const { finalized } = await waitForAcceptedAndFinalized(
    clients.sponsorClient,
    pending.transactionHash,
    pending.action,
    async () => {
      acceptedAt = new Date().toISOString();
      archivedLifecycle.pendingRecoveryTransaction.acceptedAt = acceptedAt;
      writeJson(paths.lifecycle, archivedLifecycle);
    },
  );
  const after = await poolState(clients, address, poolId);
  if (after.phase !== "CANCELLED"
    || after.canonical.accounting.sponsor_recoverable_gen !== "0"
    || after.canonical.accounting.participant_outstanding_gen !== "0"
    || after.canonical.accounting.invariant_holds !== true) {
    throw new Error("Superseded recovery finalized without zero canonical accounting.");
  }
  const balanceAfter = await balance(clients.readClient, clients.sponsorAccount.address);
  archivedLifecycle.transactions.push({
    ...pending,
    acceptedAt,
    finalizedAt: new Date().toISOString(),
    status: "FINALIZED",
    result: "SUCCESS",
    receipt: safeReceiptProjection(finalized, pending.action, pending.transactionHash),
    explorer: `${EXPLORER_URL}/tx/${pending.transactionHash}`,
    balanceAfterGEN: formatGen(balanceAfter),
    balanceDeltaGEN: formatGen(balanceAfter - parseGen(pending.balanceBeforeGEN)),
    canonicalAfter: after.canonical,
  });
  archivedLifecycle.pendingRecoveryTransaction = null;
  archivedLifecycle.status = "SUPERSEDED_RECOVERED";
  archivedLifecycle.recoveredAt = new Date().toISOString();
  archivedLifecycle.finalCanonicalState = after.canonical;
  archivedDeployment.revisionStatus = "SUPERSEDED_RECOVERED";
  archivedDeployment.recovery = {
    ...archivedDeployment.recovery,
    status: "RECOVERED",
    recoveredAt: archivedLifecycle.recoveredAt,
    transactionHash: pending.transactionHash,
    receipt: safeReceiptProjection(finalized, pending.action, pending.transactionHash),
    finalAccounting: after.canonical.accounting,
  };
  writeJson(paths.lifecycle, archivedLifecycle);
  writeJson(paths.deployment, archivedDeployment);
  console.log(JSON.stringify({ Result: "SUCCESS", contractAddress: address, poolId, recoveryStatus: "RECOVERED" }, null, 2));
}


async function poolState(clients, contractAddress, poolId) {
  const [pool, accounting, profile, sponsorActions, integratorActions, attempt] = await Promise.all([
    readView(clients.readClient, contractAddress, "get_pool", [poolId]),
    readView(clients.readClient, contractAddress, "get_pool_accounting", [poolId]),
    readView(clients.readClient, contractAddress, "get_account_profile", [poolId, clients.integratorAccount.address]),
    readView(clients.readClient, contractAddress, "get_available_actions", [poolId, clients.sponsorAccount.address]),
    readView(clients.readClient, contractAddress, "get_available_actions", [poolId, clients.integratorAccount.address]),
    readView(clients.readClient, contractAddress, "get_current_attempt", [poolId]),
  ]);
  return {
    phase: pool.phase,
    acceptedCount: Number(pool.accepted_count),
    pendingCount: Number(pool.pending_count),
    hasIntegratorProfile: Boolean(profile.profile_id),
    integratorAccepted: Boolean(profile.accepted),
    withdrawAvailable: Boolean(integratorActions.withdraw),
    recoverAvailable: Boolean(sponsorActions.recover),
    cancelAvailable: Boolean(sponsorActions.cancel),
    retryTransient: attempt.failure_code === "SOURCE_UNAVAILABLE",
    retryExhausted: Number(attempt.attempt_id) >= 2,
    canonical: { pool, accounting, profile, attempt },
  };
}


async function sponsorPoolIds(clients, address) {
  return readView(clients.readClient, address, "get_account_pool_ids", [clients.sponsorAccount.address]);
}


function lifecycleFile(deployment, clients) {
  const existing = readJson(LIFECYCLE_PATH, undefined);
  if (existing) {
    if (existing.network !== "studionet" || existing.contractAddress !== deployment.contractAddress) {
      throw new Error("Lifecycle evidence belongs to a different deployment.");
    }
    return existing;
  }
  return {
    network: "studionet",
    chainId: 61999,
    contractAddress: deployment.contractAddress,
    sponsor: clients.sponsorAccount.address,
    integrator: clients.integratorAccount.address,
    demoValueGEN: "2",
    incidentUrl: INCIDENT_URL,
    startedAt: new Date().toISOString(),
    poolId: null,
    sponsorPoolIdsBefore: [],
    pendingTransaction: null,
    transactions: [],
    status: "IN_PROGRESS",
  };
}


async function reconcilePoolId(file, clients, address) {
  if (file.poolId) return;
  const currentIds = await sponsorPoolIds(clients, address);
  const created = currentIds.filter((id) => !file.sponsorPoolIdsBefore.includes(id));
  if (created.length > 1) throw new Error("Multiple new sponsor pools prevent safe lifecycle recovery.");
  if (created.length === 1) {
    file.poolId = created[0];
    writeJson(LIFECYCLE_PATH, file);
  }
}


async function executeLifecycleWrite({ file, clients, deployment, action, actor, functionName, args, value = 0n, before }) {
  const client = actor === "sponsor" ? clients.sponsorClient : clients.integratorClient;
  const account = actor === "sponsor" ? clients.sponsorAccount : clients.integratorAccount;
  await client.initializeConsensusSmartContract();
  const balanceBefore = await balance(clients.readClient, account.address);
  const hash = await client.writeContract({
    address: deployment.contractAddress,
    functionName,
    args,
    value,
  });
  file.pendingTransaction = {
    action,
    actor,
    publicAddress: account.address,
    transactionHash: hash,
    submittedAt: new Date().toISOString(),
    valueGEN: formatGen(value),
    canonicalBefore: before?.canonical ?? null,
  };
  writeJson(LIFECYCLE_PATH, file);
  console.log(JSON.stringify({ stage: "SUBMITTED", action, actor, transactionHash: hash }, null, 2));

  let acceptedAt;
  const { finalized } = await waitForAcceptedAndFinalized(client, hash, action, async () => {
    acceptedAt = new Date().toISOString();
    file.pendingTransaction.acceptedAt = acceptedAt;
    writeJson(LIFECYCLE_PATH, file);
  });
  if (action === "CREATE_POOL") await reconcilePoolId(file, clients, deployment.contractAddress);
  const after = file.poolId ? await poolState(clients, deployment.contractAddress, file.poolId) : undefined;
  const balanceAfter = await balance(clients.readClient, account.address);
  file.transactions.push({
    ...file.pendingTransaction,
    acceptedAt,
    finalizedAt: new Date().toISOString(),
    status: "FINALIZED",
    result: "SUCCESS",
    receipt: safeReceiptProjection(finalized, action, hash),
    explorer: `${EXPLORER_URL}/tx/${hash}`,
    balanceBeforeGEN: formatGen(balanceBefore),
    balanceAfterGEN: formatGen(balanceAfter),
    balanceDeltaGEN: formatGen(balanceAfter - balanceBefore),
    canonicalAfter: after?.canonical ?? null,
  });
  file.pendingTransaction = null;
  writeJson(LIFECYCLE_PATH, file);
}


async function reconcilePendingLifecycle(file, clients, deployment) {
  if (!file.pendingTransaction) return;
  const pending = file.pendingTransaction;
  const client = pending.actor === "sponsor" ? clients.sponsorClient : clients.integratorClient;
  const finalized = await client.waitForTransactionReceipt({
    hash: pending.transactionHash,
    status: TransactionStatus.FINALIZED,
    retries: 400,
    interval: 3_000,
  });
  const canonicalReceipt = await client.getTransaction({ hash: pending.transactionHash });
  if (!isSuccessfulFinalizedReceipt(canonicalReceipt)) {
    throw new Error(`${pending.action} pending transaction finalized without successful execution.`);
  }
  if (pending.action === "CREATE_POOL") await reconcilePoolId(file, clients, deployment.contractAddress);
  const after = file.poolId ? await poolState(clients, deployment.contractAddress, file.poolId) : undefined;
  file.transactions.push({
    ...pending,
    finalizedAt: new Date().toISOString(),
    status: "FINALIZED",
    result: "SUCCESS",
    receipt: safeReceiptProjection(canonicalReceipt, pending.action, pending.transactionHash),
    explorer: `${EXPLORER_URL}/tx/${pending.transactionHash}`,
    canonicalAfter: after?.canonical ?? null,
    balanceReconciliation: "PENDING_REAL_EVIDENCE_AFTER_RESUME",
  });
  file.pendingTransaction = null;
  writeJson(LIFECYCLE_PATH, file);
}


async function lifecycle() {
  const clients = roleClients();
  await chainId();
  const deployment = readJson(DEPLOYMENT_PATH, undefined);
  if (!deployment || deployment.result !== "SUCCESS") throw new Error("A successful active Studionet deployment is required.");
  const identity = currentIdentity(clients.sponsorAccount.address);
  if (deploymentDecision(deployment, identity) !== "RESUME") {
    throw new Error("Source/deployer identity differs from the active deployment.");
  }
  const file = lifecycleFile(deployment, clients);
  if (file.sponsorPoolIdsBefore.length === 0 && !file.poolId) {
    file.sponsorPoolIdsBefore = await sponsorPoolIds(clients, deployment.contractAddress);
    writeJson(LIFECYCLE_PATH, file);
  }
  await reconcilePendingLifecycle(file, clients, deployment);
  await reconcilePoolId(file, clients, deployment.contractAddress);

  for (let step = 0; step < 10; step += 1) {
    const state = file.poolId ? await poolState(clients, deployment.contractAddress, file.poolId) : undefined;
    const action = selectNextLifecycleAction(state);
    if (action === "COMPLETE") {
      file.status = "SUCCESS";
      file.completedAt = new Date().toISOString();
      file.finalCanonicalState = state.canonical;
      file.sponsorBalanceGEN = formatGen(await balance(clients.readClient, clients.sponsorAccount.address));
      file.integratorBalanceGEN = formatGen(await balance(clients.readClient, clients.integratorAccount.address));
      writeJson(LIFECYCLE_PATH, file);
      console.log(JSON.stringify({ Result: "SUCCESS", poolId: file.poolId, phase: state.phase, transactions: file.transactions.length }, null, 2));
      return;
    }
    if (action.startsWith("STOP_")) {
      file.status = action;
      file.lastCanonicalState = state?.canonical ?? null;
      writeJson(LIFECYCLE_PATH, file);
      throw new Error(`Lifecycle stopped safely at ${action}.`);
    }

    if (action === "CREATE_POOL") {
      const now = Math.floor(Date.now() / 1_000);
      await executeLifecycleWrite({
        file, clients, deployment, action, actor: "sponsor", functionName: "create_pool",
        args: ["OpenAI API incident dependency credit", INCIDENT_URL, SOURCE_POLICY_ID, now + 600, now + 900],
        value: 2n * GEN,
      });
    } else if (action === "INVITE") {
      await executeLifecycleWrite({
        file, clients, deployment, action, actor: "sponsor", functionName: "invite_dependency",
        args: [file.poolId, clients.integratorAccount.address, "openai.responses-api", "Production agent required successful OpenAI API requests and Responses API output during the named incident window."],
        before: state,
      });
    } else if (action === "ACCEPT") {
      await executeLifecycleWrite({ file, clients, deployment, action, actor: "integrator", functionName: "accept_dependency", args: [file.poolId], before: state });
    } else if (action === "LOCK") {
      await executeLifecycleWrite({ file, clients, deployment, action, actor: "sponsor", functionName: "lock_enrollment", args: [file.poolId], before: state });
    } else if (action === "REVIEW" || action === "RETRY") {
      await executeLifecycleWrite({
        file, clients, deployment, action, actor: "sponsor",
        functionName: action === "REVIEW" ? "request_review" : "retry_review",
        args: [file.poolId], before: state,
      });
    } else if (action === "WITHDRAW") {
      await executeLifecycleWrite({ file, clients, deployment, action, actor: "integrator", functionName: "withdraw_credit", args: [file.poolId], before: state });
    } else if (action === "RECOVER") {
      await executeLifecycleWrite({ file, clients, deployment, action, actor: "sponsor", functionName: "recover_reserve", args: [file.poolId], before: state });
    }
  }
  throw new Error("Lifecycle exceeded the bounded ten-step limit.");
}


async function recoverActiveLifecycle() {
  const clients = roleClients();
  await chainId();
  const deployment = readJson(DEPLOYMENT_PATH, undefined);
  const file = readJson(LIFECYCLE_PATH, undefined);
  if (!deployment || !file || file.contractAddress !== deployment.contractAddress || !file.poolId) {
    throw new Error("Active deployment/lifecycle evidence is incomplete.");
  }
  await reconcilePendingLifecycle(file, clients, deployment);
  let state = await poolState(clients, deployment.contractAddress, file.poolId);
  if (state.phase === "CANCELLED") {
    file.status = "RECOVERED_STRUCTURAL_RETRY";
    file.finalCanonicalState = state.canonical;
    file.recoveredAt ??= new Date().toISOString();
    writeJson(LIFECYCLE_PATH, file);
    console.log(JSON.stringify({ Result: "SUCCESS", resumed: true, poolId: file.poolId, phase: state.phase }, null, 2));
    return;
  }
  const safeRetryRecovery = state.phase === "RETRYABLE"
    && state.canonical.attempt.failure_code !== "SOURCE_UNAVAILABLE"
    && state.canonical.accounting.invariant_holds === true
    && state.canonical.accounting.participant_outstanding_gen === "0"
    && Number(state.canonical.accounting.sponsor_recoverable_gen) > 0;
  if (!safeRetryRecovery) throw new Error("Active lifecycle is not a safe structural-retry recovery candidate.");
  if (!state.cancelAvailable) {
    const notBefore = new Date(Number(state.canonical.pool.review_expiry) * 1_000).toISOString();
    console.log(JSON.stringify({
      Result: "PENDING_TIME_GATE",
      contractAddress: deployment.contractAddress,
      poolId: file.poolId,
      recoverableGEN: state.canonical.accounting.sponsor_recoverable_gen,
      notBefore,
    }, null, 2));
    throw new Error("Active reserve cannot be cancelled before its canonical review expiry.");
  }
  await executeLifecycleWrite({
    file,
    clients,
    deployment,
    action: "CANCEL_ACTIVE_STRUCTURAL_RETRY",
    actor: "sponsor",
    functionName: "cancel_pool",
    args: [file.poolId],
    before: state,
  });
  state = await poolState(clients, deployment.contractAddress, file.poolId);
  if (state.phase !== "CANCELLED"
    || state.canonical.accounting.sponsor_recoverable_gen !== "0"
    || state.canonical.accounting.participant_outstanding_gen !== "0"
    || state.canonical.accounting.invariant_holds !== true) {
    throw new Error("Active recovery finalized without zero canonical accounting.");
  }
  file.status = "RECOVERED_STRUCTURAL_RETRY";
  file.recoveredAt = new Date().toISOString();
  file.finalCanonicalState = state.canonical;
  writeJson(LIFECYCLE_PATH, file);
  console.log(JSON.stringify({ Result: "SUCCESS", poolId: file.poolId, phase: state.phase, accountingZero: true }, null, 2));
}


async function main() {
  const command = process.argv[2] ?? "inspect";
  if (command === "inspect") await inspect();
  else if (command === "deploy") await deploy();
  else if (command === "supersede") await supersede();
  else if (command === "recover-superseded") await recoverSuperseded(process.argv[3]);
  else if (command === "lifecycle") await lifecycle();
  else if (command === "recover-active") await recoverActiveLifecycle();
  else throw new Error("Usage: node scripts/studionet.mjs <inspect|deploy|supersede|recover-superseded|lifecycle|recover-active>");
}


if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown Studionet operation failure.";
    console.error(`Studionet operation stopped: ${message}`);
    process.exitCode = 1;
  });
}
