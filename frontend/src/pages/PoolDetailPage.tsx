import { ArrowLeft, ArrowSquareOut, CheckCircle, Info, Users } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useContractAdapter } from "../adapters/ContractAdapterProvider";
import { PageState } from "../components/PageState";
import { PoolActionPanel, type PoolUiAction } from "../components/pool/PoolActionPanel";
import { PoolStatusLabel } from "../components/pool/PoolStatusLabel";
import type { PoolDetail, ReadResult, WriteResult } from "../domain/types";
import { useCanonicalReload } from "../transactions/useCanonicalReload";
import { useWallet } from "../wallet/WalletProvider";

const impactLanguage = {
  IMPACTED: { label: "In incident scope", description: "The official incident narrative covers this locked dependency." },
  NOT_IMPACTED: { label: "Outside stated incident scope", description: "The official narrative does not cover this locked dependency." },
  AMBIGUOUS: { label: "Scope not clear enough", description: "The official wording cannot support a hard consequence." },
} as const;

export function PoolDetailPage() {
  const { poolId = "" } = useParams();
  const adapter = useContractAdapter();
  const { account } = useWallet();
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<ReadResult<PoolDetail> | { status: "LOADING" }>({ status: "LOADING" });
  const [writeResult, setWriteResult] = useState<WriteResult>();
  const [busy, setBusy] = useState(false);
  useCanonicalReload(useCallback(() => setReload((value) => value + 1), []), poolId);

  const load = useCallback(() => {
    let active = true;
    setResult({ status: "LOADING" });
    void adapter.getPool(poolId, account).then((next) => { if (active) setResult(next); });
    return () => { active = false; };
  }, [account, adapter, poolId]);

  useEffect(() => load(), [load, reload]);

  const act = async (action: PoolUiAction) => {
    setBusy(true);
    setWriteResult(undefined);
    try {
      const next = action.kind === "INVITE"
        ? await adapter.inviteDependency({ poolId, integrator: action.integrator, capabilityId: action.capabilityId, dependencyProfile: action.dependencyProfile })
        : action.kind === "ACCEPT" ? await adapter.acceptDependency({ poolId })
        : action.kind === "LOCK" ? await adapter.lockEnrollment({ poolId })
        : action.kind === "REVIEW" ? await adapter.requestReview({ poolId })
        : action.kind === "RETRY" ? await adapter.retryReview({ poolId })
        : action.kind === "WITHDRAW" ? await adapter.withdrawCredit({ poolId })
        : action.kind === "RECOVER" ? await adapter.recoverReserve({ poolId })
        : await adapter.cancelPool({ poolId });
      setWriteResult(next);
    } finally {
      setBusy(false);
    }
  };

  if (result.status === "LOADING") return <PoolFallback><div className="loading-block" role="status">Loading canonical pool state…</div></PoolFallback>;
  if (result.status === "UNCONFIGURED") return <PoolFallback><PageState title="Canonical pool data is not connected" description="No deployed contract read path is configured, so IncidentScope cannot claim this pool exists." action={<Link className="text-link" to="/pools">Return to pool history</Link>} /></PoolFallback>;
  if (result.status === "EMPTY") return <PoolFallback><PageState title="Pool not found" description={result.message} action={<Link className="text-link" to="/pools">Browse credit pools</Link>} /></PoolFallback>;
  if (result.status === "ERROR") return <PoolFallback><PageState tone="warning" title="Pool state could not be loaded" description={result.message} onRetry={() => setReload((value) => value + 1)} /></PoolFallback>;

  const pool = result.data;
  const participant = pool.currentParticipant;
  const impact = participant?.classification ? impactLanguage[participant.classification] : undefined;

  return (
    <section className="page pool-detail-page">
      <Link className="back-link" to="/pools"><ArrowLeft aria-hidden="true" /> Back to pools</Link>
      <header className="pool-detail-header">
        <div><p className="page-context mono">Pool {pool.id}</p><h1>{pool.title}</h1><div className="pool-meta"><PoolStatusLabel status={pool.status} /><span>Provider <span className="mono">{shortAddress(pool.provider)}</span></span></div></div>
        <a className="button secondary" href={pool.incidentUrl} target="_blank" rel="noreferrer" aria-label="Open official incident page">Official incident <ArrowSquareOut aria-hidden="true" /></a>
      </header>

      <div className="summary-grid" aria-label="Pool summary">
        <Summary label="Funded reserve" value={`${pool.reserveGen} GEN`} />
        <Summary label="Participants" value={String(pool.participantCount)} />
        <Summary label="Impacted" value={String(pool.impactedCount)} />
        <Summary label="Reserve remaining" value={`${pool.remainingReserveGen} GEN`} />
      </div>

      {participant ? <section className="participant-result"><div className="participant-heading"><Users aria-hidden="true" /><div><span>Your mutually accepted capability · <span className="mono">{participant.capabilityId}</span></span><strong>{participant.dependencyProfile}</strong></div></div>{impact ? <div className={`impact-result impact-${participant.classification?.toLowerCase()}`}><CheckCircle aria-hidden="true" /><div><strong>{impact.label}</strong><p>{impact.description} {participant.creditGen > 0 ? `${participant.creditGen} GEN is allocated.` : "No credit or penalty applies."}</p></div></div> : <div className="impact-result"><Info aria-hidden="true" /><div><strong>Waiting for a scope decision</strong><p>Your profile is locked. No credit is available before the decision is finalized.</p></div></div>}</section> : null}

      {writeResult ? <div className={`transaction-banner ${writeResult.status.toLowerCase()}`} role={writeResult.status === "REJECTED" || writeResult.status === "UNAVAILABLE" ? "alert" : "status"}>{writeResultMessage(writeResult)}</div> : null}
      <PoolActionPanel pool={pool} account={account} onAction={act} busy={busy} />

      <div className="detail-columns">
        <section className="detail-panel"><h2>Decision summary</h2><dl className="detail-list"><div><dt>Locked profiles</dt><dd>{pool.participantCount}</dd></div><div><dt>In scope</dt><dd>{pool.impactedCount}</dd></div><div><dt>Ambiguous</dt><dd>{pool.ambiguousCount}</dd></div></dl><p className="panel-note">Aggregate classes explain the outcome. Validator prompts, rationale, payloads, and raw storage stay outside the user workflow.</p></section>
        <section className="detail-panel"><h2>Pool timing</h2><dl className="detail-list"><div><dt>Created</dt><dd>{new Date(pool.createdAt).toLocaleString()}</dd></div><div><dt>Acceptance boundary</dt><dd>{new Date(pool.enrollmentClosesAt).toLocaleString()}</dd></div><div><dt>Current phase</dt><dd><PoolStatusLabel status={pool.status} /></dd></div></dl></section>
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summary-item"><span>{label}</span><strong>{value}</strong></div>;
}

function PoolFallback({ children }: { children: React.ReactNode }) {
  return <section className="page"><header className="page-header"><p className="page-context">Canonical pool state</p><h1>Pool details</h1></header>{children}</section>;
}

function shortAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

function writeResultMessage(result: WriteResult): string {
  if (result.status === "SUBMITTED") return "Transaction submitted. This is not finality; canonical pool state will refresh after finalization.";
  if (result.status === "FINALIZED") return "Transaction finalized successfully. Canonical pool state is reloading.";
  if (result.status === "RETRYABLE") return "Review finalized without a hard consequence. Canonical state allows a retry.";
  return result.message;
}
