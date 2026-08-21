import type { ContractAdapter } from "./contract";

const UNCONFIGURED_MESSAGE = "Canonical contract reads are not configured yet.";
const WRITE_UNAVAILABLE_MESSAGE = "Contract writes are not configured yet.";

export function createUnconfiguredContractAdapter(): ContractAdapter {
  const unavailableRead = async () => ({
    status: "UNCONFIGURED" as const,
    message: UNCONFIGURED_MESSAGE,
  });
  const unavailableWrite = async () => ({
    status: "UNAVAILABLE" as const,
    message: WRITE_UNAVAILABLE_MESSAGE,
  });

  return {
    configuration: {
      readConfigured: false,
      writeConfigured: false,
      networkName: "Studionet",
    },
    listPools: unavailableRead,
    getPool: unavailableRead,
    listDependencies: unavailableRead,
    listActivity: unavailableRead,
    createPool: unavailableWrite,
    inviteDependency: unavailableWrite,
    acceptDependency: unavailableWrite,
    lockEnrollment: unavailableWrite,
    requestReview: unavailableWrite,
    retryReview: unavailableWrite,
    withdrawCredit: unavailableWrite,
    recoverReserve: unavailableWrite,
    cancelPool: unavailableWrite,
  };
}
