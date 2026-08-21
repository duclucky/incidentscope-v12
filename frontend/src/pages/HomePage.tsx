import { ArrowRight, CheckCircle, LockKey, MagnifyingGlass, Wallet } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section" aria-labelledby="home-heading">
        <div className="hero-copy">
          <p className="hero-statement">Provider-funded credits, independently scoped.</p>
          <h1 id="home-heading">Decide incident scope before credits move</h1>
          <p className="hero-lead">
            Providers lock a 1-2 GEN reserve. Integrators lock dependency profiles. GenLayer validators
            read the provider's official status incident page and decide the exact impacted set.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/pools">Explore credit pools <ArrowRight aria-hidden="true" /></Link>
            <Link className="text-link" to="/help">Read the evidence rules</Link>
          </div>
          <div className="hero-proof"><CheckCircle aria-hidden="true" /><span>No verified scope, no credit or penalty moves.</span></div>
        </div>
        <figure className="hero-visual">
          <img src="/incidentscope-scope-hero.png" alt="Dependency paths pass through a bounded incident-scope decision." />
          <figcaption>Many dependency claims enter. Only the validator-accepted exact set opens credits.</figcaption>
        </figure>
      </section>

      <section className="content-section" aria-labelledby="boundary-heading">
        <div className="section-heading">
          <h2 id="boundary-heading">How the credit boundary works</h2>
          <p>Each step closes a different way one party could choose the outcome alone.</p>
        </div>
        <ol className="process-grid">
          <li><span className="process-icon"><Wallet aria-hidden="true" /></span><strong>Fund before review</strong><p>The provider commits a small GEN reserve and bounded incident terms.</p></li>
          <li><span className="process-icon"><LockKey aria-hidden="true" /></span><strong>Lock dependencies</strong><p>Integrators enroll descriptions before the incident review begins.</p></li>
          <li><span className="process-icon"><MagnifyingGlass aria-hidden="true" /></span><strong>Review official scope</strong><p>Validators fetch the exact official incident page and classify every locked profile once.</p></li>
        </ol>
      </section>

      <section className="role-section" aria-labelledby="roles-heading">
        <div className="section-heading"><h2 id="roles-heading">One pool, two clear jobs</h2></div>
        <div className="role-grid">
          <article><span className="role-number mono">01</span><h3>For service providers</h3><p>Pre-commit a bounded remedy without retaining unilateral control over who qualifies.</p><Link to="/pools/new">Create a pool <ArrowRight aria-hidden="true" /></Link></article>
          <article><span className="role-number mono">02</span><h3>For integrators</h3><p>Record the dependency that matters, then return for a finalized result and any withdrawable credit.</p><Link to="/dependencies">Review your dependencies <ArrowRight aria-hidden="true" /></Link></article>
        </div>
      </section>

      <section className="limits-section" aria-labelledby="limits-heading">
        <div><h2 id="limits-heading">What IncidentScope does not prove</h2><p>It decides whether a pre-enrolled dependency fits the provider's stated incident scope. It does not prove customer-specific downtime, traffic volume, damages, or legal SLA liability.</p></div>
        <ShieldBoundary />
      </section>
    </div>
  );
}

function ShieldBoundary() {
  return (
    <div className="boundary-note"><ShieldCheckIcon /><div><strong>Non-penalizing by design</strong><span>Unavailable, contradictory, or unverifiable official evidence stays retryable.</span></div></div>
  );
}

function ShieldCheckIcon() {
  return <CheckCircle aria-hidden="true" />;
}
