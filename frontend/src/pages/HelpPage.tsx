import { ArrowRight, FileText, LinkSimple, WarningCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const results = [
  { value: "IMPACTED", label: "In incident scope", description: "The profile is covered by the official incident narrative. A finalized credit may open." },
  { value: "NOT_IMPACTED", label: "Outside stated incident scope", description: "The narrative does not cover the profile. No credit and no penalty applies." },
  { value: "AMBIGUOUS", label: "Scope not clear enough", description: "The official wording cannot support a hard consequence. No credit or penalty moves." },
] as const;

export function HelpPage() {
  return (
    <section className="page help-page">
      <header className="page-header narrow">
        <p className="page-context">Evidence and recovery</p>
        <h1>Help and evidence model</h1>
        <p>Understand what validators inspect, what each result means, and what to do when a source or transaction cannot complete.</p>
      </header>

      <section className="help-panel" aria-labelledby="official-evidence-heading">
        <div className="help-icon"><LinkSimple aria-hidden="true" /></div>
        <div><h2 id="official-evidence-heading">The official source boundary</h2><p>Each pool names one allowlisted HTTPS incident URL on the service provider's own status domain. Validators fetch that exact page; claimant uploads, screenshots, and private logs are excluded.</p><p>The accepted review binds the exact fetched content before interpreting its meaning.</p></div>
      </section>

      <section className="help-section" aria-labelledby="results-heading">
        <div className="section-heading"><h2 id="results-heading">Three result classes</h2><p>Every locked profile appears exactly once. Class names remain visible so the onchain meaning is not softened or changed.</p></div>
        <div className="result-list">
          {results.map((result) => <article key={result.value}><code>{result.value}</code><div><h3>{result.label}</h3><p>{result.description}</p></div></article>)}
        </div>
      </section>

      <section className="help-panel warning-panel" aria-labelledby="unavailable-heading">
        <div className="help-icon"><WarningCircle aria-hidden="true" /></div>
        <div><h2 id="unavailable-heading">When official evidence is unavailable</h2><p>The review becomes retryable and no credit or penalty moves. A provider may retry only while the pool's recovery rules still allow it; users should reload canonical state before acting again.</p></div>
      </section>

      <section className="help-section" aria-labelledby="questions-heading">
        <div className="section-heading"><h2 id="questions-heading">Common questions</h2></div>
        <div className="faq-list">
          <details><summary>Why must dependency profiles be locked first?</summary><p>Precommitment prevents a participant from rewriting a dependency after learning the incident wording.</p></details>
          <details><summary>Does an impacted result prove downtime?</summary><p>No. It proves only that the locked dependency falls inside the provider's officially stated incident scope.</p></details>
          <details><summary>When can I withdraw a credit?</summary><p>Only after the accepted decision is finalized, your profile is impacted, and canonical state shows a positive unwithdrawn credit.</p></details>
        </div>
      </section>

      <div className="help-footer"><FileText aria-hidden="true" /><div><strong>Connection problem?</strong><p>Writes remain disabled until you explicitly select a detected wallet and the supported network is ready.</p></div><Link className="text-link" to="/settings">Review wallet and network settings <ArrowRight aria-hidden="true" /></Link></div>
    </section>
  );
}
