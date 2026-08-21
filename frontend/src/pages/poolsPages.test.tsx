import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ContractAdapterProvider } from "../adapters/ContractAdapterProvider";
import { createUnconfiguredContractAdapter } from "../adapters/unconfiguredContract";
import type { ContractAdapter } from "../adapters/contract";
import type { PoolSummary } from "../domain/types";
import { AppRoutes } from "../App";
import { PoolsPage } from "./PoolsPage";

const pools: PoolSummary[] = [
  { id: "api-incident", title: "API incident credit", provider: "0xprovider", status: "ENROLLING", reserveGen: 2, enrollmentClosesAt: "2026-08-22T00:00:00Z" },
  { id: "work-mode", title: "Work Mode incident", provider: "0xprovider", status: "DECIDED", reserveGen: 1, enrollmentClosesAt: "2026-08-20T00:00:00Z" },
];

describe("pool product pages", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows the honest unconfigured state instead of sample pools", async () => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "");
    render(<MemoryRouter initialEntries={["/pools"]}><AppRoutes /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Canonical pool data is not connected" })).toBeInTheDocument();
    expect(screen.queryByText("API incident credit")).not.toBeInTheDocument();
  });

  it("searches and filters adapter-backed pool history", async () => {
    const user = userEvent.setup();
    const base = createUnconfiguredContractAdapter();
    const adapter: ContractAdapter = {
      ...base,
      configuration: { ...base.configuration, readConfigured: true },
      listPools: vi.fn(async ({ query, status }) => ({
        status: "READY" as const,
        data: pools.filter((pool) =>
          pool.title.toLowerCase().includes(query.toLowerCase()) &&
          (status === "ALL" || pool.status === status),
        ),
      })),
    };
    render(
      <MemoryRouter>
        <ContractAdapterProvider adapter={adapter}><PoolsPage /></ContractAdapterProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("API incident credit")).toBeInTheDocument();
    expect(screen.getByText("Work Mode incident")).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Search pools" }), "work mode");
    await waitFor(() => expect(screen.queryByText("API incident credit")).not.toBeInTheDocument());
    expect(screen.getByText("Work Mode incident")).toBeInTheDocument();
  });

  it("offers only 1 or 2 GEN and disables funding while writes are unconfigured", async () => {
    render(<MemoryRouter initialEntries={["/pools/new"]}><AppRoutes /></MemoryRouter>);

    const reserve = screen.getByRole("combobox", { name: "Credit reserve" });
    expect(reserve).toHaveTextContent("1 GEN");
    expect(reserve).toHaveTextContent("2 GEN");
    expect(screen.queryByText(/wei|base units/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review and fund pool" })).toBeDisabled();
    expect(screen.getByText(/wallet and contract writes must be ready/i)).toBeInTheDocument();
  });
});
