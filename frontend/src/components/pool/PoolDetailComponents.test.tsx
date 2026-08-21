import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PoolDetail, PoolStatus } from "../../domain/types";
import { PoolActionPanel } from "./PoolActionPanel";
import { PoolStatusLabel } from "./PoolStatusLabel";

const basePool: PoolDetail = {
  id: "pool-1", title: "API incident credit", provider: "0xprovider", status: "ENROLLING",
  reserveGen: 2, enrollmentClosesAt: "2026-08-22T00:00:00Z", incidentUrl: "https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV",
  createdAt: "2026-08-21T00:00:00Z", participantCount: 1, impactedCount: 0, ambiguousCount: 0,
  remainingReserveGen: 2, sponsorRecoverableGen: 0, availableActions: [],
};

describe("pool detail product language", () => {
  it.each([
    ["ENROLLING", "Open for dependency acceptance"],
    ["LOCKED", "Enrollment locked"],
    ["RETRYABLE", "Official evidence could not be verified"], ["DECIDED", "Scope decision finalized"],
    ["CLOSED", "Credits settled"], ["CANCELLED", "Pool cancelled safely"],
  ] as [PoolStatus, string][])('maps %s without changing its meaning', (status, label) => {
    render(<PoolStatusLabel status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("lets the sponsor invite an address-bound capability profile", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<PoolActionPanel pool={{ ...basePool, availableActions: ["INVITE"] }} account="0xprovider" onAction={onAction} />);

    await user.type(screen.getByRole("textbox", { name: "Integrator address" }), "0xintegrator");
    await user.type(screen.getByRole("textbox", { name: "Capability ID" }), "api.responses");
    await user.type(screen.getByRole("textbox", { name: "Capability profile" }), "Programmatic API requests used by the production agent.");
    await user.click(screen.getByRole("button", { name: "Invite integrator" }));

    expect(onAction).toHaveBeenCalledWith({
      kind: "INVITE",
      integrator: "0xintegrator",
      capabilityId: "api.responses",
      dependencyProfile: "Programmatic API requests used by the production agent.",
    });
  });

  it("lets only the named integrator accept the immutable invitation", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const invitation = {
      integrator: "0xintegrator",
      capabilityId: "api.responses",
      dependencyProfile: "Programmatic API requests used by the production agent.",
    };
    render(<PoolActionPanel pool={{ ...basePool, pendingInvitation: invitation, availableActions: ["ACCEPT"] }} account="0xintegrator" onAction={onAction} />);

    expect(screen.getByText("api.responses")).toBeInTheDocument();
    expect(screen.getByText(invitation.dependencyProfile)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept and lock dependency" }));

    expect(onAction).toHaveBeenCalledWith({ kind: "ACCEPT" });
  });

  it("shows lock, review, and retry only when canonical available actions permit them", () => {
    const { rerender } = render(<PoolActionPanel pool={{ ...basePool, availableActions: ["LOCK"] }} account="0xprovider" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Lock enrollment" })).toBeInTheDocument();
    rerender(<PoolActionPanel pool={{ ...basePool, status: "LOCKED", availableActions: ["REVIEW"] }} account="0xprovider" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Request official review" })).toBeInTheDocument();
    rerender(<PoolActionPanel pool={{ ...basePool, status: "RETRYABLE", availableActions: ["RETRY"] }} account="0xprovider" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Retry official review" })).toBeInTheDocument();
  });

  it("offers one withdrawal only when the canonical action is available", () => {
    const impacted: PoolDetail = { ...basePool, status: "DECIDED", availableActions: ["WITHDRAW"], currentParticipant: { account: "0xintegrator", capabilityId: "api.responses", dependencyProfile: "Programmatic API requests", classification: "IMPACTED", creditGen: 1, withdrawn: false } };
    const { rerender } = render(<PoolActionPanel pool={impacted} account="0xintegrator" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Withdraw 1 GEN" })).toBeInTheDocument();
    rerender(<PoolActionPanel pool={{ ...impacted, availableActions: [], currentParticipant: { ...impacted.currentParticipant!, withdrawn: true } }} account="0xintegrator" onAction={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Withdraw/ })).not.toBeInTheDocument();
  });

  it("keeps cancel and reserve recovery contextual", () => {
    const { rerender } = render(<PoolActionPanel pool={{ ...basePool, availableActions: ["CANCEL"] }} account="0xprovider" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancel pool safely" })).toBeInTheDocument();
    rerender(<PoolActionPanel pool={{ ...basePool, status: "DECIDED", sponsorRecoverableGen: 1, availableActions: ["RECOVER"] }} account="0xprovider" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Recover 1 GEN" })).toBeInTheDocument();
  });

  it("keeps the canonical close action available when no reserve remains", () => {
    render(<PoolActionPanel pool={{
      ...basePool,
      status: "DECIDED",
      sponsorRecoverableGen: 0,
      availableActions: ["RECOVER"],
    }} account="0xprovider" onAction={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Close settled pool" })).toBeInTheDocument();
  });
});
