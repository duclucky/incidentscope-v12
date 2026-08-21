export type PoolStatus =
  | "ENROLLING"
  | "LOCKED"
  | "RETRYABLE"
  | "DECIDED"
  | "CLOSED"
  | "CANCELLED";

export type PoolStatusFilter = PoolStatus | "ALL";

export interface PoolQuery {
  query: string;
  status: PoolStatusFilter;
}

export interface PoolSummary {
  id: string;
  title: string;
  provider: string;
  status: PoolStatus;
  reserveGen: 1 | 2;
  enrollmentClosesAt: string;
}

export type ImpactClass = "IMPACTED" | "NOT_IMPACTED" | "AMBIGUOUS";

export type PoolAvailableAction =
  | "INVITE"
  | "ACCEPT"
  | "LOCK"
  | "REVIEW"
  | "RETRY"
  | "WITHDRAW"
  | "RECOVER"
  | "CANCEL";

export interface DependencyInvitation {
  integrator: string;
  capabilityId: string;
  dependencyProfile: string;
}

export interface ParticipantOutcome {
  account: string;
  capabilityId: string;
  dependencyProfile: string;
  classification?: ImpactClass;
  creditGen: number;
  withdrawn: boolean;
}

export interface PoolDetail extends PoolSummary {
  incidentUrl: string;
  createdAt: string;
  participantCount: number;
  impactedCount: number;
  ambiguousCount: number;
  remainingReserveGen: number;
  sponsorRecoverableGen: number;
  availableActions: PoolAvailableAction[];
  pendingInvitation?: DependencyInvitation;
  currentParticipant?: ParticipantOutcome;
}

export interface DependencyProfile {
  poolId: string;
  poolTitle: string;
  profile: string;
  enrolledAt: string;
  poolStatus: PoolStatus;
  classification?: ImpactClass;
  creditGen: number;
  withdrawn: boolean;
}

export type TransactionStage =
  | "SUBMITTED"
  | "ACCEPTED"
  | "DECIDED"
  | "FINALIZED"
  | "FAILED"
  | "RETRYABLE";

export interface ActivityItem {
  id: string;
  poolId: string;
  title: string;
  stage: TransactionStage;
  occurredAt: string;
  transactionHash?: string;
}

export interface CreatePoolInput {
  title: string;
  incidentUrl: string;
  enrollmentClosesAt: string;
  reserveGen: 1 | 2;
}

export interface InviteDependencyInput {
  poolId: string;
  integrator: string;
  capabilityId: string;
  dependencyProfile: string;
}

export interface PoolActionInput {
  poolId: string;
}

export type WriteResult =
  | { status: "SUBMITTED"; transactionHash: string }
  | { status: "FINALIZED"; transactionHash: string; poolId: string }
  | { status: "RETRYABLE"; transactionHash: string; poolId: string }
  | { status: "REJECTED"; message: string }
  | { status: "UNAVAILABLE"; message: string };

export type ReadResult<T> =
  | { status: "READY"; data: T }
  | { status: "EMPTY"; message: string }
  | { status: "UNCONFIGURED"; message: string }
  | { status: "ERROR"; message: string; retryable: boolean };
