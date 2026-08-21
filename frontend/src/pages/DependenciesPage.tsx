import { ArrowRight, Stack } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContractAdapter } from "../adapters/ContractAdapterProvider";
import { PageState } from "../components/PageState";
import type { DependencyProfile, ReadResult } from "../domain/types";
import { useCanonicalReload } from "../transactions/useCanonicalReload";
import { useWallet } from "../wallet/WalletProvider";

const impactLabels = { IMPACTED: "In incident scope", NOT_IMPACTED: "Outside stated incident scope", AMBIGUOUS: "Scope not clear enough" } as const;

export function DependenciesPage() {
  const adapter = useContractAdapter();
  const { account } = useWallet();
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<ReadResult<DependencyProfile[]> | { status: "LOADING" }>({ status: "LOADING" });
  useCanonicalReload(useCallback(() => setReload((value) => value + 1), []));

  useEffect(() => {
    if (!account) return;
    let active = true;
    setResult({ status: "LOADING" });
    void adapter.listDependencies(account).then((next) => { if (active) setResult(next); });
    return () => { active = false; };
  }, [account, adapter, reload]);

  return (
    <section className="page dependencies-page">
      <header className="page-header narrow"><p className="page-context">Integrator history</p><h1>Your dependencies</h1><p>Return to every dependency profile locked by the connected account and see its canonical pool outcome.</p></header>
      {!account ? <PageState title="Connect to view your dependencies" description="Dependency profiles are account-scoped. Select a detected wallet; IncidentScope never guesses which account to use." action={<Link className="text-link" to="/help">Why profiles are locked</Link>} /> : null}
      {account && result.status === "LOADING" ? <div className="loading-block" role="status">Loading your canonical dependency history…</div> : null}
      {account && result.status === "UNCONFIGURED" ? <PageState title="Canonical dependency data is not connected" description="The account is connected, but no Intelligent Contract read path is configured. No example profiles are shown." /> : null}
      {account && result.status === "EMPTY" ? <PageState title="No dependency profiles yet" description={result.message} action={<Link className="text-link" to="/pools">Find an open pool</Link>} /> : null}
      {account && result.status === "ERROR" ? <PageState tone="warning" title="Dependency history could not be loaded" description={result.message} onRetry={() => setReload((value) => value + 1)} /> : null}
      {account && result.status === "READY" && result.data.length === 0 ? <PageState title="No dependency profiles yet" description="Join an open pool to lock your first dependency profile." action={<Link className="text-link" to="/pools">Find an open pool</Link>} /> : null}
      {account && result.status === "READY" && result.data.length > 0 ? <div className="dependency-list">{result.data.map((item) => <article className="dependency-card" key={`${item.poolId}-${item.enrolledAt}`}><div className="dependency-icon"><Stack aria-hidden="true" /></div><div className="dependency-copy"><div className="dependency-meta"><Link to={`/pools/${item.poolId}`}>{item.poolTitle}</Link><span>{new Date(item.enrolledAt).toLocaleString()}</span></div><h2>{item.profile}</h2><div className="dependency-outcome"><span>{item.classification ? impactLabels[item.classification] : "Waiting for a scope decision"}</span>{item.creditGen > 0 && !item.withdrawn ? <strong>{item.creditGen} GEN available</strong> : item.withdrawn ? <strong>Credit withdrawn</strong> : <strong>No withdrawable credit</strong>}</div></div><Link className="icon-link" to={`/pools/${item.poolId}`} aria-label={`Open ${item.poolTitle}`}><ArrowRight aria-hidden="true" /></Link></article>)}</div> : null}
    </section>
  );
}
