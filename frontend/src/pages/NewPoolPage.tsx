import { ArrowLeft, CheckCircle, Info } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useContractAdapter } from "../adapters/ContractAdapterProvider";
import type { WriteResult } from "../domain/types";
import { useWallet } from "../wallet/WalletProvider";

function isHttpsUrl(value: string): boolean {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function NewPoolPage() {
  const adapter = useContractAdapter();
  const { account } = useWallet();
  const [title, setTitle] = useState("");
  const [incidentUrl, setIncidentUrl] = useState("");
  const [enrollmentClosesAt, setEnrollmentClosesAt] = useState("");
  const [reserveGen, setReserveGen] = useState<1 | 2>(1);
  const [result, setResult] = useState<WriteResult>();
  const valid = title.trim().length >= 4 && isHttpsUrl(incidentUrl) && Boolean(enrollmentClosesAt);
  const writeReady = Boolean(account && adapter.configuration.writeConfigured);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid || !writeReady) return;
    setResult(await adapter.createPool({ title: title.trim(), incidentUrl, enrollmentClosesAt: new Date(enrollmentClosesAt).toISOString(), reserveGen }));
  };

  return (
    <section className="page new-pool-page">
      <Link className="back-link" to="/pools"><ArrowLeft aria-hidden="true" /> Back to pools</Link>
      <header className="page-header narrow"><p className="page-context">Provider workflow</p><h1>Create a credit pool</h1><p>Define one official incident source and pre-fund a bounded reserve before validators review any dependency profile.</p></header>
      <form className="form-layout" onSubmit={(event) => void submit(event)}>
        <div className="form-panel">
          <div className="form-section"><h2>Pool identity</h2><div className="field-group"><label htmlFor="pool-title">Pool name</label><input id="pool-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={4} maxLength={80} placeholder="API incident credit" required aria-describedby="pool-title-help" /><small id="pool-title-help">Use a name participants can recognize in history.</small></div></div>
          <div className="form-section"><h2>Official evidence</h2><div className="field-group"><label htmlFor="incident-url">Official incident URL</label><input id="incident-url" type="url" value={incidentUrl} onChange={(event) => setIncidentUrl(event.target.value)} placeholder="https://status.provider.example/incidents/..." required aria-describedby="incident-url-help" /><small id="incident-url-help">Must be an HTTPS page on the provider's allowlisted status domain.</small></div></div>
          <div className="form-section form-grid"><div><h2>Acceptance</h2><div className="field-group"><label htmlFor="enrollment-closes">Invitation acceptance closes</label><input id="enrollment-closes" type="datetime-local" value={enrollmentClosesAt} onChange={(event) => setEnrollmentClosesAt(event.target.value)} required aria-describedby="enrollment-help" /><small id="enrollment-help">No invitation or acceptance is legal at or after this boundary.</small></div></div><div><h2>Value</h2><div className="field-group"><label htmlFor="credit-reserve">Credit reserve</label><select id="credit-reserve" value={reserveGen} onChange={(event) => setReserveGen(Number(event.target.value) as 1 | 2)} aria-describedby="reserve-help"><option value={1}>1 GEN</option><option value={2}>2 GEN</option></select><small id="reserve-help">The exact reserve is locked only after finalization.</small></div></div></div>
        </div>
        <aside className="review-panel" aria-label="Pool review summary"><h2>Review</h2><dl><div><dt>Name</dt><dd>{title.trim() || "Not set"}</dd></div><div><dt>Official source</dt><dd>{incidentUrl || "Not set"}</dd></div><div><dt>Reserve</dt><dd>{reserveGen} GEN</dd></div></dl><div className="honesty-note"><Info aria-hidden="true" /><p>Wallet approval is not finality. After submission, IncidentScope waits for finalized state and reloads the pool.</p></div>{!writeReady ? <p className="form-blocker" role="status">Your wallet and contract writes must be ready before funding.</p> : null}{result?.status === "UNAVAILABLE" || result?.status === "REJECTED" ? <p className="form-error" role="alert">{result.message}</p> : null}{result?.status === "SUBMITTED" ? <div className="submitted-note" role="status"><CheckCircle aria-hidden="true" /><span>Transaction submitted. Finality is still pending.</span></div> : null}{result?.status === "FINALIZED" ? <div className="submitted-note" role="status"><CheckCircle aria-hidden="true" /><span>Pool finalized as {result.poolId}. Canonical state is ready.</span></div> : null}<button className="button primary full-width" type="submit" disabled={!valid || !writeReady}>Review and fund pool</button></aside>
      </form>
    </section>
  );
}
