import { ArrowRight, CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContractAdapter } from "../adapters/ContractAdapterProvider";
import { PageState } from "../components/PageState";
import type { ActivityItem, ReadResult, TransactionStage } from "../domain/types";
import { useCanonicalReload } from "../transactions/useCanonicalReload";
import { useWallet } from "../wallet/WalletProvider";

const stageLanguage: Record<TransactionStage, string> = {
  SUBMITTED: "Submitted — awaiting acceptance", ACCEPTED: "Accepted — not finalized",
  DECIDED: "Decision accepted — not finalized", FINALIZED: "Finalized",
  FAILED: "Failed", RETRYABLE: "Retry available",
};

export function ActivityPage() {
  const adapter = useContractAdapter();
  const { account } = useWallet();
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<ReadResult<ActivityItem[]> | { status: "LOADING" }>({ status: "LOADING" });
  useCanonicalReload(useCallback(() => setReload((value) => value + 1), []));

  useEffect(() => {
    if (!account) return;
    let active = true;
    setResult({ status: "LOADING" });
    void adapter.listActivity(account).then((next) => { if (active) setResult(next); });
    return () => { active = false; };
  }, [account, adapter, reload]);

  return (
    <section className="page activity-page">
      <header className="page-header narrow"><p className="page-context">Wallet and canonical milestones</p><h1>Activity</h1><p>Track submissions separately from accepted decisions and finalization. A wallet approval is never displayed as a completed outcome.</p></header>
      {!account ? <PageState title="Connect to view account activity" description="Select the wallet that submitted or received the action. Public pool history remains available without a connection." action={<Link className="text-link" to="/pools">Browse public pools</Link>} /> : null}
      {account && result.status === "LOADING" ? <div className="loading-block" role="status">Loading canonical activity…</div> : null}
      {account && result.status === "UNCONFIGURED" ? <PageState title="Canonical activity is not connected" description="No contract read path is configured, so IncidentScope does not invent transaction history." /> : null}
      {account && result.status === "EMPTY" ? <PageState title="No account activity yet" description={result.message} action={<Link className="text-link" to="/pools">Explore credit pools</Link>} /> : null}
      {account && result.status === "ERROR" ? <PageState tone="warning" title="Activity could not be loaded" description={result.message} onRetry={() => setReload((value) => value + 1)} /> : null}
      {account && result.status === "READY" && result.data.length === 0 ? <PageState title="No account activity yet" description="Submitted and finalized pool actions will appear here after canonical reads." /> : null}
      {account && result.status === "READY" && result.data.length > 0 ? <ol className="activity-list">{result.data.map((item) => <ActivityRow key={item.id} item={item} />)}</ol> : null}
    </section>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.stage === "FINALIZED" ? CheckCircle : item.stage === "FAILED" || item.stage === "RETRYABLE" ? WarningCircle : Clock;
  return <li className={`activity-row stage-${item.stage.toLowerCase()}`}><span className="activity-icon"><Icon aria-hidden="true" /></span><div><span>{stageLanguage[item.stage]}</span><h2>{item.title}</h2><time dateTime={item.occurredAt}>{new Date(item.occurredAt).toLocaleString()}</time>{item.transactionHash ? <details><summary>Transaction details</summary><code>{item.transactionHash}</code></details> : null}</div><Link className="icon-link" to={`/pools/${item.poolId}`} aria-label={`Open pool for ${item.title}`}><ArrowRight aria-hidden="true" /></Link></li>;
}
