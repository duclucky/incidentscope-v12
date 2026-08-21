import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContractAdapter } from "../adapters/ContractAdapterProvider";
import { PageState } from "../components/PageState";
import type { PoolStatusFilter, PoolSummary, ReadResult } from "../domain/types";
import { useCanonicalReload } from "../transactions/useCanonicalReload";

const statusLabels = {
  ENROLLING: "Open for dependency acceptance", LOCKED: "Enrollment locked",
  RETRYABLE: "Evidence retry available", DECIDED: "Decision finalized",
  CLOSED: "Credits settled", CANCELLED: "Cancelled safely",
} as const;

export function PoolsPage() {
  const adapter = useContractAdapter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PoolStatusFilter>("ALL");
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<ReadResult<PoolSummary[]> | { status: "LOADING" }>({ status: "LOADING" });
  useCanonicalReload(useCallback(() => setReload((value) => value + 1), []));

  useEffect(() => {
    let active = true;
    setResult({ status: "LOADING" });
    void adapter.listPools({ query, status }).then((next) => { if (active) setResult(next); });
    return () => { active = false; };
  }, [adapter, query, status, reload]);

  return (
    <section className="page pools-page">
      <header className="page-title-row">
        <div><p className="page-context">Canonical history</p><h1>Credit pools</h1><p>Find an open enrollment, resume a review, or verify a finalized credit outcome.</p></div>
        <Link className="button primary" to="/pools/new"><Plus aria-hidden="true" /> Create pool</Link>
      </header>
      <div className="filter-bar">
        <label className="search-field"><span>Search pools</span><div><MagnifyingGlass aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or pool ID" /></div></label>
        <label><span>Pool status</span><select value={status} onChange={(event) => setStatus(event.target.value as PoolStatusFilter)}><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {result.status === "LOADING" ? <div className="loading-block" role="status">Loading canonical pool history…</div> : null}
      {result.status === "UNCONFIGURED" ? <PageState title="Canonical pool data is not connected" description="The product is ready, but this build has no deployed contract read path yet. No sample pools are shown as onchain state." action={<Link className="text-link" to="/help">Review how canonical reads work</Link>} /> : null}
      {result.status === "ERROR" ? <PageState tone="warning" title="Pool history could not be loaded" description={result.message} onRetry={() => setReload((value) => value + 1)} /> : null}
      {result.status === "EMPTY" ? <PageState title="No credit pools yet" description={result.message} action={<Link className="text-link" to="/pools/new">Create the first pool</Link>} /> : null}
      {result.status === "READY" && result.data.length === 0 ? <PageState title="No pools match these filters" description="Clear the search or choose a different pool status." /> : null}
      {result.status === "READY" && result.data.length > 0 ? <PoolTable pools={result.data} /> : null}
    </section>
  );
}

function PoolTable({ pools }: { pools: PoolSummary[] }) {
  return (
    <div className="table-wrap"><table className="product-table"><thead><tr><th>Pool</th><th>Status</th><th>Reserve</th><th>Acceptance closes</th><th><span className="visually-hidden">Open</span></th></tr></thead><tbody>{pools.map((pool) => <tr key={pool.id}><td data-label="Pool"><Link to={`/pools/${pool.id}`}><strong>{pool.title}</strong><span className="mono">{pool.id}</span></Link></td><td data-label="Status"><span className={`status-badge status-${pool.status.toLowerCase()}`}>{statusLabels[pool.status]}</span></td><td data-label="Reserve"><strong>{pool.reserveGen} GEN</strong></td><td data-label="Acceptance closes">{new Date(pool.enrollmentClosesAt).toLocaleString()}</td><td><Link className="row-link" to={`/pools/${pool.id}`} aria-label={`Open ${pool.title}`}>Open</Link></td></tr>)}</tbody></table></div>
  );
}
