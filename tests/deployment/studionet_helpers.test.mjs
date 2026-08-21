import test from "node:test";
import assert from "node:assert/strict";

import {
  deploymentDecision,
  isSuccessfulFinalizedReceipt,
  safeReceiptProjection,
  selectNextLifecycleAction,
  supersessionDecision,
} from "../../scripts/studionet.mjs";


test("safe receipt projection excludes validator-private and raw payload fields", () => {
  const projected = safeReceiptProjection({
    statusName: "FINALIZED",
    txExecutionResultName: "FINISHED_WITH_RETURN",
    hash: `0x${"a".repeat(64)}`,
    data: { contract_address: "0x1111111111111111111111111111111111111111" },
    node_config: { private: "must-not-leak" },
    txData: "0xraw",
    txReceipt: "0xprivate-receipt",
  }, "deploy");

  assert.deepEqual(Object.keys(projected).sort(), [
    "consensusResult", "contractAddress", "label", "status", "transactionHash", "txExecutionResult",
  ]);
  assert.equal(JSON.stringify(projected).includes("must-not-leak"), false);
  assert.equal(JSON.stringify(projected).includes("0xraw"), false);
});


test("raw Studio finality requires both majority consensus and successful leader execution", () => {
  const success = {
    status: 7,
    result: 6,
    consensus_data: { leader_receipt: [{ execution_result: "SUCCESS", node_config: { private: true } }] },
  };
  assert.equal(isSuccessfulFinalizedReceipt(success), true);
  assert.deepEqual(safeReceiptProjection(success, "deploy", `0x${"b".repeat(64)}`), {
    label: "deploy",
    transactionHash: `0x${"b".repeat(64)}`,
    status: "FINALIZED",
    txExecutionResult: "SUCCESS",
    consensusResult: "MAJORITY_AGREE",
    contractAddress: null,
  });
  assert.equal(isSuccessfulFinalizedReceipt({ ...success, result: 7 }), false);
  assert.equal(isSuccessfulFinalizedReceipt({ ...success, consensus_data: { leader_receipt: [{ execution_result: "ERROR" }] } }), false);
});


test("deployment decision resumes an identical finalized deployment and refuses identity drift", () => {
  const current = { network: "studionet", chainId: 61999, sourceCommit: "abc", sourceSha256: "def", depends: "runner", deployer: "0xsponsor" };
  assert.equal(deploymentDecision(undefined, current), "DEPLOY");
  assert.equal(deploymentDecision({ ...current, result: "SUCCESS", contractAddress: "0xcontract" }, current), "RESUME");
  assert.equal(deploymentDecision({ ...current, sourceSha256: "changed", result: "SUCCESS", contractAddress: "0xcontract" }, current), "REFUSE");
});


test("supersession requires a source change and a non-penalizing recoverable canonical state", () => {
  const existing = { sourceSha256: "old", contractAddress: "0xcontract" };
  const lifecycle = {
    contractAddress: "0xcontract",
    lastCanonicalState: {
      pool: { phase: "RETRYABLE" },
      attempt: { failure_code: "SOURCE_CONTRADICTORY" },
      accounting: { invariant_holds: true, participant_outstanding_gen: "0", sponsor_recoverable_gen: "2" },
    },
  };
  assert.equal(supersessionDecision(existing, lifecycle, { sourceSha256: "new" }), "ARCHIVE_PENDING_RECOVERY");
  assert.equal(supersessionDecision(existing, lifecycle, { sourceSha256: "old" }), "REFUSE_IDENTICAL_SOURCE");
  assert.equal(supersessionDecision(existing, {
    ...lifecycle,
    lastCanonicalState: { ...lifecycle.lastCanonicalState, accounting: { invariant_holds: true, participant_outstanding_gen: "1", sponsor_recoverable_gen: "1" } },
  }, { sourceSha256: "new" }), "REFUSE_UNSAFE_STATE");
  assert.equal(supersessionDecision(existing, {
    ...lifecycle,
    finalCanonicalState: {
      pool: { phase: "CANCELLED" },
      attempt: { failure_code: "SOURCE_CONTRADICTORY" },
      accounting: { invariant_holds: true, participant_outstanding_gen: "0", sponsor_recoverable_gen: "0" },
    },
  }, { sourceSha256: "new" }), "ARCHIVE_RECOVERED");
});


test("lifecycle selection resumes from canonical state without replaying completed writes", () => {
  assert.equal(selectNextLifecycleAction(undefined), "CREATE_POOL");
  assert.equal(selectNextLifecycleAction({ phase: "ENROLLING", acceptedCount: 0, pendingCount: 0, hasIntegratorProfile: false }), "INVITE");
  assert.equal(selectNextLifecycleAction({ phase: "ENROLLING", acceptedCount: 0, pendingCount: 1, hasIntegratorProfile: true, integratorAccepted: false }), "ACCEPT");
  assert.equal(selectNextLifecycleAction({ phase: "ENROLLING", acceptedCount: 1, pendingCount: 0, hasIntegratorProfile: true, integratorAccepted: true }), "LOCK");
  assert.equal(selectNextLifecycleAction({ phase: "LOCKED" }), "REVIEW");
  assert.equal(selectNextLifecycleAction({ phase: "RETRYABLE", retryTransient: true, retryExhausted: false }), "RETRY");
  assert.equal(selectNextLifecycleAction({ phase: "RETRYABLE", retryTransient: true, retryExhausted: true }), "STOP_RETRY_EXHAUSTED");
  assert.equal(selectNextLifecycleAction({ phase: "RETRYABLE", retryTransient: false }), "STOP_STRUCTURAL_RETRY");
  assert.equal(selectNextLifecycleAction({ phase: "DECIDED", withdrawAvailable: true }), "WITHDRAW");
  assert.equal(selectNextLifecycleAction({ phase: "DECIDED", withdrawAvailable: false, recoverAvailable: true }), "RECOVER");
  assert.equal(selectNextLifecycleAction({ phase: "CLOSED" }), "COMPLETE");
});
