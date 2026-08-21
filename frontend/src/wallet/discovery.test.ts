import { detectInjectedWallets, startWalletDiscovery } from "./discovery";
import type { Eip1193Provider } from "./types";

describe("wallet discovery", () => {
  it("collects an EIP-6963 provider without requesting accounts", () => {
    const request = vi.fn();
    const provider: Eip1193Provider = { request };
    const discovered = vi.fn();
    const announce = () => {
      window.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: {
            info: {
              uuid: "wallet-a",
              name: "Wallet A",
              icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
              rdns: "test.wallet.a",
            },
            provider,
          },
        }),
      );
    };
    window.addEventListener("eip6963:requestProvider", announce, { once: true });

    const stop = startWalletDiscovery(window, discovered);

    expect(discovered).toHaveBeenCalledWith(
      expect.objectContaining({ id: "wallet-a", name: "Wallet A", provider }),
    );
    expect(request).not.toHaveBeenCalled();
    stop();
  });

  it("deduplicates injected fallbacks and names common wallet providers", () => {
    const metaMask = { request: vi.fn(), isMetaMask: true } satisfies Eip1193Provider;
    const rabby = { request: vi.fn(), isRabby: true } satisfies Eip1193Provider;
    const browserWindow = {
      ethereum: { ...metaMask, providers: [metaMask, rabby] },
      rabby,
    } as unknown as Window;

    const providers = detectInjectedWallets(browserWindow);

    expect(providers.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "injected-metamask", name: "MetaMask" },
      { id: "injected-rabby", name: "Rabby" },
    ]);
    expect(providers[1]?.provider).toBe(rabby);
  });
});
