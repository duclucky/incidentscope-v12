import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../App";
import { ContractAdapterProvider } from "../adapters/ContractAdapterProvider";
import { createUnconfiguredContractAdapter } from "../adapters/unconfiguredContract";
import type { ContractAdapter } from "../adapters/contract";
import type { DependencyProfile } from "../domain/types";
import { WalletProvider, useWallet } from "../wallet/WalletProvider";
import { DependenciesPage } from "./DependenciesPage";
import { ActivityPage } from "./ActivityPage";

function ConnectHarness() {
  const wallet = useWallet();
  const first = wallet.providers[0];
  return <button type="button" onClick={() => first && void wallet.connect(first)}>Test connect</button>;
}

describe("account and history pages", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps account-scoped pages honest while disconnected", () => {
    render(<MemoryRouter initialEntries={["/dependencies"]}><AppRoutes /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Connect to view your dependencies" })).toBeInTheDocument();
    expect(screen.queryByText(/sample dependency/i)).not.toBeInTheDocument();
  });

  it("renders canonical dependency history after explicit connection", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "ethereum", { configurable: true, value: { request: vi.fn().mockResolvedValue(["0x1234567890abcdef1234567890abcdef12345678"]), isRabby: true } });
    const base = createUnconfiguredContractAdapter();
    const history: DependencyProfile[] = [{ poolId: "pool-1", poolTitle: "API incident credit", profile: "Programmatic API requests from the production agent", enrolledAt: "2026-08-21T00:00:00Z", poolStatus: "DECIDED", classification: "IMPACTED", creditGen: 1, withdrawn: false }];
    const adapter: ContractAdapter = {
      ...base,
      configuration: { ...base.configuration, readConfigured: true },
      listDependencies: vi.fn(async () => ({ status: "READY" as const, data: history })),
    };
    render(<MemoryRouter><ContractAdapterProvider adapter={adapter}><WalletProvider><ConnectHarness /><DependenciesPage /></WalletProvider></ContractAdapterProvider></MemoryRouter>);

    await user.click(await screen.findByRole("button", { name: "Test connect" }));
    expect(await screen.findByText("Programmatic API requests from the production agent")).toBeInTheDocument();
    expect(screen.getByText("In incident scope")).toBeInTheDocument();
    expect(screen.getByText("1 GEN available")).toBeInTheDocument();
    Reflect.deleteProperty(window, "ethereum");
  });

  it("shows distinct read/write paths and theme controls in Settings", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/settings"]}><AppRoutes /></MemoryRouter>);
    expect(screen.getAllByText("Studionet").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Wallet write path")).toBeInTheDocument();
    expect(screen.getByText("Intelligent Contract read path")).toBeInTheDocument();
    expect(screen.getByText("/genlayer-rpc")).toBeInTheDocument();
    expect(screen.getAllByText("Configured").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Not configured").length).toBeGreaterThanOrEqual(1);
    await user.click(screen.getByRole("button", { name: "Use dark theme" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("keeps submitted and finalized activity labels distinct", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "ethereum", { configurable: true, value: { request: vi.fn().mockResolvedValue(["0x1234567890abcdef1234567890abcdef12345678"]), isRabby: true } });
    const base = createUnconfiguredContractAdapter();
    const adapter: ContractAdapter = {
      ...base,
      configuration: { ...base.configuration, readConfigured: true },
      listActivity: vi.fn(async () => ({ status: "READY" as const, data: [
        { id: "a-1", poolId: "pool-1", title: "Pool funding submitted", stage: "SUBMITTED" as const, occurredAt: "2026-08-21T00:00:00Z" },
        { id: "a-2", poolId: "pool-1", title: "Scope decision finalized", stage: "FINALIZED" as const, occurredAt: "2026-08-21T00:10:00Z" },
      ] })),
    };
    render(<MemoryRouter><ContractAdapterProvider adapter={adapter}><WalletProvider><ConnectHarness /><ActivityPage /></WalletProvider></ContractAdapterProvider></MemoryRouter>);
    await user.click(await screen.findByRole("button", { name: "Test connect" }));
    expect(await screen.findByText("Submitted — awaiting acceptance")).toBeInTheDocument();
    expect(screen.getByText("Finalized")).toBeInTheDocument();
    Reflect.deleteProperty(window, "ethereum");
  });
});
