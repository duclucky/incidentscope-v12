import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ContractAdapterProvider } from "../adapters/ContractAdapterProvider";
import { createUnconfiguredContractAdapter } from "../adapters/unconfiguredContract";
import type { ContractAdapter } from "../adapters/contract";
import type { PoolDetail } from "../domain/types";
import { WalletProvider } from "../wallet/WalletProvider";
import { PoolDetailPage } from "./PoolDetailPage";

const pool: PoolDetail = {
  id: "pool-1", title: "API incident credit", provider: "0xprovider", status: "DECIDED",
  reserveGen: 2, enrollmentClosesAt: "2026-08-22T00:00:00Z", incidentUrl: "https://status.openai.com/incidents/01KZSC0T66YTVM57N5T79SV8ZV",
  createdAt: "2026-08-21T00:00:00Z", participantCount: 3, impactedCount: 1, ambiguousCount: 1,
  remainingReserveGen: 1, sponsorRecoverableGen: 0, availableActions: [], currentParticipant: { account: "0xintegrator", capabilityId: "api.responses", dependencyProfile: "Programmatic API requests", classification: "IMPACTED", creditGen: 1, withdrawn: false },
};

describe("PoolDetailPage", () => {
  it("renders canonical product state without validator internals", async () => {
    const base = createUnconfiguredContractAdapter();
    const adapter: ContractAdapter = { ...base, configuration: { ...base.configuration, readConfigured: true }, getPool: vi.fn(async () => ({ status: "READY" as const, data: pool })) };
    render(
      <MemoryRouter initialEntries={["/pools/pool-1"]}>
        <ContractAdapterProvider adapter={adapter}><WalletProvider><Routes><Route path="/pools/:poolId" element={<PoolDetailPage />} /></Routes></WalletProvider></ContractAdapterProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "API incident credit", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open official incident page" })).toHaveAttribute("href", pool.incidentUrl);
    expect(screen.getByText("In incident scope")).toBeInTheDocument();
    expect(screen.getByText("Connect to see your next action")).toBeInTheDocument();
    expect(screen.queryByText(/validator payload|attempt id|evidence digest/i)).not.toBeInTheDocument();
  });
});
