import { createClient as createSdkClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import type {
  ActivityItem,
  CreatePoolInput,
  DependencyProfile,
  ImpactClass,
  InviteDependencyInput,
  PoolActionInput,
  PoolAvailableAction,
  PoolDetail,
  PoolQuery,
  PoolStatus,
  PoolSummary,
  TransactionStage,
  WriteResult,
} from "../domain/types";
import { ensureStudionetWalletChain, STUDIONET_NETWORK } from "../wallet/network";
import type { Eip1193Provider } from "../wallet/types";
import type { ContractAdapter } from "./contract";


const GEN = 10n ** 18n;
const SOURCE_POLICY_ID = "OPENAI_STATUS_V1";
const DEFAULT_READ_PATH = "/genlayer-rpc";

type Address = `0x${string}`;

export interface GenLayerClientLike {
  readContract(args: {
    address: Address;
    functionName: string;
    args?: unknown[];
  }): Promise<unknown>;
  writeContract(args: {
    address: Address;
    functionName: string;
    args?: unknown[];
    value: bigint;
  }): Promise<unknown>;
  waitForTransactionReceipt(args: {
    hash: Address;
    status: TransactionStatus | string;
  }): Promise<Record<string, unknown>>;
}

interface ClientConfig {
  chain: typeof studionet;
  endpoint?: string;
  account?: Address;
  provider?: Eip1193Provider;
}

interface TransactionStageEvent {
  id: string;
  poolId: string;
  title: string;
  stage: TransactionStage;
  message?: string;
  transactionHash?: string;
}

interface AdapterOptions {
  contractAddress: string;
  account?: string;
  provider?: Eip1193Provider;
  icReadPath?: string;
  createClient?: (config: ClientConfig) => GenLayerClientLike;
  onTransactionStage?: (event: TransactionStageEvent) => void;
}

interface RawPool {
  pool_id: string;
  title: string;
  sponsor: string;
  phase: string;
  reserve_gen: string;
  acceptance_deadline: string;
  created_at: string;
  incident_url: string;
  accepted_count: number;
  pending_count: number;
}

interface RawProfile {
  profile_id: string;
  integrator?: string;
  capability_id?: string;
  capability_profile?: string;
  invited_at?: string;
  accepted_at?: string;
  accepted?: boolean;
  classification?: string;
  credit_gen?: string;
  withdrawn?: boolean;
}

interface RawAccounting {
  participant_outstanding_gen?: string;
  sponsor_recoverable_gen?: string;
}

type BooleanActionMap = Record<string, boolean>;


function cloneStudionet(): typeof studionet {
  return {
    ...studionet,
    rpcUrls: {
      ...studionet.rpcUrls,
      default: { http: [...studionet.rpcUrls.default.http] },
    },
  };
}


function productionClient(config: ClientConfig): GenLayerClientLike {
  return createSdkClient(config as Parameters<typeof createSdkClient>[0]) as unknown as GenLayerClientLike;
}


function isAddress(value: string | undefined): value is Address {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}


function isTransactionHash(value: unknown): value is Address {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}


function parseJson<T>(value: unknown): T {
  if (typeof value === "string") return JSON.parse(value) as T;
  if (typeof value === "object" && value !== null) return value as T;
  throw new Error("Canonical contract view returned an unexpected shape.");
}


function asNumber(value: unknown): number {
  const parsed = typeof value === "bigint" ? Number(value) : Number(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}


function epochToIso(value: unknown): string {
  return new Date(asNumber(value) * 1000).toISOString();
}


function poolStatus(value: string): PoolStatus {
  if (["ENROLLING", "LOCKED", "RETRYABLE", "DECIDED", "CLOSED", "CANCELLED"].includes(value)) {
    return value as PoolStatus;
  }
  throw new Error("Canonical pool returned an unsupported status.");
}


function impactClass(value: string | undefined): ImpactClass | undefined {
  if (value === "IMPACTED" || value === "NOT_IMPACTED" || value === "AMBIGUOUS") return value;
  return undefined;
}


function summary(raw: RawPool): PoolSummary {
  const reserve = asNumber(raw.reserve_gen);
  if (reserve !== 1 && reserve !== 2) throw new Error("Canonical pool reserve is outside the supported 1-2 GEN range.");
  return {
    id: raw.pool_id,
    title: raw.title,
    provider: raw.sponsor,
    status: poolStatus(raw.phase),
    reserveGen: reserve,
    enrollmentClosesAt: epochToIso(raw.acceptance_deadline),
  };
}


function readError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "Canonical contract read failed.";
  return {
    status: "ERROR" as const,
    message: message.includes("Failed to fetch")
      ? "The canonical read path could not reach Studionet. Retry after checking the same-origin RPC route."
      : message,
    retryable: true,
  };
}


function selectedActions(value: BooleanActionMap): PoolAvailableAction[] {
  const mapping: Array<[string, PoolAvailableAction]> = [
    ["invite", "INVITE"], ["accept", "ACCEPT"], ["lock", "LOCK"], ["review", "REVIEW"],
    ["retry", "RETRY"], ["withdraw", "WITHDRAW"], ["recover", "RECOVER"], ["cancel", "CANCEL"],
  ];
  return mapping.filter(([key]) => value[key] === true).map(([, action]) => action);
}


function stageTitle(methodName: string): string {
  const words = methodName.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}


export function createGenLayerContractAdapter(options: AdapterOptions): ContractAdapter {
  if (!isAddress(options.contractAddress)) {
    throw new Error("A valid deployed contract address is required.");
  }
  const address = options.contractAddress;
  const createClient = options.createClient ?? productionClient;
  const readPath = options.icReadPath ?? DEFAULT_READ_PATH;
  const readClient = createClient({ chain: cloneStudionet(), endpoint: readPath });
  const account = isAddress(options.account) ? options.account : undefined;
  const writeReady = Boolean(account && options.provider);

  const read = async (functionName: string, args: unknown[] = []) =>
    readClient.readContract({ address, functionName, args });

  const getRawPool = async (poolId: string) => parseJson<RawPool>(await read("get_pool", [poolId]));
  const getRawProfile = async (profileId: string) => parseJson<RawProfile>(await read("get_profile", [profileId]));

  const listPools: ContractAdapter["listPools"] = async (query: PoolQuery) => {
    try {
      const count = asNumber(await read("get_pool_count"));
      if (count === 0) return { status: "EMPTY", message: "No canonical credit pools have been created." };
      const pools = await Promise.all(
        Array.from({ length: count }, (_, index) => getRawPool(`pool-${index + 1}`).then(summary)),
      );
      const needle = query.query.trim().toLowerCase();
      return {
        status: "READY",
        data: pools.filter((pool) =>
          (needle === "" || pool.title.toLowerCase().includes(needle) || pool.id.toLowerCase().includes(needle))
          && (query.status === "ALL" || pool.status === query.status)),
      };
    } catch (cause) {
      return readError(cause);
    }
  };

  const getPool: ContractAdapter["getPool"] = async (poolId, requestedAccount) => {
    try {
      const rawPool = await getRawPool(poolId);
      const profileIds = parseJson<string[]>(await read("get_pool_profile_ids", [poolId]));
      const profiles = await Promise.all(profileIds.map(getRawProfile));
      const accounting = parseJson<RawAccounting>(await read("get_pool_accounting", [poolId]));
      const actionMap = requestedAccount && isAddress(requestedAccount)
        ? parseJson<BooleanActionMap>(await read("get_available_actions", [poolId, requestedAccount]))
        : {};
      const accountProfile = requestedAccount && isAddress(requestedAccount)
        ? parseJson<RawProfile>(await read("get_account_profile", [poolId, requestedAccount]))
        : undefined;
      const accepted = profiles.filter((profile) => profile.accepted);
      const participant = accountProfile?.profile_id ? accountProfile : undefined;
      const base = summary(rawPool);
      const participantOutstanding = asNumber(accounting.participant_outstanding_gen);
      const sponsorRecoverable = asNumber(accounting.sponsor_recoverable_gen);
      return {
        status: "READY",
        data: {
          ...base,
          incidentUrl: rawPool.incident_url,
          createdAt: epochToIso(rawPool.created_at),
          participantCount: accepted.length,
          impactedCount: accepted.filter((profile) => profile.classification === "IMPACTED").length,
          ambiguousCount: accepted.filter((profile) => profile.classification === "AMBIGUOUS").length,
          remainingReserveGen: participantOutstanding + sponsorRecoverable,
          sponsorRecoverableGen: sponsorRecoverable,
          availableActions: selectedActions(actionMap),
          pendingInvitation: participant && !participant.accepted ? {
            integrator: participant.integrator ?? requestedAccount ?? "",
            capabilityId: participant.capability_id ?? "",
            dependencyProfile: participant.capability_profile ?? "",
          } : undefined,
          currentParticipant: participant ? {
            account: participant.integrator ?? requestedAccount ?? "",
            capabilityId: participant.capability_id ?? "",
            dependencyProfile: participant.capability_profile ?? "",
            classification: impactClass(participant.classification),
            creditGen: asNumber(participant.credit_gen),
            withdrawn: Boolean(participant.withdrawn),
          } : undefined,
        },
      };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Pool read failed.";
      if (message.toLowerCase().includes("unknown pool")) {
        return { status: "EMPTY", message: "No canonical pool exists with this ID." };
      }
      return readError(cause);
    }
  };

  const listDependencies: ContractAdapter["listDependencies"] = async (requestedAccount) => {
    if (!isAddress(requestedAccount)) return { status: "EMPTY", message: "Connect a valid account to view dependencies." };
    try {
      const poolIds = parseJson<string[]>(await read("get_account_pool_ids", [requestedAccount]));
      const dependencies: DependencyProfile[] = [];
      for (const poolId of poolIds) {
        const [rawPool, profile] = await Promise.all([
          getRawPool(poolId),
          read("get_account_profile", [poolId, requestedAccount]).then((value) => parseJson<RawProfile>(value)),
        ]);
        if (!profile.profile_id) continue;
        dependencies.push({
          poolId,
          poolTitle: rawPool.title,
          profile: profile.capability_profile ?? "",
          enrolledAt: epochToIso(profile.accepted ? profile.accepted_at : profile.invited_at),
          poolStatus: poolStatus(rawPool.phase),
          classification: impactClass(profile.classification),
          creditGen: asNumber(profile.credit_gen),
          withdrawn: Boolean(profile.withdrawn),
        });
      }
      return dependencies.length > 0
        ? { status: "READY", data: dependencies }
        : { status: "EMPTY", message: "No canonical dependency invitations exist for this account." };
    } catch (cause) {
      return readError(cause);
    }
  };

  const listActivity: ContractAdapter["listActivity"] = async (requestedAccount) => {
    if (!isAddress(requestedAccount)) return { status: "EMPTY", message: "Connect a valid account to view activity." };
    try {
      const poolIds = parseJson<string[]>(await read("get_account_pool_ids", [requestedAccount]));
      const items: ActivityItem[] = await Promise.all(poolIds.map(async (poolId) => {
        const pool = await getRawPool(poolId);
        return {
          id: `${poolId}-${pool.phase.toLowerCase()}`,
          poolId,
          title: `${pool.title} · canonical ${pool.phase.toLowerCase()}`,
          stage: pool.phase === "RETRYABLE" ? "RETRYABLE" : "FINALIZED",
          occurredAt: epochToIso(pool.created_at),
        };
      }));
      return items.length > 0
        ? { status: "READY", data: items }
        : { status: "EMPTY", message: "No canonical pool activity exists for this account." };
    } catch (cause) {
      return readError(cause);
    }
  };

  const write = async (
    methodName: string,
    args: unknown[],
    value: bigint,
    poolId: string,
  ): Promise<WriteResult> => {
    if (!account || !options.provider) {
      return { status: "UNAVAILABLE", message: "Select a wallet account before writing to the contract." };
    }
    const title = stageTitle(methodName);
    try {
      await ensureStudionetWalletChain(options.provider);
      const writeClient = createClient({
        chain: cloneStudionet(), account, provider: options.provider,
      });
      const rawHash = await writeClient.writeContract({ address, functionName: methodName, args, value });
      if (!isTransactionHash(rawHash)) {
        throw new Error("Wallet submission returned an invalid transaction hash.");
      }
      const transactionHash = rawHash;
      const eventBase = { id: transactionHash, poolId, title, transactionHash };
      options.onTransactionStage?.({ ...eventBase, stage: "SUBMITTED", message: "Wallet submitted the transaction; consensus is pending." });
      await writeClient.waitForTransactionReceipt({ hash: transactionHash, status: TransactionStatus.ACCEPTED });
      options.onTransactionStage?.({
        ...eventBase,
        stage: methodName === "request_review" || methodName === "retry_review" ? "DECIDED" : "ACCEPTED",
        message: "Consensus accepted the transaction; finality is pending.",
      });
      const receipt = await writeClient.waitForTransactionReceipt({ hash: transactionHash, status: TransactionStatus.FINALIZED });
      if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
        options.onTransactionStage?.({ ...eventBase, stage: "FAILED", message: "The finalized transaction did not execute successfully." });
        return { status: "REJECTED", message: "The transaction finalized with an execution error." };
      }

      let resolvedPoolId = poolId;
      if (methodName === "create_pool") {
        resolvedPoolId = `pool-${asNumber(await read("get_pool_count"))}`;
      }
      let finalStage: TransactionStage = "FINALIZED";
      if (methodName === "request_review" || methodName === "retry_review") {
        const finalizedPool = await getRawPool(resolvedPoolId);
        if (finalizedPool.phase === "RETRYABLE") finalStage = "RETRYABLE";
      }
      options.onTransactionStage?.({
        ...eventBase,
        poolId: resolvedPoolId,
        stage: finalStage,
        message: finalStage === "RETRYABLE"
          ? "Finalized without a hard consequence; canonical state permits a retry."
          : "Finalized successfully; canonical state is reloading.",
      });
      return { status: finalStage, transactionHash, poolId: resolvedPoolId };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The transaction failed.";
      options.onTransactionStage?.({
        id: `${methodName}-${Date.now()}`, poolId, title, stage: "FAILED", message,
      });
      return { status: "REJECTED", message };
    }
  };

  const action = (methodName: string) => (input: PoolActionInput) => write(methodName, [input.poolId], 0n, input.poolId);

  return {
    configuration: {
      readConfigured: true,
      writeConfigured: writeReady,
      networkName: "Studionet",
      contractAddress: address,
      icReadPath: readPath,
      walletWriteChainId: STUDIONET_NETWORK.chainIdHex,
    },
    listPools,
    getPool,
    listDependencies,
    listActivity,
    createPool: (input: CreatePoolInput) => {
      const acceptance = Math.floor(new Date(input.enrollmentClosesAt).getTime() / 1000);
      const reviewExpiry = acceptance + 7 * 86_400;
      return write(
        "create_pool",
        [input.title, input.incidentUrl, SOURCE_POLICY_ID, acceptance, reviewExpiry],
        BigInt(input.reserveGen) * GEN,
        "new-pool",
      );
    },
    inviteDependency: (input: InviteDependencyInput) => write(
      "invite_dependency",
      [input.poolId, input.integrator, input.capabilityId, input.dependencyProfile],
      0n,
      input.poolId,
    ),
    acceptDependency: action("accept_dependency"),
    lockEnrollment: action("lock_enrollment"),
    requestReview: action("request_review"),
    retryReview: action("retry_review"),
    withdrawCredit: action("withdraw_credit"),
    recoverReserve: action("recover_reserve"),
    cancelPool: action("cancel_pool"),
  };
}
