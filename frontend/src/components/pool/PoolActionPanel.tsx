import { ArrowClockwise, CheckCircle, LockKey, MagnifyingGlass, UserPlus, Wallet, XCircle } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import type { PoolDetail } from "../../domain/types";

export type PoolUiAction =
  | { kind: "INVITE"; integrator: string; capabilityId: string; dependencyProfile: string }
  | { kind: "ACCEPT" }
  | { kind: "LOCK" }
  | { kind: "REVIEW" }
  | { kind: "RETRY" }
  | { kind: "WITHDRAW" }
  | { kind: "RECOVER" }
  | { kind: "CANCEL" };

interface PoolActionPanelProps {
  pool: PoolDetail;
  account?: string;
  onAction(action: PoolUiAction): void | Promise<void>;
  busy?: boolean;
}

export function PoolActionPanel({ pool, account, onAction, busy = false }: PoolActionPanelProps) {
  const [integrator, setIntegrator] = useState("");
  const [capabilityId, setCapabilityId] = useState("");
  const [profile, setProfile] = useState("");
  const actions = new Set(pool.availableActions);
  const isProvider = account?.toLowerCase() === pool.provider.toLowerCase();
  const participant = pool.currentParticipant;
  const invitation = pool.pendingInvitation;

  if (!account) {
    return <ActionMessage title="Connect to see your next action" description="Read-only pool state remains available. Select a wallet before any invitation, acceptance, review, or withdrawal action." />;
  }

  const cards: React.ReactNode[] = [];

  if (actions.has("INVITE") && isProvider) {
    const submit = (event: FormEvent) => {
      event.preventDefault();
      const nextIntegrator = integrator.trim();
      const nextCapabilityId = capabilityId.trim();
      const dependencyProfile = profile.trim();
      if (!nextIntegrator || nextCapabilityId.length < 3 || dependencyProfile.length < 20) return;
      void onAction({ kind: "INVITE", integrator: nextIntegrator, capabilityId: nextCapabilityId, dependencyProfile });
    };
    cards.push(
      <ActionCard key="invite" title="Invite an integrator" description="Author the exact address-bound capability profile. The named integrator must accept it unchanged before review.">
        <form className="dependency-form" onSubmit={submit}>
          <label htmlFor="invite-integrator">Integrator address</label>
          <input id="invite-integrator" value={integrator} onChange={(event) => setIntegrator(event.target.value)} placeholder="0x…" required />
          <label htmlFor="invite-capability">Capability ID</label>
          <input id="invite-capability" value={capabilityId} onChange={(event) => setCapabilityId(event.target.value)} minLength={3} maxLength={64} placeholder="api.responses" required />
          <label htmlFor="invite-profile">Capability profile</label>
          <textarea id="invite-profile" value={profile} onChange={(event) => setProfile(event.target.value)} minLength={20} maxLength={600} rows={5} placeholder="Programmatic API requests used by the production agent." required />
          <small>{profile.trim().length}/600 characters · minimum 20</small>
          <button className="button primary" type="submit" disabled={busy || !integrator.trim() || capabilityId.trim().length < 3 || profile.trim().length < 20}><UserPlus aria-hidden="true" /> Invite integrator</button>
        </form>
      </ActionCard>,
    );
  }

  if (actions.has("ACCEPT") && invitation && account.toLowerCase() === invitation.integrator.toLowerCase()) {
    cards.push(
      <ActionCard key="accept" title="Accept your capability profile" description="The sponsor authored this exact profile. Acceptance locks it unchanged for the validator review.">
        <dl className="invitation-review"><div><dt>Capability ID</dt><dd className="mono">{invitation.capabilityId}</dd></div><div><dt>Exact profile</dt><dd>{invitation.dependencyProfile}</dd></div></dl>
        <button className="button primary" type="button" disabled={busy} onClick={() => void onAction({ kind: "ACCEPT" })}><CheckCircle aria-hidden="true" /> Accept and lock dependency</button>
      </ActionCard>,
    );
  }

  if (actions.has("LOCK") && isProvider) cards.push(<ActionCard key="lock" title="Accepted profiles are ready" description="Lock the exact accepted profile set. No invitation or acceptance can be added afterward."><button className="button primary" type="button" disabled={busy} onClick={() => void onAction({ kind: "LOCK" })}><LockKey aria-hidden="true" /> Lock enrollment</button></ActionCard>);
  if (actions.has("REVIEW") && isProvider) cards.push(<ActionCard key="review" title="Enrollment is locked" description="Request a validator review of the exact official incident page and every mutually accepted profile."><button className="button primary" type="button" disabled={busy} onClick={() => void onAction({ kind: "REVIEW" })}><MagnifyingGlass aria-hidden="true" /> Request official review</button></ActionCard>);
  if (actions.has("RETRY") && isProvider) cards.push(<ActionCard key="retry" title="Official evidence was not verifiable" description="No credit or penalty moved. Retry only after the official source is available and canonical state still permits it."><button className="button primary" type="button" disabled={busy} onClick={() => void onAction({ kind: "RETRY" })}><ArrowClockwise aria-hidden="true" /> Retry official review</button></ActionCard>);
  if (actions.has("WITHDRAW") && participant?.classification === "IMPACTED" && participant.creditGen > 0 && !participant.withdrawn) cards.push(<ActionCard key="withdraw" title="Your credit is ready" description="The finalized decision places your locked capability in scope. Withdrawal can complete only once."><button className="button primary" type="button" disabled={busy} onClick={() => void onAction({ kind: "WITHDRAW" })}><Wallet aria-hidden="true" /> Withdraw {participant.creditGen} GEN</button></ActionCard>);
  if (actions.has("RECOVER") && isProvider) {
    const hasRecoverableReserve = pool.sponsorRecoverableGen > 0;
    cards.push(<ActionCard
      key="recover"
      title={hasRecoverableReserve ? "Sponsor reserve is recoverable" : "Settlement can be closed"}
      description={hasRecoverableReserve
        ? "Only the canonical remainder or expired value can return. Live participant credits remain protected."
        : "No sponsor reserve remains. This canonical write closes the settled pool without moving value."}
    ><button className="button secondary" type="button" disabled={busy} onClick={() => void onAction({ kind: "RECOVER" })}><Wallet aria-hidden="true" /> {hasRecoverableReserve ? `Recover ${pool.sponsorRecoverableGen} GEN` : "Close settled pool"}</button></ActionCard>);
  }
  if (actions.has("CANCEL") && isProvider) cards.push(<ActionCard key="cancel" title="Safe cancellation is available" description="Canonical state confirms that cancellation cannot take a live decided credit. The remaining reserve returns once."><button className="button secondary danger-button" type="button" disabled={busy} onClick={() => void onAction({ kind: "CANCEL" })}><XCircle aria-hidden="true" /> Cancel pool safely</button></ActionCard>);

  return cards.length > 0 ? <div className="action-stack">{cards}</div> : <ActionMessage title="No action is available now" description="This account has no legal write in the pool's current canonical state. History remains available below." />;
}

function ActionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="action-card"><div><h2>{title}</h2><p>{description}</p></div>{children}</section>;
}

function ActionMessage({ title, description }: { title: string; description: string }) {
  return <section className="action-card quiet"><h2>{title}</h2><p>{description}</p></section>;
}
