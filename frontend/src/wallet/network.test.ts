import { STUDIONET_NETWORK, ensureStudionetWalletChain } from "./network";
import type { Eip1193Provider } from "./types";


describe("Studionet wallet network", () => {
  it("uses the current official chain parameters", () => {
    expect(STUDIONET_NETWORK).toEqual({
      chainId: 61999,
      chainIdHex: "0xf22f",
      chainName: "GenLayer Studionet",
      rpcUrl: "https://studio.genlayer.com/api",
      explorerUrl: "https://explorer-studio.genlayer.com",
      nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
    });
  });

  it("does nothing when the selected provider is already on Studionet", async () => {
    const request = vi.fn().mockResolvedValue("0xf22f");
    await ensureStudionetWalletChain({ request });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({ method: "eth_chainId" });
  });

  it("switches the selected provider without touching a global provider", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce("0x1")
      .mockResolvedValueOnce(null);
    await ensureStudionetWalletChain({ request });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xf22f" }],
    });
  });

  it("adds then switches the selected provider when chain 61999 is unknown", async () => {
    const unknownChain = Object.assign(new Error("Unknown chain"), { code: 4902 });
    const request = vi
      .fn()
      .mockResolvedValueOnce("0x1")
      .mockRejectedValueOnce(unknownChain)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    await ensureStudionetWalletChain({ request } as Eip1193Provider);
    expect(request).toHaveBeenNthCalledWith(3, {
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0xf22f",
          chainName: "GenLayer Studionet",
          rpcUrls: ["https://studio.genlayer.com/api"],
          blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
        },
      ],
    });
    expect(request).toHaveBeenNthCalledWith(4, {
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xf22f" }],
    });
  });
});
