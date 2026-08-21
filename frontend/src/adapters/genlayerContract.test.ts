import { createGenLayerContractAdapter, type GenLayerClientLike } from "./genlayerContract";
import type { TransactionStage } from "../domain/types";
import type { Eip1193Provider } from "../wallet/types";


const ADDRESS = "0x1111111111111111111111111111111111111111";
const ACCOUNT = "0x2222222222222222222222222222222222222222";
const HASH = `0x${"a".repeat(64)}`;


function fakeClient(overrides: Partial<GenLayerClientLike> = {}): GenLayerClientLike {
  return {
    readContract: vi.fn(async ({ functionName }) => {
      if (functionName === "get_pool_count") return 1;
      if (functionName === "get_pool") return JSON.stringify({
        pool_id: "pool-1", title: "Agent API pool", sponsor: ACCOUNT, phase: "ENROLLING",
        reserve_gen: "2", acceptance_deadline: "1000000", created_at: "900000",
        incident_url: "https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV",
        accepted_count: 0, pending_count: 0,
      });
      if (functionName === "get_pool_profile_ids") return "[]";
      if (functionName === "get_pool_accounting") return JSON.stringify({
        participant_outstanding_gen: "0", sponsor_recoverable_gen: "2",
      });
      if (functionName === "get_available_actions") return JSON.stringify({
        invite: true, accept: false, lock: false, review: false, retry: false,
        withdraw: false, recover: false, cancel: true,
      });
      if (functionName === "get_account_profile") return JSON.stringify({ profile_id: "" });
      if (functionName === "get_account_pool_ids") return '["pool-1"]';
      throw new Error(`Unexpected read ${functionName}`);
    }),
    writeContract: vi.fn(async () => HASH),
    waitForTransactionReceipt: vi.fn(async ({ status }) => ({
      statusName: status,
      txExecutionResultName: "FINISHED_WITH_RETURN",
    })),
    ...overrides,
  };
}


