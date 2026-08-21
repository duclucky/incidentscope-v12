import type {
  ActivityItem,
  CreatePoolInput,
  DependencyProfile,
  InviteDependencyInput,
  PoolActionInput,
  PoolDetail,
  PoolQuery,
  PoolSummary,
  ReadResult,
  WriteResult,
} from "../domain/types";

export interface ContractConfiguration {
  readConfigured: boolean;
  writeConfigured: boolean;
  networkName: "Studionet";
  contractAddress?: string;
  icReadPath?: string;
  walletWriteChainId?: string;
}

export interface ContractAdapter {
  configuration: ContractConfiguration;
  listPools(query: PoolQuery): Promise<ReadResult<PoolSummary[]>>;
  getPool(poolId: string, account?: string): Promise<ReadResult<PoolDetail>>;
  listDependencies(account: string): Promise<ReadResult<DependencyProfile[]>>;
  listActivity(account: string): Promise<ReadResult<ActivityItem[]>>;
  createPool(input: CreatePoolInput): Promise<WriteResult>;
  inviteDependency(input: InviteDependencyInput): Promise<WriteResult>;
  acceptDependency(input: PoolActionInput): Promise<WriteResult>;
  lockEnrollment(input: PoolActionInput): Promise<WriteResult>;
  requestReview(input: PoolActionInput): Promise<WriteResult>;
  retryReview(input: PoolActionInput): Promise<WriteResult>;
  withdrawCredit(input: PoolActionInput): Promise<WriteResult>;
  recoverReserve(input: PoolActionInput): Promise<WriteResult>;
  cancelPool(input: PoolActionInput): Promise<WriteResult>;
}
