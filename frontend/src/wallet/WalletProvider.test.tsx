import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WalletProvider, useWallet } from "./WalletProvider";
import type { WalletDescriptor } from "./types";

function WalletProbe() {
  const wallet = useWallet();
  const first = wallet.providers[0];
  return (
    <div>
      <span>{wallet.account ?? "Disconnected"}</span>
      <button type="button" onClick={() => first && wallet.connect(first)}>
        Choose wallet
      </button>
      <button type="button" onClick={wallet.disconnect}>
        Disconnect
      </button>
    </div>
  );
}

describe("WalletProvider", () => {
  it("requests accounts only after explicit selection and clears the session on disconnect", async () => {
    const user = userEvent.setup();
    const request = vi.fn(async ({ method }: { method: string }) =>
      method === "eth_requestAccounts"
        ? ["0x1234567890abcdef1234567890abcdef12345678"]
        : "0xf22f",
    );
    const provider: WalletDescriptor = {
      id: "wallet-a",
      name: "Wallet A",
      source: "EIP6963",
      provider: { request },
    };
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: provider.provider,
    });
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Choose wallet" }));
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    expect(request).toHaveBeenCalledWith({ method: "eth_chainId" });
    expect(await screen.findByText("0x1234567890abcdef1234567890abcdef12345678")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    Reflect.deleteProperty(window, "ethereum");
  });
});
