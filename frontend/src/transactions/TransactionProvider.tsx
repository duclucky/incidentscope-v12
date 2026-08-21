import { CheckCircle, Clock, WarningCircle, X } from "@phosphor-icons/react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { TransactionStage } from "../domain/types";

export interface TransactionEvent {
  id: string;
  poolId: string;
  title: string;
  stage: TransactionStage;
  message?: string;
  transactionHash?: string;
}

interface TransactionContextValue {
  transactions: TransactionEvent[];
  report(event: TransactionEvent): void;
  dismiss(id: string): void;
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);

function dispatchCanonicalReload(poolId: string) {
  window.dispatchEvent(new CustomEvent("incidentscope:canonical-reload", { detail: { poolId } }));
}

export function TransactionProvider({ children, onCanonicalReload = dispatchCanonicalReload }: { children: ReactNode; onCanonicalReload?: (poolId: string) => void }) {
  const [records, setRecords] = useState<Record<string, TransactionEvent>>({});
  const recordsRef = useRef(records);

  const report = useCallback((event: TransactionEvent) => {
    const previous = recordsRef.current[event.id];
    if ((previous?.stage === "FAILED" && event.stage !== "FAILED") || (previous?.stage === "FINALIZED" && event.stage !== "FINALIZED")) return;
    const next = { ...recordsRef.current, [event.id]: event };
    recordsRef.current = next;
    setRecords(next);
    if (event.stage === "FINALIZED" || event.stage === "RETRYABLE") onCanonicalReload(event.poolId);
  }, [onCanonicalReload]);

  const dismiss = useCallback((id: string) => {
    const next = { ...recordsRef.current };
    delete next[id];
    recordsRef.current = next;
    setRecords(next);
  }, []);

  const value = useMemo(() => ({ transactions: Object.values(records), report, dismiss }), [records, report, dismiss]);
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactions(): TransactionContextValue {
  const value = useContext(TransactionContext);
  if (!value) throw new Error("useTransactions must be used inside TransactionProvider");
  return value;
}

const stageLanguage: Record<TransactionStage, string> = {
  SUBMITTED: "Submitted", ACCEPTED: "Accepted — finality pending", DECIDED: "Decision accepted — finality pending",
  FINALIZED: "Finalized", FAILED: "Failed", RETRYABLE: "Retry available",
};

export function TransactionNoticeCenter() {
  const { transactions, dismiss } = useTransactions();
  const event = transactions.at(-1);
  if (!event) return null;
  const Icon = event.stage === "FINALIZED" ? CheckCircle : event.stage === "FAILED" || event.stage === "RETRYABLE" ? WarningCircle : Clock;
  return <div className={`transaction-notice notice-${event.stage.toLowerCase()}`} role={event.stage === "FAILED" ? "alert" : "status"} aria-live={event.stage === "FAILED" ? "assertive" : "polite"}><Icon aria-hidden="true" /><div><strong>{stageLanguage[event.stage]}</strong><span>{event.message ?? event.title}</span></div><button type="button" aria-label="Dismiss transaction notice" onClick={() => dismiss(event.id)}><X aria-hidden="true" /></button></div>;
}