describe("genlayer contract adapter", () => {
  it("uses a same-origin IC read path and maps canonical pool views", async () => {
    const configs: unknown[] = [];
    const client = fakeClient();
    const adapter = createGenLayerContractAdapter({
      contractAddress: ADDRESS,
      createClient: (config) => { configs.push(config); return client; },
    });

    expect(adapter.configuration).toMatchObject({
      readConfigured: true,
      writeConfigured: false,
      icReadPath: "/genlayer-rpc",
      walletWriteChainId: "0xf22f",
    });
    const result = await adapter.listPools({ query: "agent", status: "ALL" });
    expect(result).toEqual({
      status: "READY",
      data: [{
        id: "pool-1", title: "Agent API pool", provider: ACCOUNT, status: "ENROLLING",
        reserveGen: 2, enrollmentClosesAt: new Date(1_000_000 * 1000).toISOString(),
      }],
    });
    expect(configs[0]).toMatchObject({ endpoint: "/genlayer-rpc" });
  });


  it("maps role-derived actions and participant data from canonical views", async () => {
    const client = fakeClient({
      readContract: vi.fn(async ({ functionName }) => {
        if (functionName === "get_pool") return JSON.stringify({
          pool_id: "pool-1", title: "Agent API pool", sponsor: ADDRESS, phase: "DECIDED",
          reserve_gen: "2", acceptance_deadline: "1000000", created_at: "900000",
          incident_url: "https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV",
          accepted_count: 1, pending_count: 0,
        });
        if (functionName === "get_pool_profile_ids") return '["profile-1"]';
        if (functionName === "get_profile") return JSON.stringify({
          profile_id: "profile-1", integrator: ACCOUNT, capability_id: "responses.api",
          capability_profile: "Production Responses API agent traffic.", accepted: true,
          accepted_at: "950000", invited_at: "940000", classification: "IMPACTED",
          credit_gen: "1", withdrawn: false,
        });
        if (functionName === "get_pool_accounting") return JSON.stringify({
          participant_outstanding_gen: "1", sponsor_recoverable_gen: "0",
        });
        if (functionName === "get_available_actions") return JSON.stringify({
          invite: false, accept: false, lock: false, review: false, retry: false,
          withdraw: true, recover: false, cancel: false,
        });
        if (functionName === "get_account_profile") return JSON.stringify({
          profile_id: "profile-1", integrator: ACCOUNT, capability_id: "responses.api",
          capability_profile: "Production Responses API agent traffic.", accepted: true,
          accepted_at: "950000", invited_at: "940000", classification: "IMPACTED",
          credit_gen: "1", withdrawn: false,
        });
        throw new Error(`Unexpected read ${functionName}`);
      }),
    });
    const adapter = createGenLayerContractAdapter({
      contractAddress: ADDRESS,
      createClient: () => client,
    });
    const result = await adapter.getPool("pool-1", ACCOUNT);
    expect(result.status).toBe("READY");
    if (result.status !== "READY") return;
    expect(result.data.availableActions).toEqual(["WITHDRAW"]);
    expect(result.data.currentParticipant).toMatchObject({
      account: ACCOUNT, capabilityId: "responses.api", classification: "IMPACTED", creditGen: 1,
    });
    expect(result.data.impactedCount).toBe(1);
  });


  it("writes through the selected provider, reports accepted and finalized, then returns finality", async () => {
    const provider: Eip1193Provider = { request: vi.fn(async () => "0xf22f") };
    const client = fakeClient();
    const stages: TransactionStage[] = [];
    const adapter = createGenLayerContractAdapter({
      contractAddress: ADDRESS,
      account: ACCOUNT,
      provider,
      createClient: () => client,
      onTransactionStage: (event) => stages.push(event.stage),
    });
    const result = await adapter.createPool({
      title: "Agent API pool",
      incidentUrl: "https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV",
      enrollmentClosesAt: "2026-08-22T00:00:00.000Z",
      reserveGen: 2,
    });
    expect(client.writeContract).toHaveBeenCalledWith(expect.objectContaining({
      address: ADDRESS,
      functionName: "create_pool",
      value: 2n * 10n ** 18n,
    }));
    expect(stages).toEqual(["SUBMITTED", "ACCEPTED", "FINALIZED"]);
    expect(result).toEqual({ status: "FINALIZED", transactionHash: HASH, poolId: "pool-1" });
  });


  it("does not claim success when finalized execution failed", async () => {
    const provider: Eip1193Provider = { request: vi.fn(async () => "0xf22f") };
    const stages: TransactionStage[] = [];
    const client = fakeClient({
      waitForTransactionReceipt: vi.fn(async ({ status }) => ({
        statusName: status,
        txExecutionResultName: status === "FINALIZED" ? "FINISHED_WITH_ERROR" : "NOT_VOTED",
      })),
    });
    const adapter = createGenLayerContractAdapter({
      contractAddress: ADDRESS, account: ACCOUNT, provider,
      createClient: () => client,
      onTransactionStage: (event) => stages.push(event.stage),
    });
    const result = await adapter.lockEnrollment({ poolId: "pool-1" });
    expect(result.status).toBe("REJECTED");
    expect(stages).toEqual(["SUBMITTED", "ACCEPTED", "FAILED"]);
  });

  it("accepts finalized Studio SUCCESS receipts without the normalized execution enum", async () => {
    const provider: Eip1193Provider = { request: vi.fn(async () => "0xf22f") };
    const stages: TransactionStage[] = [];
    const client = fakeClient({
      waitForTransactionReceipt: vi.fn(async ({ status }) => ({
        statusName: status,
        txExecutionResultName: status === "FINALIZED" ? undefined : "NOT_VOTED",
        execution_result: status === "FINALIZED" ? "SUCCESS" : undefined,
        resultName: status === "FINALIZED" ? "MAJORITY_AGREE" : undefined,
      })),
    });
    const adapter = createGenLayerContractAdapter({
      contractAddress: ADDRESS,
      account: ACCOUNT,
      provider,
      createClient: () => client,
      onTransactionStage: (event) => stages.push(event.stage),
    });
    const result = await adapter.createPool({
      title: "Agent API pool",
      incidentUrl: "https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV",
      enrollmentClosesAt: "2026-08-22T00:00:00.000Z",
      reserveGen: 1,
    });
    expect(result).toEqual({ status: "FINALIZED", transactionHash: HASH, poolId: "pool-1" });
    expect(stages).toEqual(["SUBMITTED", "ACCEPTED", "FINALIZED"]);
  });

  it("maps every lifecycle write to the matching contract entrypoint", async () => {
    const provider: Eip1193Provider = { request: vi.fn(async () => "0xf22f") };
    const client = fakeClient();
    const adapter = createGenLayerContractAdapter({
      contractAddress: ADDRESS, account: ACCOUNT, provider,
      createClient: () => client,
    });

    await adapter.inviteDependency({
      poolId: "pool-1", integrator: ADDRESS, capabilityId: "responses.api",
      dependencyProfile: "Production Responses API agent traffic.",
    });
    await adapter.acceptDependency({ poolId: "pool-1" });
    await adapter.lockEnrollment({ poolId: "pool-1" });
    await adapter.requestReview({ poolId: "pool-1" });
    await adapter.retryReview({ poolId: "pool-1" });
    await adapter.withdrawCredit({ poolId: "pool-1" });
    await adapter.recoverReserve({ poolId: "pool-1" });
    await adapter.cancelPool({ poolId: "pool-1" });

    expect(vi.mocked(client.writeContract).mock.calls.map(([request]) => request.functionName)).toEqual([
      "invite_dependency", "accept_dependency", "lock_enrollment", "request_review",
      "retry_review", "withdraw_credit", "recover_reserve", "cancel_pool",
    ]);
    expect(client.writeContract).toHaveBeenNthCalledWith(1, expect.objectContaining({
      args: ["pool-1", ADDRESS, "responses.api", "Production Responses API agent traffic."],
      value: 0n,
    }));
  });
});
