import type { Eip1193Provider } from "./types";


export const STUDIONET_NETWORK = {
  chainId: 61999,
  chainIdHex: "0xf22f",
  chainName: "GenLayer Studionet",
  rpcUrl: "https://studio.genlayer.com/api",
  explorerUrl: "https://explorer-studio.genlayer.com",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
} as const;


function errorCode(cause: unknown): number | undefined {
  if (typeof cause !== "object" || cause === null || !("code" in cause)) return undefined;
  return typeof cause.code === "number" ? cause.code : undefined;
}


export async function ensureStudionetWalletChain(provider: Eip1193Provider): Promise<void> {
  const current = await provider.request({ method: "eth_chainId" });
  if (current === STUDIONET_NETWORK.chainIdHex) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_NETWORK.chainIdHex }],
    });
  } catch (cause) {
    if (errorCode(cause) !== 4902) throw cause;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: STUDIONET_NETWORK.chainIdHex,
          chainName: STUDIONET_NETWORK.chainName,
          rpcUrls: [STUDIONET_NETWORK.rpcUrl],
          blockExplorerUrls: [STUDIONET_NETWORK.explorerUrl],
          nativeCurrency: STUDIONET_NETWORK.nativeCurrency,
        },
      ],
    });
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_NETWORK.chainIdHex }],
    });
  }
}
