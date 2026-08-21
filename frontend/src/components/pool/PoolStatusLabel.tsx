import type { PoolStatus } from "../../domain/types";

export const poolStatusLanguage: Record<PoolStatus, string> = {
  ENROLLING: "Open for dependency acceptance",
  LOCKED: "Enrollment locked",
  RETRYABLE: "Official evidence could not be verified",
  DECIDED: "Scope decision finalized",
  CLOSED: "Credits settled",
  CANCELLED: "Pool cancelled safely",
};

export function PoolStatusLabel({ status }: { status: PoolStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{poolStatusLanguage[status]}</span>;
}
